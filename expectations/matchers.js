const moment = require('moment');

/*
 * Matchers take the followign preset arguments
 * - Val: The value that is being checked against
 * - Context: (OPTIONAL) The context in which the value is being compared in
 */
module.exports = {
  integer: val => !isNaN(val),
  uuid: val => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(val),
  datetime: val => moment(val).isValid(),
  anything: () => true,
};
