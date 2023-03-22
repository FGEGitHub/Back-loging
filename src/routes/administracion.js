const express = require('express')
const router = express.Router()
const passport= require('passport')
const pool = require('../database')
const {isLoggedIn,isLoggedInn,isLoggedInn2, } = require('../lib/auth')

router.get('/todos/', async (req, res) => {
   
  
    const etc = await pool.query ('select * from usuarios' )
console.log(etc)
  res.json(etc);
//res.render('index')
})


router.get('/traertodoelcursado/', async (req, res) => {
   
  
  const etc = await pool.query ('select * from cursado join (select id as idinscripcion, horario as horarioincripcion,uno,dos from inscripciones ) as selec1 on cursado.id_inscripcion = selec1.idinscripcion join (select id as idpersona, nombre as nombrepersona, apellido as apellidopersona from personas) as selec2 on cursado.id_persona=selec2.idpersona join (select id as idturno, id_curso as cursoo, numero from turnos) as selec3 on cursado.id_turno=selec3.idturno ')
cursos = await pool.query('select * from cursos')
 
res.json([etc,cursos]);
//res.render('index')
})

router.get('/sistemas/', async (req, res) => {
   
  
  const etc = await pool.query ('select * from cursado' )
  const etc2 = await pool.query ('select * from turnos' )
  const etc3 = await pool.query ('select * from personas' )
  const etc4 = await pool.query ('select * from cursos' )
  console.log(etc4)
res.json([etc,etc2,etc3,etc4]);
//res.render('index')
})


  router.post('/signupp', isLoggedInn2, passport.authenticate('local.registroadmin', {
    successRedirect: '/exitosignup',
    failureRedirect:'/noexito',
    failureFlash:true

}))


router.post('/modificarusuario', isLoggedInn2, passport.authenticate('local.modificadoradmin', {
  successRedirect: '/exitosignupp',
  failureRedirect:'/exitosignupp',
  failureFlash:true

}))


router.post('/borrarusuario', async (req, res) => {
  const { id } = req.body
  try {
    await pool.query('delete  from  usuarios where id = ?',[id])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('no realizado')
  }

})


module.exports = router