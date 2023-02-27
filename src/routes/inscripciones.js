const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const caregorizar = require('./funciones/caregorizar')
const consultarcupos = require('./funciones/cantidadocupado.')

router.get('/inscribirauto/', async (req, res) => {

  const inscripciones = await pool.query('select * from inscripciones where estado="pendiente"')
  const criterios = await pool.query('select * from criterios')

  console.log()
  for (ii in inscripciones) {

    persona = await pool.query('select * from personas where dni =?', inscripciones[ii]['dni_persona'])
    cat = await caregorizar.asignarcategoria(persona) //// trae la categoria
    turnoaux = inscripciones[0]['turno'].split(' ');
    console.log(turnoaux)
    bandera = false////la bandera para avisar si ya se inscribio en alguno de los cupos
    iii = 0
    while (!bandera && iii < turnoaux.length) {
      haycupo = await consultarcupos.cantidadcategoriaporcurso(cat, inscripciones[ii]['uno'], criterios[0][cat], turnoaux[iii])//// envia categoria y la id del curso devuelve si hay cupo 

      if (haycupo) {
        turnoo = await pool.query('select * from turnos where id_curso =? and numero = ?', [inscripciones[ii]['uno'], turnoaux[iii]])
     
       
        nuevo = {

          inscripcion: "Asignado a curso",
          id_persona: persona[0]['id'],
          id_curso: inscripciones[ii]['uno'],
          categoria: cat,
          id_inscripcion: inscripciones[ii]['id'],
          id_turno: turnoo[0]['id'],
          /////////////////

        }
  
        await pool.query('insert into cursado set ? ', [nuevo])

        act = {
          estado: "Asignado a curso",
        }
        await pool.query('update inscripciones set ? where id=? ', [act, inscripciones[ii]['id'],])
        bandera=true
      }
      iii += 1
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

    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo from inscripciones left join cursos on inscripciones.uno = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.uno = ?    ', [cursos[ii]['id']])
    console.log(cantidad)
 cursado = await pool.query('select * from cursado where id_curso= ?',[cursos[ii]['id']])
    Obj = {
      nombre: cantidad[0]['nombre'],
      cantidad: cantidad.length,
      cupo: cantidad[0]['cupo'],
      cursando: cursado.length,
      id: cantidad[0]['id'],
    }

    listadef.push(Obj)

  }

  console.log(listadef)
  listasi = []
  listano = []
  listadef2 = []

  /////// inicio carga de prioridad 2
  for (ii in cursos) {

    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo, count (*) cantidad from inscripciones left join cursos on inscripciones.dos = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.uno = ?    ', [cursos[ii]['id']])
    
 
    Obj = {
      nombre: cantidad[0]['nombre'],
      cantidad: cantidad.length,
      cupo: cantidad[0]['cupo'],
      id: cantidad[0]['id'],
    }

    listadef2.push(Obj)

  }





  listasi = []
  listano = []
  listadef3 = []

  /////// inicio carga de prioridad 3
  for (ii in cursos) {

    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo, count (*) cantidad from inscripciones left join cursos on inscripciones.tres = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.uno = ?   ', [cursos[ii]['id']])
    
 
    Obj = {
      nombre: cantidad[0]['nombre'],
      cantidad: cantidad.length,
      cupo: cantidad[0]['cupo'],
      id: cantidad[0]['id'],
    }

    listadef3.push(Obj)

  }
  ////////ista de inscriptos con prioridad dos











  //const priori2 = await pool.query('select * from inscripciones join cursos on inscripciones.dos  =cursos.id')
  // const priori3 = await pool.query('select * from inscripciones join cursos on inscripciones.tres  =cursos.id')

  res.json([listadef, listadef2, listadef3]);

})



module.exports = router