const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const pool = require('../database')
const helpers = require('../lib/helpers')







passport.use('local.signin', new LocalStrategy({
    usernameField: 'usuario', // usuario es el nombre que recibe del hbs
    passwordField: 'password',
    passReqToCallback: 'true' // para recibir mas datos 

}, async (req, usuario, password, done) => {  // que es lo que va a hacer 
    console.log('entra')
    const rows = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario])
    console.log(rows)
    if (rows.length > 0) {
        const usuario = rows[0]
       
        const validPassword = await helpers.matchPassword(password, usuario.password)
       
        if (validPassword) {
           
  /*      const userFoRToken = {
                id: usuario.id,
                usuario: usuario.cuil_cuit,
                nivel: usuario.nivel
            }
            const token = jwt.sign(userFoRToken, 'fideicomisocs121', { expiresIn: 60 * 60 * 24 * 7 })
            res.send({ id: req.usuario.id,cuil_cuit: req.usuario.cuil_cuit,token, nivel: req.usuario.nivel})  */
            done(null, usuario, req.flash('success', 'Welcome' )) // done termina, null el error, user lo pasa para serializar
          
        } else {
            done(null, false, req.flash('message', 'Pass incorrecta')) // false para no avanzar
        }
    } else {
        return done(null, false, req.flash('message', 'EL nombre de cuil/cuit no existe'))
    }
}))




passport.use('local.signup', new LocalStrategy({
    usernameField: 'usuario',
    passwordField: 'password',
    passReqToCallback: 'true'
}, async (req, usuario, password, done) => {
    
    const { nombre, mail, tel,nivel,dni } = req.body
    //  const razon = await pool.query('Select razon from clientes where cuil_cuit like  ?', [cuil_cuit]) seleccionar razon


  if (nivel == undefined){
    nivel= 1
  }
 
    const newUser = {
        password,
        usuario,
        nombre,
        tel,
        mail,
        nivel


    }


    //fin transformar 
    try {  
      
        const verif  = await pool.query('select * from usuarios where usuario = ?',[usuario])
        if (verif.length>0){
            req.flash('message', 'error, usuario existente')
        }else{
        newUser.password = await helpers.encryptPassword(password)
        try {
            const result = await pool.query('INSERT INTO usuarios  set ?', [newUser])
            
            newUser.id = result.insertId// porque newuser no tiene el id
           

            return done(null, newUser)// para continuar, y devuelve el newUser para que almacene en una sesion

        } catch (error) {
            console.log(error)
        }}


   



    } catch (error) {
        console.log(error)
        req.flash('message', 'error,algo sucedio ')

    }





}


))







passport.use('local.registroadmin', new LocalStrategy({
    usernameField: 'usuario',
    passwordField: 'password',
    passReqToCallback: 'true'
}, async (req, usuario, password, done) => {

    const { nombre, mail, nivel } = req.body
    //  const razon = await pool.query('Select razon from clientes where usuario like  ?', [usuario]) seleccionar razon


    const habilitado = 'NO'
    const newUser = {
        password,
        usuario,
        nombre,
        nivel,
        mail,


    }


    //fin transformar 
    try {
        var rows = await pool.query('SELECT * FROM usuarios WHERE usuario like  ?', [usuario]) // falta restringir si un usuario se puede registrar sin ser cliente
        if (rows.length == 0) { // si ya hay un USER con ese dni 

            newUser.password = await helpers.encryptPassword(password)
            try {
                const result = await pool.query('INSERT INTO usuarios  set ?', [newUser])
                newUser.id = result.insertId// porque newuser no tiene el id

                return done(null, newUser)// para continuar, y devuelve el newUser para que almacene en una sesion

            } catch (error) {
                console.log(error)
            }
        }

        else {
            console.log('error, ese cuit ya tiene un usuairo existente')
            done(null, false, req.flash('message', 'error, ese cuit ya tiene un usuairo existente  ')) // false para no avanzar

        }
    } catch (error) {
        console.log(error)
        req.flash('message', 'error,algo sucedio ')


    }
}


))











passport.serializeUser((user, done) => {
    done(null, user.id)
})


passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM usuarios Where id = ?', [id])
    done(null, rows[0])
})
