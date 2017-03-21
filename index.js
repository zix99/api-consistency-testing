const _ = require('lodash');
const promise = require('bluebird');
const runner = require('./runner');
const log = require('winston');
const validator = require('./expectations').validate;
const getAllCombinations = require('./util/combiner').getAllCombinations;

const DEFAULT_TIMEOUT = 4000;

const MOCHA_MODE = typeof describe !== 'undefined';
let __currentConfig = {};
const __tests = [];


function buildTestVariations(testSet) {
  return _.reduce(testSet, (accum, test) => _.union(accum, getAllCombinations(test)), []);
}

function buildMochaTests(apiSpec) {
  const description = apiSpec.description ||
  _.join(_.map(apiSpec.steps, step => `${step.method} ${step.uri}`), ' -> ');
  const tagStr = _.join(_.map(apiSpec.tags || [], tag => `@${tag}`), ', ');

  describe(`${tagStr}: ${description}`, () => {
    _.forEach(buildTestVariations(apiSpec.tests), (test) => {
      it(`Test with values: ${JSON.stringify(test)}`, done => {
        this.timeout(apiSpec.timeout || DEFAULT_TIMEOUT);
        runner.executeAllStepsAync(apiSpec.steps, test, apiSpec.config, validator)
          .nodeify(done);
      });
    });
  });
}

function runTestsInteractively(apiSpec) {
  log.info(`Running test: ${apiSpec.spec.description || 'Undefined description'}`);
  const variations = buildTestVariations(apiSpec.spec.tests);
  console.dir(variations);
  return promise.map(variations, test =>
    runner.executeAllStepsAync(apiSpec.spec.steps, test, apiSpec.config, validator)
      .catch((err) => {
        log.warn(`Error processing ${apiSpec.spec.description}: ${err}`);
      }), { concurrency: 1 });
}

/**
* This is the entry-point for all tests
*/
function describeConsistently(apiSpec) {
  __tests.push({ spec: apiSpec, config: __currentConfig });
  if (MOCHA_MODE) {
    buildMochaTests(apiSpec);
  }
}

function evaluateApis() {
  return promise.map(__tests, runTestsInteractively, { concurrency: 1 });
}

/* eslint no-multi-assign: "off" */
const wrapper = module.exports = (opts, func) => {
  __currentConfig = opts;
  func();
  __currentConfig = {};
};
wrapper.describeConsistently = describeConsistently;
wrapper.evaluateApis = evaluateApis;


global.describeConsistently = describeConsistently;
