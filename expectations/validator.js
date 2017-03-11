const _ = require('lodash');
const promise = require('bluebird');
const hash = require('object-hash');
const log = require('winston');
const prompt = require('inquirer').prompt;

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

function compareToSchema(schema, response, root) {
	root = root || '.';

	const keys = _.union(_.keys(schema), _.keys(response));
	let changeOccurred = false;

	return promise.map(keys, key => {
		if (_.isPlainObject(_.get(response, key))) {
			// Recurse!
			if (!_.isPlainObject(_.get(schema, key)))
			{
				schema[key] = {}
			}
			return compareToSchema(schema[key], response[key], `${root}.${key}`);
		} else {
			const schemaVal = _.get(schema, key);
			const responseVal = _.get(response, key);
			if (!checkEquality(schemaVal, responseVal)) {
				return promptValueCompare(`${root}:${key}`, schemaVal, responseVal)
					.then(answer => {
						if (answer) {
							schema[key] = answer;
							changeOccurred = true;
						}
					});
			}
		}
	}, {concurrency: 1})
		.then(() => changeOccurred);
}

function validateResponse(scenario, response) {
	console.dir(scenario);
	const scenarioHash = hash(scenario);
	log.debug(`Scenario hash: ${scenarioHash}`);

	let schema = registry.loadSnapshot(scenarioHash) || {};
	log.debug('Current snapshot: ' + JSON.stringify(schema));
	log.debug('Response: ' + JSON.stringify(response));

	return compareToSchema(schema, response).then(() => {
		console.dir(schema);
		return schema;
	})
	.then(ret => {
		if (ret)
			registry.appendSnapshot(scenarioHash, schema);
	});
}

module.exports = validateResponse;
