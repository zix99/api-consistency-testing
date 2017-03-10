const inq = require('inquirer');
const promise = require('bluebird');

function describe(thing) {
	console.log("asking a question...");
	let q = {
		name: 'haz',
		message: `I can haz ${thing}?`
	};
	return inq.prompt([q]).then(function(answers) {
		console.log(answers);
	});
}

promise.each(['ice', 'pizza'], describe);