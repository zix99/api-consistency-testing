const combiner = require('../../util/combiner');
const assert = require('chai').assert;

describe('Combiner utility', () => {
  it('Returns nothing when given nothing', () => {
    const ret = combiner.getAllCombinations({});
    assert.deepEqual(ret, []);
  });

  it('Returns a single item when given a single item', () => {
    const ret = combiner.getAllCombinations({ a: 1 });
    assert.deepEqual(ret, [{ a: 1 }]);
  });

  it('Resolves a function to be its cases', () => {
    const ret = combiner.getAllCombinations({
      a: () => [1, 2, 3]
    });
    assert.deepEqual(ret, [{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it('Resolves multiple conditions into their cases', () => {
    const ret = combiner.getAllCombinations({
      a: [1, 2, 3],
      b: [3, 4]
    });
    assert.deepEqual(ret, [
      { a: 1, b: 3 },
      { a: 1, b: 4 },
      { a: 2, b: 3 },
      { a: 2, b: 4 },
      { a: 3, b: 3 },
      { a: 3, b: 4 },
    ]);
  });
});
