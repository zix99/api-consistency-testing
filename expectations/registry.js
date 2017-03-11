var fs = require('fs');
var _ = require('lodash');
var log = require('winston');

let snapshotCache = {};

const SNAPSHOT_DIR = 'snapshots';
const SNAPSHOT_HEADER = `//VERSION=0.1
const _ = require('lodash');

let snapshot = module.exports = [];

`;

function __evalScoped(code) {
	return eval(code);
}


function getKeyName(name) {
	return name; //TODO: Some replace regex to clean up the file names
}

function getFilename(name) {
	return `./${SNAPSHOT_DIR}/` + getKeyName(name) + '.snapshot.js';
}

function loadSnapshotFile(name) {
	const filename = getFilename(name);
	log.debug(`Loading snapshot from file ${filename}...`);

	if (!fs.existsSync(filename)) {
		return null;
	}

	return _.last(eval(fs.readFileSync(filename, {encoding: 'utf-8'})));
}

function loadSnapshot(name) {
	log.debug(`Loading snapshot for ${name}`);
	const key = getKeyName(name);

	if (_.has(snapshotCache, key)) {
		return _.get(snapshotCache, key);
	}

	return (snapshotCache[key] = loadSnapshotFile(name));
}

function ensureSnapshotExists(filename) {
	if (!fs.existsSync(filename)) {
		log.debug(`Creating new snapshot file ${filename}...`);
		if (!fs.existsSync(SNAPSHOT_DIR)) {
			fs.mkdirSync(SNAPSHOT_DIR);
		}
		fs.writeFileSync(filename, SNAPSHOT_HEADER);
	}
}

function appendSnapshot(name, data) {
	log.debug(`Appending to snapshot ${name}...`);
	const filename = getFilename(name);
	ensureSnapshotExists(filename);

	const code = `snapshot.push(${JSON.stringify(data)});\n\n`;
	fs.appendFileSync(filename, code);
}

module.exports = {
	loadSnapshot,
	appendSnapshot
};
