const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const caregorizar = require('./funciones/caregorizar')
const consultarcupos = require('./funciones/cantidadocupado.')





////// desinscribir 


router.get('/desinscribirtodos/', async (req, res) => {

  act = {
    estado: "pendiente"
  }

  await pool.query('update inscripciones set ?', [act])


  await pool.query('delete  from  cursado')
  res.json('Realizado')

})




/////definir cupos 
router.get('/designarturnos/', async (req, res) => {
  const descripcion_curso = await pool.query('select * from descripcion_turno')
  const cursos = await pool.query('select uno, count(uno) from inscripciones group by uno ')


  let inscripciones = await pool.query('select * from inscripciones where estado="pendiente"')

  let turnos = 0
  if (inscripciones.length > 1000) {
    turnos = 25
  } else {
    ///cursos de 10 personas
    turnos = inscripciones.length / 10//////ACA REEMPLAZAR POR 25 DESPUES DE LAS PRUEBAS
  }
  rta = []


  for (ii in cursos) {


    porcentaje = cursos[ii]['count(uno)'] / inscripciones.length * 100
    console.log(porcentaje)
    console.log(turnos)
    console.log(turnos * porcentaje / 100 + "%")

    cantidad = Math.round(turnos * porcentaje / 100)
    console.log(cantidad)
    for (let i = 0; i < cantidad; i++) {

      nuev = {
        id_curso: cursos[ii]['uno'],
        numero: i + 1,
        descripcion: descripcion_curso[i + 1]['descripcion']
      }
      await pool.query('insert into turnos set ? ', [nuev])
      act = {
        cupo: cantidad * 10////////////////////CAMBIAR A 25 CUANDO SE DE
      }
      await pool.query('update cursos set ?  where id=?', [act, cursos[ii]['uno']])

    }



  }


  res.json('Realizado')
})




router.get('/inscribirauto/', async (req, res) => {

  let inscripciones = await pool.query('select * from inscripciones where estado="pendiente"')
  const criterios = await pool.query('select * from criterios')
  listadef = []

  for (ii in inscripciones) {

    persona = await pool.query('select * from personas where dni =?', inscripciones[ii]['dni_persona'])
    cat = await caregorizar.asignarcategoria(persona) //// trae la categoria
    turnoaux = [inscripciones[ii]['horario'], inscripciones[ii]['horario']];



    bandera = false////la bandera para avisar si ya se inscribio en alguno de los cupos
    iii = 0
    if (persona.length === 0) {
      bandera = true
    }
    while (!bandera && iii < turnoaux.length) {////////ENTRA EN BUCLE REVISANDO CUPO EN HORARIOS

      if (iii === 0) {
        turnoactual = turnoaux[0][0]
      } else {
        turnoactual = turnoaux[1][0]
      }

      turno = await pool.query('select * from turnos where id_curso=? and numero = ?', [inscripciones[ii]['uno'], turnoactual])

      try {
        id_turn = turno[0]['id']
      } catch (err) {

        id_turn = '9999j'/////valor cualquiera
      }
      if (turno.length > 0) {
        haycupo = await consultarcupos.cantidadcategoriaporcurso(cat, inscripciones[ii]['uno'], criterios[criterios.length - 1][cat], id_turn)//// envia categoria y la id del curso devuelve si hay cupo 

        if (haycupo) {




          console.log(inscripciones[ii]['uno'])

          nuevo = {

            inscripcion: "Asignado a curso",
            id_persona: persona[0]['id'],
            id_curso: inscripciones[ii]['uno'],
            categoria: cat,
            id_inscripcion: inscripciones[ii]['id'],
            id_turno: id_turn,
            /////////////////

          }

          await pool.query('insert into cursado set ? ', [nuevo])

          act = {
            estado: "Asignado a curso",
          }
          await pool.query('update inscripciones set ? where id=? ', [act, inscripciones[ii]['id'],])
          bandera = true
        }
      }
      iii += 1
      if (!bandera) {
        listadef.push(inscripciones[ii])
        //////crea una listta con las inscripciones 1 rechazadas
      }


    }


  }


  ////////////propridad 2
  //////////listadef las sobranters
  for (ii in listadef) {


    persona = await pool.query('select * from personas where dni =?', listadef[ii]['dni_persona'])
    cat = await caregorizar.asignarcategoria(persona) //// trae la categoria
    turnoaux = [listadef[ii]['horario'], listadef[ii]['horario']];



    bandera = false////la bandera para avisar si ya se inscribio en alguno de los cupos
    iii = 0
    if (persona.length === 0) {
      bandera = true
    }
    while (!bandera && iii < turnoaux.length) {////////ENTRA EN BUCLE REVISANDO CUPO EN HORARIOS



      if (iii === 0) {
        turnoactual = turnoaux[0][0]
      } else {
        turnoactual = turnoaux[1][0]
      }

      turno = await pool.query('select * from turnos where id_curso=? and numero = ?', [listadef[ii]['dos'], turnoactual])
      if (turno.length >  0) {
        try {
          id_turn = turno[0]['id']
        } catch (err) {

          id_turn = '9999j'/////valor cualquiera
        }
        haycupo = await consultarcupos.cantidadcategoriaporcurso(cat, listadef[ii]['dos'], criterios[criterios.length - 1][cat], id_turn)//// envia categoria y la id del curso devuelve si hay cupo 


        if (haycupo) {





          nuevo = {

            inscripcion: "Asignado a curso",
            id_persona: persona[0]['id'],
            id_curso: listadef[ii]['dos'],
            categoria: cat,
            id_inscripcion: listadef[ii]['id'],
            id_turno: id_turn,
            /////////////////

          }

          await pool.query('insert into cursado set ? ', [nuevo])

          act = {
            estado: "Asignado a curso",
          }
          await pool.query('update inscripciones set ? where id=? ', [act, listadef[ii]['id'],])
          bandera = true
        }

      }
      iii += 1
    }


  }
  res.send('Realizado')
})






