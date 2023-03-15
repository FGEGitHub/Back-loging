const express = require('express')
const morgan = require('morgan')
const path = require('path')
const flash = require ('connect-flash')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')
const {database} = require('./keys')
const passport = require('passport')
const cors = require("cors");
const jwt = require('jsonwebtoken')
const keys = require('./keys')


////




//inicializacion
const app = express()
require('./lib/passport')
app.set('key',keys.key)

//settings

app.set('port',  4000)


app.set('view engine', '.hbs')


//middlwares
app.use(session({
    secret: 'faztmysqlnodesession',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}))

app.use(flash())
app.use(morgan('dev'))
app.use(express.urlencoded({extended:false})) // para recibir datos de formularios
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())
app.use(cors());

const corsOptions ={
    origin:'http://localhost:3000', 
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
app.use(`/personas`, require('./routes/personas'))
app.use(`/cursos`, require('./routes/cursos'))
app.use(`/novedades`, require('./routes/novedades'))
app.use(`/inscripciones`, require('./routes/inscripciones'))
app.use(`/tareas`, require('./routes/tareas'))
app.use(`/administracion`, require('./routes/administracion'))
app.use(`/encargados`, require('./routes/encargados'))
app.use(`/turnos`, require('./routes/turnos'))
//app.use(`/links`, require('./routes/links'))



//public  
app.use(express.static(path.join(__dirname, 'public') ))


//start 
app.listen(app.get('port'), ()=>{
    console.log(`server onport`, app.get('port'))
})

