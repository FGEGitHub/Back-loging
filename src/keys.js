const DB_HOST = require('./config')
const DB_NAME = require('./config')
const DB_PASSWORD = require('./config')
const DB_USER = require('./config')
const DB_PORT = require('./config')

module.exports = {
    database:{
        host: process.env.DB_HOST   || 'localhost',
        user: process.env.DB_USER   || 'root',
        password: process.env.DB_PASSWORD   || 'root',
        database: process.env.DB_NAME    || 'marketing',
        DB_PORT:  process.env.DB_PORT   || '3306',
    }

}