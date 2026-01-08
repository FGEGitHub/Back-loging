//if (typeof File === 'undefined') { global.File = class {}; }
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const flash = require ('connect-flash')
const session = require('express-session')
//const MySQLStore = require('express-mysql-session')
const MariaDBStore = require('express-mysql-session')(session);
const {database} = require('./keys')
const passport = require('passport')
const cors = require("cors");
const jwt = require('jsonwebtoken')
const keys = require('./keys')
///
var https = require('https'); var fs = require('fs'); const PUERTO = 4000;
const pool = require('./database')


////   



//inicializacion
const app = express()
require('./lib/passport')
app.set('key',keys.key)

//settings

app.set('port',  4000)
//app.enableCors({ origin: "*" })

app.set('view engine', '.hbs')


//middlwares

/* app.use(session({
    secret: 'faztmysqlnodesession',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
})) */
app.use('/imagenesvendedoras', express.static('imagenesvendedoras'));



  
  // Agregar la sesión a la configuración de Express
  app.use(session({
    secret: 'my_secret_',
    resave: false,
    saveUninitialized: false,
    store: new MariaDBStore(database)

}))










app.use(flash())
app.use(morgan('dev'))
app.use(express.urlencoded({extended:false})) // para recibir datos de formularios
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())


 const corsOptions ={
    origin:'*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
} 


app.use(cors(corsOptions));
//globalvariables
/* app.use((req,res,next)=>{
    app.locals.success = req.flash('success')
    app.locals.success = req.flash('message')
    app.locals.user = req.user
    next();
}) */


//routes
app.use(require('./routes/index'))
app.use(require('./routes/authentication'))
app.use(`/dtc`, require('./routes/dtc'))
app.use(`/personas`, require('./routes/personas'))
app.use(`/cursos`, require('./routes/cursos'))
app.use(`/novedades`, require('./routes/novedades'))
app.use(`/inscripciones`, require('./routes/inscripciones'))
app.use(`/tareas`, require('./routes/tareas'))
app.use(`/administracion`, require('./routes/administracion'))
app.use(`/encargados`, require('./routes/encargados'))
app.use(`/turnos`, require('./routes/turnos'))
app.use(`/coordinadores`, require('./routes/coordinadores'))
app.use(`/fiscalizacion`, require('./routes/fiscalizacion'))
app.use(`/carnavales`, require('./routes/carnavales'))
app.use(`/vendedoras`, require('./routes/vendedoras'))
app.use(`/doneu`, require('./routes/doneu'))
app.use(`/f1`, require('./routes/f1'))
//app.use(`/clinica`, require('./routes/clinica'))
//app.use(`/links`, require('./routes/links'))



//public  
app.use(express.static(path.join(__dirname, 'public') ))


//start 
app.listen(app.get('port'), async ()=>{
    console.log(`server onport`, app.get('port'))
  
})