router.get('/listaaclaracioncriterios/', async (req, res) => {


  criterios = await pool.query(' select * from criterios ')

  tabla = [
    {
      Categoria: "1.1.1",
      Aclaracion: "Uno",
      Detalle: "No participo/Tiene hijos/No trabaja",
      porcentaje: criterios[criterios.length - 1]['uno']
    },
    {
      Categoria: "1.1.2.1",
      Detalle: "No participo/Tiene hijos/trabaja informalmente",
      Aclaracion: "Dos",
      porcentaje: criterios[criterios.length - 1]['dos']
    },
    {
      Categoria: "1.1.2.2",
      Aclaracion: "Tres",
      Detalle: "No participo/Tiene hijos/trabaja formalmente",
      porcentaje: criterios[criterios.length - 1]['tres']
    },
    {
      Categoria: "1.2.1",
      Aclaracion: "Cuatro",
      Detalle: "No participo/ No tiene hijos/ No trabaja ",
      porcentaje: criterios[criterios.length - 1]['cuatro']
    }
    , {
      Categoria: "1.2.2.1",
      Aclaracion: "Cinco",
      Detalle: "No participo/ No tiene hijos/ Trabaja Informalmente",
      porcentaje: criterios[criterios.length - 1]['cinco']
    },
    {
      Categoria: "1.2.2.2",
      Aclaracion: "Seis",
      Detalle: "No participo/ No tiene hijos/ Trabaja Formalmente",
      porcentaje: criterios[criterios.length - 1]['seis']
    },

    {
      Categoria: "2.1.1",
      Aclaracion: "Siete",
      Detalle: "Participo/Tiene hijos/ trabaja",
      porcentaje: criterios[criterios.length - 1]['siete']
    },
    {
      Categoria: "2.1.2.1",
      Aclaracion: "Ocho",
      Detalle: "Participo/Tiene hijos/ Tranaja informalmente",
      porcentaje: criterios[criterios.length - 1]['ocho']
    },
    {
      Categoria: "2.1.2.2",
      Aclaracion: "Nueve",
      Detalle: "Participo/Tiene hijos/ Tranaja Formalmente",
      porcentaje: criterios[criterios.length - 1]['nueve']
    },
    {
      Categoria: "2.2.1",
      Aclaracion: "Diez",
      Detalle: "Participo/ No tiene hijos/ No trabaja",
      porcentaje: criterios[criterios.length - 1]['diez']
    },
    {
      Categoria: "2.2.2",
      Aclaracion: "Once",
      Detalle: "Participo/ No tiene hijos/ trabaja",
      porcentaje: criterios[criterios.length - 1]['once']
    },


  ]
  res.json(tabla)

})


