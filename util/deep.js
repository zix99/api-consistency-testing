const _ = require('lodash');

function __collapse(obj, path, accum) {
  if (_.isPlainObject(obj)) {
    _.forEach(obj, (val, key) => {
      __collapse(val, `${path}${path ? '.' : ''}${key}`, accum);
    });
  } else if (_.isArray(obj)) {
    _.forEach(obj, (val, index) => {
      __collapse(val, `${path}[${index}]`, accum);
    });
  } else {
    accum[path] = obj;
  }
}

function collapse(obj) {
  const accum = {};
  __collapse(obj, 'root', accum);
  return accum;
}

function expand(obj) {
  const expanded = {};
  _.forEach(obj, (val, key) => {
    _.set(expanded, key, val);
  });
  return expanded.root;
}

/*
Object
func(val)
*/
function map(obj, func) {
  _.forEach(obj, (val, key) => {
    if (_.isPlainObject(val) || _.isArray(val)) {
      map(val, func);
    } else {
      _.set(obj, key, func(val));
    }
  });
  return obj;
}

module.exports = {
  collapse,
  expand,
  map,
};
