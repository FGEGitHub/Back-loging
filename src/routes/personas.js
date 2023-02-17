const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')





router.get('/datosusuario/:usuario', async (req, res) => {
  const usuario = req.params.usuario
 
  const etc = await pool.query('select * from usuarios where usuario =?', [usuario])

  res.json([etc]);
  //res.render('index')
})

router.get('/lista', async (req, res) => {
  const usuario = req.params.usuario
 
  const etc = await pool.query('select * from personas')
 
  res.json(etc);
  //res.render('index')
})

router.get('/datosusuarioporid/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id
  console.log(id)
  const aux = await pool.query('select * from usuarios where id =?', [id])

  const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])
 
  porcentaje = 100
  console.log(etc[0]['trabajo'])
  if (etc[0]['trabajo'] == 'Si') {

    porcentaje -= 33
  }
  if (etc[0]['hijos'] == 'Si') {
    porcentaje -= 33
  }
  anios = parseInt(etc[0]['anios'])

  if (anios > 35) {
    console.log(anios)
    porcentaje -= 33
  }
  console.log(porcentaje)
  res.json([etc, porcentaje]);
  //res.render('index')
})








router.post("/inscribir", isLoggedInn2, async (req, res) => {
  const { id_curso, id_usuario, accion } = req.body
console.log(id_usuario+'   '+accion)

const aux = await pool.query('select * from usuarios where id =?', [id_usuario])

const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])


  try {
    let act = {
      inscripcion: 'Pendiente'
    }


    if (accion == 'Aceptar') { 
      console.log('opcion aceptar ')
    act = {
      inscripcion: 'Cursando'
    }}
   
    if (accion == 'Rechazar') { 
    act = {
      inscripcion: 'Rechazado'
    }}


    await pool.query('UPDATE cursado set ? WHERE id_curso = ? and id_persona = ?  ', [act, id_curso,etc[0]['id']])
    res.json('Realizado con exito ')

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


router.post("/modificardatosadic", isLoggedInn, async (req, res) => {
  const { anios, trabajo, hijos, usuario } = req.body
try {
  const aux = await pool.query('select * from usuarios where usuario =?', [usuario])

const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])

act = { anios, trabajo, hijos }  

await pool.query('UPDATE personas set ?  where id = ?  ', [act, etc[0]['id']])
res.json('Guardado con exito')
} catch (error) {
  console.log(error)
  res.json('Error algo sucedio')
}
})




router.post("/crear", isLoggedInn, async (req, res) => {
  const { nombre, apellido, fecha_nac, trabajo, hijos,dni } = req.body
try {
 
  etc= { nombre, apellido, fecha_nac, trabajo, hijos,dni }
  console.log(etc)
  await pool.query('insert personas  set ?', [etc])
  console.log(1)
res.json('Guardado con exito')
} catch (error) {
  console.log(error)
  res.json('Error algo sucedio')
}
})

module.exports = router