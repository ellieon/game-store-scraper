'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  db.runSql(`delete from settings where key='next_scan'`);
  db.insert('settings', ['key', 'value'], ['next_scan', 'morning']);
  db.insert('settings', ['key', 'value'], ['next_scan_date', '2024-05-01T09:30:00.000Z' ])
  return null;

};

exports.down = function(db) {
  db.runSql(`delete from settings where key='next_scan_date'`);
  db.runSql(`delete from settings where key='next_scan'`);
  db.insert('settings', ['key', 'value'], ['next_scan', '2024-01-01T00:00:00.000Z']);
  return null;
};

exports._meta = {
  "version": 1
};
