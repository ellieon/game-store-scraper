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
  db.createTable('games', {
    id: {
      type: 'int', 
      primaryKey: true,
      autoIncrement: true,
      notNull: true,
    },
    date: {
      type: 'datetime',
      notNull: true,
    },
    store: {
      type: 'text',
      notNull: true,
    },
    games: {
      type: 'jsonb',
      notNull: true
    }
    });

    db.createTable('settings', {
      key: {
        type: 'text', 
        primaryKey: true,
        notNull: true,
      },
      value: {
        type: 'text',
        notNull: true,
      },

      }).then(() => {
        db.insert('settings', ['key', 'value'], ['next_scan', '2024-01-01T00:00:00.000Z'])
      });
      return null;
};

exports.down = function(db) {
  db.dropTable('games')
  db.dropTable('settings')
  return null;
};

exports._meta = {
  "version": 1
};
