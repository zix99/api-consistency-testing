const Promise = require('bluebird');
const runner = require('./runner');

const MOCHA_MODE = typeof describe !== 'undefined';
let __currentConfig = {};
const __tests = [];

const wrapper = (opts, func) => {
  __currentConfig = opts;
  func();
  __currentConfig = {};
};

/**
* This is the entry-point for all tests
*/
function describeConsistently(apiSpec) {
  __tests.push({ spec: apiSpec, config: __currentConfig });
  if (MOCHA_MODE) {
    // buildMochaTests(apiSpec);
  }
}

function evaluateApis() {
  return Promise.map(__tests, test => runner.runTestsInteractively(test, wrapper.globalConfig), { concurrency: 1 });
}

wrapper.describeConsistently = describeConsistently;
wrapper.evaluateApis = evaluateApis;
wrapper.globalConfig = {};

module.exports = wrapper;
global.describeConsistently = describeConsistently;
