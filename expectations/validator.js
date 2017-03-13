const _ = require('lodash');
const promise = require('bluebird');
const hash = require('object-hash');
const log = require('winston');
const prompt = require('inquirer').prompt;
const deep = require('../util/deep');

const registry = require('./registry');

function promptValueCompare(args) {
	const q = {
		name : 'prompt',
		message : `Mismatch on ${args.key}.\n  Currently: ${args.expect}\n  Now: ${args.actual}\nDo you want to update?`,
		type: 'expand',
		choices: [
			{key: 'k', value: args.expect, name: 'Keep current'},
			{key: 'r', value: args.actual, name: 'Replace'},
			{key: 'i', value: undefined, name: 'Ignore'},
			{key: 'v', value: function(val){return !_.isNaN(parseInt(val));}, name: 'Numeric Value'}
		]
	};
	return prompt([q])
		.then(answer => {
			return answer['prompt'];
		});
}

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
				fullExpect: schema,
				fullActual: response
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

	return compareToSchema(schema, response, promptValueCompare)
		.then(ret => {
			if (ret)
				registry.appendSnapshot(scenarioHash, ret);
		});
}

module.exports = validateResponse;
