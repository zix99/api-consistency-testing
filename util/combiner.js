const _ = require('lodash');


/**
Takes in an object with all possible values as the value
Returns: An array of map objects continuing only 1 value each
**/
function getAllCombinations(obj) {
	const key = _.keys(obj)[0];
	const more = _.omit(obj, key);
	let possibilities = obj[key];

	if (_.isFunction(possibilities)) {
		possibilities = possibilities();
	}

	if (!_.isArray(possibilities)) {
		// A single value is an array with one value
		possibilities = [possibilities];
	}

	if (_.keys(more).length === 0) {
		// At the end of the line
		return _.map(possibilities, item => {
			return _.set({}, key, item);
		});
	}

	return _.reduce(possibilities, (accum, val) => {
		_.forEach(getAllCombinations(more), combo => {
			accum.push(_.set(combo, key, val));
		});
		return accum;
	}, []);
}

module.exports = {
	getAllCombinations
};
