const express = require('express')
const router = express.Router()
const passport= require('passport')
const pool = require('../database')
const {isLoggedIn,isLoggedInn,isLoggedInn2, } = require('../lib/auth')

router.get('/todos/', async (req, res) => {
   
  
    const etc = await pool.query ('select * from usuarios where nivel =1 or nivel = 2 or nivel = 3 or nivel = 4 or nivel=6' )
  res.json(etc);
//res.render('index')
})



router.get('/todoscadia/', async (req, res) => {
   
  
  const etc = await pool.query ('select * from usuarios where nivel =40 OR nivel=41  ' )
res.json(etc);
//res.render('index')
})


router.get('/todosdtc/', async (req, res) => {
   
  
  const etc = await pool.query ('select * from usuarios where nivel =20 OR nivel=21 or nivel =22 or nivel =23 or nivel =24 or nivel =25 or nivel =26 or nivel =27 or nivel =28' )
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


router.get('/contactos/', async (req, res) => {
   

  let encargados = await pool.query('select * from usuarios where nivel=4')
let enviar =[]
let totalconfirmados=0
let totalrechazados=0

for (ii in encargados) {


let confirmados =  await pool.query('select * from cursado join (select id as idturno, id_encargado from turnos  ) as selec1 on cursado.id_turno=selec1.idturno where selec1.id_encargado =? and inscripcion="Confirmado"',[encargados[ii]['id']])
let asignados =  await pool.query('select * from cursado join (select id as idturno, id_encargado from turnos  ) as selec1 on cursado.id_turno=selec1.idturno where selec1.id_encargado =? and inscripcion="Asignado a curso"',[encargados[ii]['id']])
let rechazados =  await pool.query('select * from cursado join (select id as idturno, id_encargado from turnos  ) as selec1 on cursado.id_turno=selec1.idturno where selec1.id_encargado =? and inscripcion="Rechazado"',[encargados[ii]['id']])
let nuevo ={
  nombre: encargados[ii]['nombre'],
  confirmados:confirmados.length,
  asignados:asignados.length,
  rechazados:rechazados.length
}
totalconfirmados= totalconfirmados + confirmados.length
totalrechazados =totalrechazados + rechazados.length
enviar.push(nuevo)
}

let resumen={
  totalconfirmados,
  totalrechazados
}
res.json([enviar,resumen])



//res.render('index')
})
  router.post('/signupp',passport.authenticate('local.registroadmin', {
    successRedirect: '/exitosignup',
    failureRedirect:'/noexito',
    failureFlash:true

}))


router.post('/modificarusuario',  passport.authenticate('local.modificadoradmin', {
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