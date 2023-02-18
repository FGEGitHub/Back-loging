const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')



router.get('/listacursos/', isLoggedInn2, async (req, res) => {


    const priori1 = await pool.query('select * from inscripciones left join cursos on inscripciones.uno =cursos.id ')
   console.log(priori1.length)
    //const priori2 = await pool.query('select * from inscripciones join cursos on inscripciones.dos  =cursos.id')
   // const priori3 = await pool.query('select * from inscripciones join cursos on inscripciones.tres  =cursos.id')
  
   // res.json([priori1,[0],[0]]);
    //res.render('index')
  })



module.exports = router