const _ = require('lodash');
const promise = require('bluebird');
const hash = require('object-hash');
const log = require('winston');
const deep = require('../util/deep');
const questionui = require('./ui/blessed-cli').askQuestion;

const registry = require('./registry');

function checkEquality(schemaVal, responseVal) {
	if (_.startsWith(schemaVal, 'function')) {
		return eval(`(${schemaVal})`)(responseVal);
	}
	return schemaVal === responseVal;
}

function compareToSchema(schema, response, onDifference) {
	onDifference = onDifference || (() => promise.resolve());

	let collapsedSchema = deep.collapse(schema);
	let collapsedResponse = deep.collapse(response);

	let keys = _.union(_.keys(collapsedSchema), _.keys(collapsedResponse));

	return promise.map(keys, key => {
		if (!_.has(collapsedSchema, key) || !_.has(collapsedResponse, key) || !checkEquality(_.get(collapsedSchema, key), _.get(collapsedResponse, key))) {
			let args = {
				key,
				expect: _.get(collapsedSchema, key),
				actual: _.get(collapsedResponse, key),
				fullExpect: deep.expand(collapsedSchema),
				fullActual: response,
			};
			return onDifference(args)
				.then(answer => {
					if (typeof answer === 'function') {
						collapsedSchema[key] = answer.toString();
					} else if (answer !== undefined) {
						collapsedSchema[key] = answer;
					}
				});
		}
	}, {concurrency: 1}).then(() => {
		return deep.expand(collapsedSchema);
	});
}

function validateResponse(scenario, response) {
	const scenarioHash = hash(scenario);
	log.debug(`Scenario hash: ${scenarioHash}`);

	let schema = registry.loadSnapshot(scenarioHash) || {};
	log.debug('Current snapshot: ' + JSON.stringify(schema));
	log.debug('Response: ' + JSON.stringify(response));

	return compareToSchema(schema, response, args => {
		args['scenario'] = scenario;
		return questionui(args);
	}).then(ret => {
			if (ret)
				registry.appendSnapshot(scenarioHash, ret);
		});
}

module.exports = validateResponse;
