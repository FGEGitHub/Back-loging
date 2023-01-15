const DB_HOST = require('./config')
const DB_NAME = require('./config')
const DB_PASSWORD = require('./config')
const DB_USER = require('./config')
const DB_PORT = require('./config')

module.exports = {
    database:{
        host: 'DB_HOST',
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        database: 'DB_NAME',
        DB_PORT:  'DB_PORT',
    }

}