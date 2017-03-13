var fs = require('fs');
var _ = require('lodash');
var log = require('winston');

let snapshotCache = {};

const SNAPSHOT_DIR = 'snapshots';
const SNAPSHOT_HEADER = `//VERSION=0.1
const _ = require('lodash');

this.snapshot = [];

`;

function __getKeyName(name) {
	return name; //TODO: Some replace regex to clean up the file names
}

function __getFilename(name) {
	return `./${SNAPSHOT_DIR}/` + __getKeyName(name) + '.snapshot.js';
}

function __evaluateSnapshot(code) {
	eval(code);
	return this.snapshot;
}

function __loadSnapshotFile(name) {
	const filename = __getFilename(name);
	log.debug(`Loading snapshot from file ${filename}...`);

	if (!fs.existsSync(filename)) {
		return null;
	}

	let snapshot = __evaluateSnapshot(fs.readFileSync(filename, {encoding: 'utf-8'}));
	return _.last(snapshot);
}

function loadSnapshot(name) {
	log.debug(`Loading snapshot for ${name}`);
	const key = __getKeyName(name);

	if (_.has(snapshotCache, key)) {
		return _.get(snapshotCache, key);
	}

	return (snapshotCache[key] = __loadSnapshotFile(name));
}

function __ensureSnapshotExists(filename) {
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
	const filename = __getFilename(name);
	__ensureSnapshotExists(filename);

	const code =`
// Snapshot taken on ${new Date()}
this.snapshot.push(${JSON.stringify(data, null, '\t')});
`;

	fs.appendFileSync(filename, code);
}

module.exports = {
	loadSnapshot,
	appendSnapshot
};
