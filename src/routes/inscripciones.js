const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const caregorizar = require('./funciones/caregorizar')
const consultarcupos = require('./funciones/cantidadocupado.')

router.get('/inscribirauto/', async (req, res) => {

  const inscripciones= await pool.query('select * from inscripciones where estado="pendiente"')
  const criterios = await pool.query('select * from criterios')

console.log()
  for (ii in inscripciones) {

    persona = await pool.query('select * from personas where dni =?',inscripciones[ii]['dni_persona'])
       cat = await caregorizar.asignarcategoria(persona) //// trae la categoria
      
       haycupo= await consultarcupos.cantidadcategoriaporcurso(cat,inscripciones[ii]['uno'], criterios[0][cat], criterios[0]['turno'] )//// envia categoria y la id del curso devuelve si hay cupo 
   
    if(haycupo){

      nuevo = {
     
        inscripcion:"Asignado a curso",
        id_persona: persona[0]['id'],
        id_curso:inscripciones[ii]['uno'],
        categoria:cat,
        id_inscripcion:inscripciones[ii]['id'],


      }
      console.log(nuevo)
          await pool.query('insert into cursado set ? ',[nuevo])

          act={
            estado:"Asignado a curso",
          }
          await pool.query('update inscripciones set ? where id=? ',[act,inscripciones[ii]['id'],])

    }

   
  
  }
res.send('hola')
})


router.get('/listacursos/', async (req, res) => {

  ////////ista de inscriptos con prioridad uno

 // const detallepriori1 = await pool.query('select cursos.nombre,  cupo from inscripciones  join personas on inscripciones.dni_persona  = personas.dni join cursos on inscripciones.uno = cursos.id  ')

  //seleccionamos los cursos 
  const cursos = await pool.query(' select id from cursos')
  //recorremos los cursos 
  listasi = []
  listano = []
  listadef = []

  /////// inicio carga de prioridad 1
  for (ii in cursos) {
    
    cantidadsi = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo, count (*) cantidadsi from inscripciones left join cursos on inscripciones.uno = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.uno = ?  and personas.participante_anterior="Sí" and inscripciones.estado ="pendiente"  ', [cursos[ii]['id']])
    cantidadno = await pool.query('select  cursos.nombre,count (*) cantidadno  from inscripciones left join cursos on inscripciones.uno = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.uno = ?  and personas.participante_anterior="No" and inscripciones.estado ="pendiente"', [cursos[ii]['id']])
   console.log(cantidadsi[0]['nombre'])
    Obj = {
      nombre:cantidadsi[0]['nombre'],
      cantidadsi:cantidadsi[0]['cantidadsi'],
      cantidadno:cantidadno[0]['cantidadno'],
      cupo:cantidadsi[0]['cupo'],
      id:cantidadsi[0]['id'],
     }
    
    listadef.push(Obj)
  
  }

  console.log(listadef)
  listasi = []
  listano = []
  listadef2 = []

  /////// inicio carga de prioridad 2
  for (ii in cursos) {
    
    cantidadsi = await pool.query('select  cursos.nombre, cursos.id,cursos.cupo,count (*) cantidadsi from inscripciones left join cursos on inscripciones.dos = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.dos = ?  and personas.participante_anterior="Sí" and inscripciones.estado ="pendiente"  ', [cursos[ii]['id']])
    cantidadno = await pool.query('select  cursos.nombre,count (*) cantidadno  from inscripciones left join cursos on inscripciones.dos = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.dos = ?  and personas.participante_anterior="No" and inscripciones.estado ="pendiente"', [cursos[ii]['id']])
   console.log(cantidadsi[0]['nombre'])
    Obj = {
      nombre:cantidadsi[0]['nombre'],
      cantidadsi:cantidadsi[0]['cantidadsi'],
      cantidadno:cantidadno[0]['cantidadno'],
      cupo:cantidadsi[0]['cupo'],
      id:cantidadsi[0]['id'],
     }
    
     listadef2.push(Obj)
  
  }





  listasi = []
  listano = []
  listadef3 = []

  /////// inicio carga de prioridad 3
  for (ii in cursos) {
    
    cantidadsi = await pool.query('select  cursos.nombre,cursos.id,cursos.cupo,count (*) cantidadsi from inscripciones left join cursos on inscripciones.tres = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.tres = ?  and personas.participante_anterior="Sí" and inscripciones.estado ="pendiente"  ', [cursos[ii]['id']])
    cantidadno = await pool.query('select  cursos.nombre,count (*) cantidadno  from inscripciones left join cursos on inscripciones.tres = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.tres = ?  and personas.participante_anterior="No" and inscripciones.estado ="pendiente"', [cursos[ii]['id']])
   console.log(cantidadsi[0]['nombre'])
    Obj = {
      nombre:cantidadsi[0]['nombre'],
      cantidadsi:cantidadsi[0]['cantidadsi'],
      cantidadno:cantidadno[0]['cantidadno'],
      cupo:cantidadsi[0]['cupo'],
      id:cantidadsi[0]['id'],
     }
    
     listadef3.push(Obj)
  
  }
  ////////ista de inscriptos con prioridad dos











  //const priori2 = await pool.query('select * from inscripciones join cursos on inscripciones.dos  =cursos.id')
  // const priori3 = await pool.query('select * from inscripciones join cursos on inscripciones.tres  =cursos.id')
  
  res.json([listadef,listadef2,listadef3]);

})



module.exports = router