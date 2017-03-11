const registry = require('./registry');
const hash = require('object-hash');
const log = require('winston');

function validateResponse(scenario, response) {
	const scenarioHash = hash(scenario);
	log.debug(`Scenario hash: ${scenarioHash}`);
}

module.exports = validateResponse;
