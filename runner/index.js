const _ = require('lodash');
const Promise = require('bluebird');
const log = require('winston');
const runner = require('./apiSpecRunner');
const getAllCombinations = require('../util/combiner').getAllCombinations;
const validator = require('../expectations').validate;

function buildTestVariations(testSet) {
  return _.reduce(testSet, (accum, test) => _.union(accum, getAllCombinations(test)), []);
}

/* Haven't made this work in a while
function buildMochaTests(apiSpec) {
  const DEFAULT_TIMEOUT = 4000;
  const description = apiSpec.description ||
  _.join(_.map(apiSpec.steps, step => `${step.method} ${step.uri}`), ' -> ');
  const tagStr = _.join(_.map(apiSpec.tags || [], tag => `@${tag}`), ', ');

  describe(`${tagStr}: ${description}`, () => {
    _.forEach(buildTestVariations(apiSpec.tests), (test) => {
      it(`Test with values: ${JSON.stringify(test)}`, done => {
        this.timeout(apiSpec.timeout || DEFAULT_TIMEOUT);
        runner.executeAllStepsAync(test, apiSpec.steps, apiSpec.config, validator)
          .nodeify(done);
      });
    });
  });
}
*/

function runTestsInteractively(apiSpec, globalConfig) {
  log.info(`Running test: ${apiSpec.spec.description || 'Undefined description'}`);
  const variations = buildTestVariations(apiSpec.spec.tests);
  console.dir(variations);
  return Promise.map(variations, test =>
    runner.executeAllStepsAync(test, apiSpec.spec.steps, _.merge({}, globalConfig, apiSpec.config, test), validator)
      .catch((err) => {
        log.warn(`Error processing ${apiSpec.spec.description}: ${err}`);
      }), { concurrency: 1 });
}

module.exports = {
  apiSpecRunner: runner,
  runTestsInteractively
};
