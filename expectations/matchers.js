const _ = require('lodash');
const moment = require('moment');

module.exports = {
  integer: val => !isNaN(val),
  uuid: val => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(val),
  datetime: val => moment(val).isValid(),
  anything: val => true,
};
