const _ = require('lodash');
const promise = require('bluebird');
const blessed = require('blessed');

/**
args : {
	key, expect, actual, fullExpect, fullActual
}
returns: promise
*/
function askQuestion(args) {
	return new promise((resolve) => {
		let screen = blessed.screen({
			smartCSR: true
		});
		screen.title = `ACT: Response Comparison`;

		/* ====== TOP AREA ====== */

		const LOWER_HEIGHT = 7;

		let topContainer = blessed.box({
			parent: screen,
			top: 1,
			left: 0,
			width: '100%',
			height: `100%-${LOWER_HEIGHT}`
		});

		let expectBox = blessed.box({
			parent: topContainer,
			label: 'Expected Response',
			top: 0,
			left: 0,
			width: '50%',
			height: '100%',
			content: JSON.stringify(args.fullExpect, null, '\t'),
			border: {
				type: 'line',
				fg: 'blue'
			},
			scrollable: true,
			alwaysScroll: true,
		});

		let actualBox = blessed.box({
			parent: topContainer,
			label: 'Received',
			top: 0,
			left: '50%',
			width: '50%',
			height: '100%',
			content: JSON.stringify(args.fullActual, null, '\t'),
			border: {
				type: 'line',
				fg: 'green'
			},
			scrollable: true,
			alwaysScroll: true,
		});

		/* ====== LOWER FORM ====== */

		let lowerForm = blessed.form({
			parent: screen,
			top: `100%-${LOWER_HEIGHT}`,
			left: 0,
			width: '100%',
			height: LOWER_HEIGHT,
			border: {
				type: 'line'
			},
			keys: true,
			tags: true,
			label: 'Difference'
		});

		let text = `${args.key}
{red-fg}- ${args.expect}{/red-fg}
{green-fg}+ ${args.actual}`;

		let difference = blessed.box({
			parent: lowerForm,
			content: text,
			top: 0,
			left: 0,
			width: '100%',
			height: 3,
			tags: true
		});

		let offX = 0;
		function createButton(text, result) {
			let button = blessed.button({
				parent: lowerForm,
				left: offX,
				top: 3,
				width: 12,
				mouse: true,
				keys: true,
				shrink: true,
				padding: {
					left: 1,
					right: 1
				},
				content: text,
				border: {
					type: 'line'
				},
				style: {
					focus: {
						bg: 'blue',
						fg: 'white'
					},
					hover: {
						bg: 'green',
						fg: 'white'
					}
				}
			});
			button.on('press', function(){
				screen.destroy();
				resolve(result);
			});
			offX += 12;
			return button;
		}

		createButton('Keep', args.expect).focus();
		createButton('Replace', args.actual);
		

		/* ====== HOOKS ====== */

		screen.key(['escape', 'q', 'C-c'], function(ch, key) {
		  return process.exit(0);
		});
		screen.key(['tab'], function(ch,key){
			screen.focusNext();
			screen.render();
		});
		screen.key(['right'], () => screen.focusNext());
		screen.key(['left'], () => screen.focusPrevious());
		screen.key(['j'], () => {
			expectBox.scroll(1);
			actualBox.scroll(1);
		});
		screen.key(['k'], () => {
			expectBox.scroll(-1);
			actualBox.scroll(-1);
		});

		screen.render();
	});
}

module.exports = {
	askQuestion
};