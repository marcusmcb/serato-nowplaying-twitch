const Datastore = require('nedb');
const path = require('path');

const db = {};
db.users = new Datastore({ filename: path.join(__dirname, './users.db'), autoload: true });

module.exports = db;
