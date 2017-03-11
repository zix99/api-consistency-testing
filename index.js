const _ = require('lodash');
const promise = require('bluebird');
const runner = require('./runner')

const DEFAULT_TIMEOUT = 4000;

const MOCHA_MODE = typeof describe !== 'undefined';
let __currentConfig = {};
let __tests = [];

function __log(msg) {
	console.log(msg);
}

function buildMochaTests(apiSpec) {
	const description = apiSpec.description ||
		_.join(_.map(apiSpec.steps, step => `${step.method} ${step.uri}`), ' -> ');
	const tagStr = _.join(_.map(apiSpec.tags || [], tag => `@${tag}`), ', ');

	describe(`${tagStr}: ${description}`, function(){
		_.forEach(apiSpec.tests, test => {
			it("Test with values: " + JSON.stringify(test), function(done){
				this.timeout(apiSpec.timeout || DEFAULT_TIMEOUT);
				runner.executeAllStepsAync(apiSpec.steps, test)
					.nodeify(done);
			});
		});
	});
}

function runTestsInteractively(apiSpec) {	
	__log("Running test: " + (apiSpec.spec.description || "Undefined description"));
	return promise.map(apiSpec.spec.tests, test => {
		return runner.executeAllStepsAync(apiSpec.spec.steps, test, apiSpec.config);
	}, {concurrency: 1});
}

/**
* This is the entry-point for all tests
*/
function describeConsistently(apiSpec) {
	__tests.push({spec: apiSpec, config : __currentConfig});
	if (MOCHA_MODE) {
		buildMochaTests(apiSpec);
	}
}

function evaluateApis() {
	return promise.map(__tests, runTestsInteractively, {concurrency: 1});
}


let wrapper = module.exports = function(opts, func) {
	__currentConfig = opts;
	func();
	__currentConfig = {};
};
wrapper.describeConsistently = describeConsistently;
wrapper.evaluateApis = evaluateApis;


global.describeConsistently = describeConsistently;
