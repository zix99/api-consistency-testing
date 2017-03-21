const _ = require('lodash');
const promise = require('bluebird');
const request = promise.promisify(require('request'));
const assert = require('chai').assert;
const format = require('string-format');
const log = require('winston');
const deep = require('../util/deep');

function buildPayload(payloadTemplate, context) {
  const clone = _.clone(payloadTemplate);
  return deep.map(clone, (val) => {
    if (_.isString(val)) {
      return format(val, context);
    }
    return val;
  });
}

/* eslint no-param-reassign: "off" */
function executeStepAsync(step, context, validator) {
  const fullUri = format(step.uri, context);

  const requestObject = {
    method: _.get(step, 'method', 'GET'),
    uri: fullUri,
    json: step.payload ? buildPayload(step.payload, context) : true,
  };

  const middleware = context.requestMiddleware || ((req, callback) => callback(null, req));

  log.info(`Making API request to ${step.method} ${fullUri}...`);
  return promise.promisify(middleware)(requestObject)
    .then(req => request(req))
    .catch((err) => {
      log.warn(`Error making request: ${JSON.stringify(err)}`);
    })
    .then((ret) => {
      log.info(`Received ${ret.statusCode}`);
      if (step.expect) assert.equal(ret.statusCode, step.expect, `Unexpected status code after call to ${fullUri}`);
      if (step.validator) step.validator(ret);
      if (step.export) {
        context[step.export] = ret.body;
      }
      return validator(_.pick(ret, ['statusCode', 'body']));
    });
}

/* eslint no-confusing-arrow: "off" */
function executeAllStepsAync(steps, testValues, config, validator) {
  log.info(`Executing steps with: ${JSON.stringify(testValues)}`);
  const context = _.clone(_.merge(config, testValues));
  return promise.map(
    steps,
    step => executeStepAsync(
      step,
      context,
      response => validator ? validator({ step, test: testValues }, response) : {}
      ),
    { concurrency: 1 }
  );
}

module.exports = {
  executeAllStepsAync,
};
