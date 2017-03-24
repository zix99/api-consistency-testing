const _ = require('lodash');
const Promise = require('bluebird');
const blessed = require('blessed');
const matchers = require('../matchers');

/**
args : {
  key, expect, actual, fullExpect, fullActual, scenario
}
returns: promise
*/
/* eslint no-unused-vars: "off" */
function askQuestion(args) {
  return new Promise((resolve) => {
    const screen = blessed.screen({
      smartCSR: true,
    });
    screen.title = 'ACT: Response Comparison';

    /* ====== Context Top ===== */
    const testText = _.join(_.map(args.scenario.label, (val, key) => `${key}=${val}`), ', ');
    const requestDetails = blessed.box({
      parent: screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 2,
      tags: true,
      content: `{red-fg}${args.scenario.step.method}{/red-fg} {blue-fg}${args.scenario.step.uri}{/blue-fg} ${args.scenario.step.description}\n  Scenario: {cyan-fg}${testText}{/cyan-fg}`,
      style: {
        bg: 'gray',
      },
    });

    /* ====== TOP AREA ====== */

    const LOWER_HEIGHT = 7;

    const topContainer = blessed.box({
      parent: screen,
      top: 2,
      left: 0,
      width: '100%',
      height: `100%-${LOWER_HEIGHT}`,
    });

    const expectBox = blessed.box({
      parent: topContainer,
      label: 'Expected Response',
      top: 0,
      left: 0,
      width: '50%',
      height: '100%',
      content: JSON.stringify(args.fullExpect, null, '\t'),
      border: {
        type: 'line',
        fg: 'blue',
      },
      scrollable: true,
      alwaysScroll: true,
    });

    const actualBox = blessed.box({
      parent: topContainer,
      label: 'Received',
      top: 0,
      left: '50%',
      width: '50%',
      height: '100%',
      content: JSON.stringify(args.fullActual, null, '\t'),
      border: {
        type: 'line',
        fg: 'green',
      },
      scrollable: true,
      alwaysScroll: true,
    });

    /* ====== LOWER FORM ====== */

    const lowerForm = blessed.form({
      parent: screen,
      top: `100%-${LOWER_HEIGHT}`,
      left: 0,
      width: '100%',
      height: LOWER_HEIGHT,
      border: {
        type: 'line',
      },
      keys: true,
      tags: true,
      label: 'Difference',
    });

    const text = `${args.key}
{red-fg}- ${args.expect}{/red-fg}
{green-fg}+ ${args.actual}`;

    const difference = blessed.box({
      parent: lowerForm,
      content: text,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      tags: true,
    });

    let offX = 0;
    function createButton(buttonText, result) {
      const button = blessed.button({
        parent: lowerForm,
        left: offX,
        top: 3,
        width: 12,
        mouse: true,
        keys: true,
        shrink: true,
        padding: {
          left: 1,
          right: 1,
        },
        content: buttonText,
        border: {
          type: 'line',
        },
        style: {
          focus: {
            bg: 'blue',
            fg: 'white',
          },
          hover: {
            bg: 'green',
            fg: 'white',
          },
        },
      });
      button.on('press', () => {
        screen.destroy();
        resolve(result);
      });
      offX += 12;
      return button;
    }

    createButton('Keep', args.expect).focus();
    createButton('Replace', args.actual);

    _.forEach(matchers, (matcher, name) => {
      if (matcher(args.actual)) {
        createButton(name, `$matcher:${name}`);
      }
    });


    /* ====== HOOKS ====== */

    screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));
    screen.key(['tab'], (ch, key) => {
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
  askQuestion,
};
