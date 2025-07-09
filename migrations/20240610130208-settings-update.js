'use strict';

var dbm;
var type;
var seed;

const CATEGORIES = [ 
  { id: 59, name: "DS"}, 
  { id: 70, name: "3DS"}, 
  { id: 18, name: "Retro Games"},
  { id: 65, name: "PSP"}
]

const STORES = [
  'StoreA', 'StoreB', 'StoreC'
]

const USER = '<discord user id>'
const MORNING_TIME = '9:30:00'
const EVENING_TIME = '14:00:00'

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
  db.insert('settings', ['key', 'value'], ['categories', JSON.stringify(CATEGORIES)]);
  db.insert('settings', ['key', 'value'], ['stores', JSON.stringify(STORES)]);
  db.insert('settings', ['key', 'value'], ['user', USER]);
  db.insert('settings', ['key', 'value'], ['morning_time', MORNING_TIME]);
  db.insert('settings', ['key', 'value'], ['evening_time', EVENING_TIME]);
  db.insert('settings', ['key', 'value'], ['scan_lock', 'false']);
  
  return null;
};

exports.down = function(db) {
  db.runSql(`delete from settings where key='categories'`);
  db.runSql(`delete from settings where key='stores'`);
  db.runSql(`delete from settings where key='user'`);
  db.runSql(`delete from settings where key='morning_time'`);
  db.runSql(`delete from settings where key='evening_time'`);
  db.runSql(`delete from settings where key='scan_lock'`);
  return null;
};

exports._meta = {
  "version": 1
};
