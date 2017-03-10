var fs = require('fs');

let snapshotCache = {};

function getKeyName(name) {
	return name; //TODO: Some replace regex to clean up the file names
}

function loadSnapshotFile(name) {
	const filename = "./snapshots/" + getKeyName(name);

	if (!fs.existsSync(filename)) {
		return [];
	}

	return JSON.parse(fs.readFileSync(filename));
}

function loadSnapshot(name) {
	const key = getKeyName(name);

	if (_.has(snapshotCache, key)) {
		return _.get(snapshotCache, key);
	}

	return (snapshotCache[key] = loadSnapshotFile(name));
}

module.exports = {

};
