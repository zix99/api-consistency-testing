const assert = require('chai').assert;
const _ = require('lodash');
const diff = require('deep-diff').diff;

const deep = require('../../util/deep');

describe('Deep utilities', () => {
  const example = {
    a: 1,
    b: {
      c: [1, 2, 3],
      d: 'z',
    },
    f: [
      'g',
			{ h: 'i' },
    ],
  };

  const collapsed = {
    'root.a': 1,
    'root.b.c[0]': 1,
    'root.b.c[1]': 2,
    'root.b.c[2]': 3,
    'root.b.d': 'z',
    'root.f[0]': 'g',
    'root.f[1].h': 'i',
  };

  const mapped = {
    a: 2,
    b: {
      c: [2, 3, 4],
      d: 'z',
    },
    f: [
      'g',
			{ h: 'i' },
    ],
  };

  describe('Collapse', () => {
    it('Collapses an array to its items', (done) => {
      const ret = deep.collapse(example);

      assert.isUndefined(diff(ret, collapsed));

      done();
    });
  });

  describe('Expand', () => {
    it('Expands an array to its original form', (done) => {
      const ret = deep.expand(collapsed);

      assert.isUndefined(diff(ret, example));

      done();
    });
  });

  describe('Map', () => {
    it('Modifies an object according to a function', (done) => {
      const obj = _.clone(example);

      deep.map(obj, (val) => {
        if (_.isInteger(val)) {
          return val + 1;
        }
        return val;
      });

      assert.isUndefined(diff(obj, mapped));

      done();
    });
  });
});