///////// LISTA DE CRITERIOS 

router.get('/listacriterios/', async (req, res) => {

  criterios = await pool.query('select * from criterios')

  res.json(criterios)
})


router.get('/listacursos/', async (req, res) => {

  ////////ista de inscriptos con prioridad uno

  // const detallepriori1 = await pool.query('select cursos.nombre,  cupo from inscripciones  join personas on inscripciones.dni_persona  = personas.dni join cursos on inscripciones.uno = cursos.id  ')

  //seleccionamos los cursos 
  const cursos = await pool.query(' select id from cursos')
  //recorremos los cursos 

  listadef = []

  /////// inicio carga de prioridad 1
  for (ii in cursos) {

    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo from inscripciones left join cursos on inscripciones.uno = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.uno = ?    ', [cursos[ii]['id']])

    cursado = await pool.query('select * from cursado where id_curso= ?', [cursos[ii]['id']])
    Obj = {
      nombre: cantidad[0]['nombre'],
      cantidad: cantidad.length,
      cupo: cantidad[0]['cupo'],
      cursando: cursado.length,
      id: cantidad[0]['id'],
    }

    listadef.push(Obj)

  }



  listadef2 = []

  /////// inicio carga de prioridad 2
  for (ii in cursos) {
    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo from inscripciones left join cursos on inscripciones.dos = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.dos = ?    ', [cursos[ii]['id']])

    cursado = await pool.query('select * from cursado where id_curso= ?', [cursos[ii]['id']])
    Obj = {
      nombre: cantidad[0]['nombre'],
      cantidad: cantidad.length,
      cupo: cantidad[0]['cupo'],
      cursando: cursado.length,
      id: cantidad[0]['id'],
    }

    listadef2.push(Obj)

  }





  listadef3 = []

  /////// inicio carga de prioridad 3
  /*
  for (ii in cursos) {

    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo  from inscripciones left join cursos on inscripciones.tres = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.tres = ?   ', [cursos[ii]['id']])
    
 
    Obj = {
      nombre: cantidad[0]['nombre'],
      cantidad: cantidad.length,
      cupo: cantidad[0]['cupo'],
      id: cantidad[0]['id'],
    }

    listadef3.push(Obj)

  }*/
  ////////ista de inscriptos con prioridad dos





  const pend = await pool.query('select count(*) from inscripciones where estado = "pendiente" ')





  //const priori2 = await pool.query('select * from inscripciones join cursos on inscripciones.dos  =cursos.id')
  // const priori3 = await pool.query('select * from inscripciones join cursos on inscripciones.tres  =cursos.id')

  res.json([listadef, listadef2, listadef3, pend[0]["count(*)"]]);

})
router.post("/actualizarprioridades", isLoggedInn2, async (req, res) => {
  const { unounouno, unounodosuno, unounodosdos, unodosuno, unodosdosuno, unodosdosdos, dosunouno, dosunodosuno, dosunodosdos, dosdosuno, dosdosdos } = req.body

  const act = {
    uno: unounouno,
    dos: unounodosuno,
    tres: unounodosdos,

    cuatro: unodosuno,
    cinco: unodosdosuno,
    seis: unodosdosdos,
    siete: dosunouno,
    ocho: dosunodosuno,
    nueve: dosunodosdos,
    diez: dosdosuno,
    once: dosdosdos,
  }
  console.log(act)
  await pool.query('insert criterios set ? ', [act])


  res.json('realizado')
})

module.exports = router