const mariadb = require('mariadb')

const {database4} =require (('./keys'))
const {promisify } = require('util')

const pool = mariadb.createPool(database4)

pool.getConnection((err,connection)=> {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('DATABASE CONNECTION WAS CLOSED')
        }
        if (err.code === 'ER_CON_COUNT_ERROR'){
            console.error('DATABASE HAS TO MANY CONNECTIONS')  
        }
        if (err.code === ('ECONNREFUSED')){
            console.error('DATABASE CONNECTION WAS REFUSED')
        }
        console.log(error)
    }
    if (connection) connection.release()
    console.log('DB is Connected')
    return;
})
//convirtiendo promesas
//pool.query = promisify(pool.query)

module.exports = pool


