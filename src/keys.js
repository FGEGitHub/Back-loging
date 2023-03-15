
module.exports = {
    database:{
        host: 'localhost',
       // user: 'root',
            user: process.env.DB_USER   || 'admin',
      //  password: 'root',
        password: process.env.DB_PASSWORD   || '11235',
        database: 'marketing'
    }

}