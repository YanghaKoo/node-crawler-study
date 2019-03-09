'use strict';

// sequleize-cli가 만든거에서 칠요없는거 잘라내서 이렇게 함
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

// db.Proxy = require('./proxy')(sequelize,Sequelize)


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
