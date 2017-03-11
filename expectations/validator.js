const _ = require('lodash');
const registry = require('./registry');
const hash = require('object-hash');
const log = require('winston');

function compareToSchema(schema, response, question) {
	let diff = [];

	_.forEach(response, (val, key) => {
		
	});
}

function validateResponse(scenario, response, interactive) {
	interactive = interactive || false;
	const scenarioHash = hash(scenario);
	log.debug(`Scenario hash: ${scenarioHash}`);

	let schema = registry.loadSnapshot(scenarioHash) || {};
	log.debug('Current snapshot: ' + JSON.stringify(schema));
	log.debug('Response: ' + JSON.stringify(response));

	return compareToSchema(schema, response);
}

module.exports = validateResponse;
