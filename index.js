const _ = require('lodash');
const promise = require('bluebird');
const request = promise.promisify(require('request'));
const assert = require('chai').assert;
const shortid = require('shortid').generate;
const format = require('string-format');
const diff = require('deep-diff');

const DEFAULT_TIMEOUT = 4000;

const MOCHA_MODE = typeof describe !== 'undefined';
console.log("MOCHA: " + MOCHA_MODE);

function __log(msg) {
	console.log(msg);
}

function discoverVariations(step, accumulator) {
	accumulator = accumulator || [];

	if (_.isPlainObject(step) && _.get(step, '$act') === 'any') {
		accumulator.push(_.get(step, 'of', []));
	} else if (_.isObject(step)) {
		_.forEach(step, obj => {
			discoverVariations(obj, accumulator);
		});
	}

	return accumulator;
}

function buildPayload(payloadTemplate, context) {
	return _.clone(payloadTemplate);
}

function executeStepAsync(step, context) {
	const payload = buildPayload(_.get(step, 'payload', {}), context);
	__log(context);
	const fullUri = format(step.uri, context);

	const requestObject = {
		method: _.get(step, 'method', 'GET'),
		uri: fullUri,
		json: buildPayload(step.payload, context),
	};

	const lastSnapshot = {};

	const middleware = context.requestMiddleware || ((req, callback) => callback(null, req));

	__log(`Making API request to ${step.method} ${fullUri}...`);
	/*return middleware(requestObject, modifiedRequest => {
		return request(modifiedRequest)
			.then(ret => {
				__log(`Received ${ret.statusCode}: ${JSON.stringify(ret.body)}`);
				if (step.expect) assert.equal(ret.statusCode, step.expect, `Unexpected status code after call to ${fullUri}`);
				if (step.validator) step.validator(ret);
				if (step.export) {
					context[step.export] = ret.body;
				}
				let snapshot = _.clone(lastSnapshot);
				diff.observableDiff(snapshot, ret.body, change => {
					__log(change);
					diff.applyChange(snapshot, ret.body, change);
				});
				return ret.body;
			});
		});*/

	return promise.promisify(middleware)(requestObject)
		.then(req => {
			return request(req);
		})
		.then(ret => {
			__log(`Received ${ret.statusCode}: ${JSON.stringify(ret.body)}`);
			if (step.expect) assert.equal(ret.statusCode, step.expect, `Unexpected status code after call to ${fullUri}`);
			if (step.validator) step.validator(ret);
			if (step.export) {
				context[step.export] = ret.body;
			}
			return ret.body;
		})
		.catch(err => {
			__log("Error making request: " + JSON.stringify(err));
			return {};
		});
}

function executeAllStepsAync(steps, testValues, config) {
	let context = _.clone(_.merge(config, testValues));
	return promise.map(steps, step => {
		return executeStepAsync(step, context);
	}, {concurrency: 1});
}

function buildMochaTests(apiSpec) {
	const description = apiSpec.description ||
		_.join(_.map(apiSpec.steps, step => `${step.method} ${step.uri}`), ' -> ');
	const tagStr = _.join(_.map(apiSpec.tags || [], tag => `@${tag}`), ', ');

	describe(`${tagStr}: ${description}`, function(){
		const cases = discoverVariations(apiSpec.steps);
		__log(JSON.stringify(cases));

		_.forEach(apiSpec.tests, test => {
			it("Test with values: " + JSON.stringify(test), function(done){
				this.timeout(apiSpec.timeout || DEFAULT_TIMEOUT);
				executeAllStepsAync(apiSpec.steps, test)
					.nodeify(done);
			});
		});
	});
}

function runTestsInteractively(apiSpec) {
	console.dir(apiSpec);
	console.log("Running test: " + (apiSpec.spec.description || "Undefined description"));
	return promise.map(apiSpec.spec.tests, test => {
		return executeAllStepsAync(apiSpec.spec.steps, test, apiSpec.config)
			.then(ret => {
				console.log("Done with test");
				console.log(ret);
			});
	}, {concurrency: 1});
}

let __currentConfig = {};
let __tests = [];

/**
* This is the entry-point for all tests
*/
function describeConsistently(apiSpec) {
	if (MOCHA_MODE) {
		buildMochaTests(apiSpec);
	} else {
		__tests.push({spec: apiSpec, config : __currentConfig});
	}
}

function __act(name, data) {
	return _.merge({'$act' : name, 'key' : shortid()}, data);
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
