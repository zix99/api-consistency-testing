const _ = require('lodash');
const promise = require('bluebird');
const hash = require('object-hash');
const log = require('winston');
const prompt = require('inquirer').prompt;
const deep = require('../util/deep');

const registry = require('./registry');

function promptValueCompare(key, schemaVal, responseVal) {
	// Mismatch!
	const q = {
		name : 'prompt',
		message : `Mismatch on ${key}.\n  Currently: ${schemaVal}\n  Now: ${responseVal}\nDo you want to update?`,
		type: 'expand',
		choices: [
			{key: 'k', value: 'k', name: 'Keep current'},
			{key: 'r', value: 'r', name: 'Replace'},
			{key: 'i', value: 'i', name: 'Ignore'},
		]
	};
	return prompt([q])
		.then(answer => {
			const ans = answer['prompt'];
			if (ans === 'r') {
				return responseVal;
			} else if (ans === 'k') {
				return schemaVal;
			} else if (ans === 'i') {
				return undefined;
			}
		});
}

function checkEquality(schemaVal, responseVal) {
	return schemaVal === responseVal;
}

function compareToSchema(schema, response, onDifference) {
	onDifference = onDifference || promise.resolve();

	let collapsedSchema = deep.collapse(schema);
	let collapsedResponse = deep.collapse(response);

	let keys = _.union(_.keys(collapsedSchema), _.keys(collapsedResponse));

	return promise.map(keys, key => {
		if (!_.has(collapsedSchema, key) || !_.has(collapsedResponse, key) || !checkEquality(_.get(collapsedSchema, key), _.get(collapsedResponse, key))) {
			return onDifference(key, _.get(collapsedSchema, key), _.get(collapsedResponse, key))
				.then(answer => {
					if (answer !== undefined) {
						collapsedSchema[key] = answer;
					}
				});
		}
	}, {concurrency: 1}).then(() => {
		return deep.expand(collapsedSchema);
	});
}

function validateResponse(scenario, response) {
	console.dir(scenario);
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
