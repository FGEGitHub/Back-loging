const bcrypt = require("bcryptjs")
//const bcrypt = require("bcryptjs/dist/bcrypt")

const helpers = {}

helpers.encryptPassword = async (password) => {// encriptar 
    const salt = await  bcrypt.genSalt(10)
    const hash =  await bcrypt.hash(password, salt)
    return hash
}
helpers.matchPassword = async(password, savedPassword) => { // logueo
    try{
        return await bcrypt.compare(password, savedPassword)

    }catch(e){
        console.log(e)
    }
    

}

module.exports = helpers