const mariadb = require('mariadb')

const config ={
host: '127.0.0.1',
user:'admin',
password:'11235',
database:'marketing',
connectionLimit:10,
aquireTimeout:300

}

class DBConnector{
    dbconnector = mariadb.createPool(config);

    async query(param){
        let conn = await this.dbconnector.getConnection();
   
    let ret = null;
       
       await  conn.query(param)
            
            .then(data =>{
                
                ret =   data;
           
                conn.end()
               
            })
         .catch (error=>{
            console.log(error)
            conn.end()
        })
        console.log('ret')
       
    return ret;
}
}


module.exports = new DBConnector()


