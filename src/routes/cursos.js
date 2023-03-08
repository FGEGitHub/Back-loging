const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')



router.get('/lista/', isLoggedInn, async (req, res) => {


  const etc = await pool.query('select * from cursos')

  res.json(etc);
  //res.render('index')
})


/////// lista desde el usuario 1
router.get('/listaniv1/:usuario', isLoggedInn, async (req, res) => {
  const usuario = req.params.usuario


  const aux = await pool.query('select * from usuarios where usuario =?', [usuario])

  const etc2 = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])



  const etc3 = await pool.query('select cursos.id,cursos.fecha , encargado, nombre, cupo, cursos.id, c.inscripcion, c.id_persona from cursos left join (select * from cursado where id_persona = ? ) c on cursos.id=c.id_curso  ', [etc2[0]['id']])

  try {
    ///const etc4 = await pool.query('select * from cursos join  cursado ')

    res.json(etc3);
  } catch (error) {
    console.log(Error)
    res.json('Error algo salio mal')
  }
  //res.render('index')
})



router.get('/verclases/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id
  try {
    const etc = await pool.query('select * from clases where id_curso = ? ', [id])
    res.json(etc)
  } catch (error) {
    console.log(error)
    res.json(['']);
  }
})













router.get('/asistencia/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id

  try {
    /// trae la clase
    const clase = await pool.query('select * from clases where id = ?', [id])
//// trae el listado de alumnos  que cursan en ese turno

    const alumnos = await pool.query('select * from cursado join personas on cursado.id_persona=personas.id  where cursado.id_turno = ?  and cursado.inscripcion= "Confirmado" ', [clase[0]['id_turno']])
console.log('asistencia')
console.log(alumnos)

    ////recorremos por la asistencia
    asistenciaa=[]
    for (ii in alumnos) {

        asis = await pool.query('select * from asistencia where id_alumno = ? and id_clase = ?',[alumnos[ii]['id_persona'],id])

      if (asis.length === 0) {
        aux = {
          id_alumno:alumnos[ii]['id_persona'],
          nombre: alumnos[ii]['nombre'],
          apellido: alumnos[ii]['apellido'],
          dni:alumnos[ii]['dni'],
          asistencia:'No Tomada',
          id_clase:id
         
        }
        asistenciaa.push(aux)
        }else{
      
          aux = {
            id_alumno:alumnos[ii]['id_persona'],
            nombre: alumnos[ii]['nombre'],
            apellido: alumnos[ii]['apellido'],
            dni:alumnos[ii]['dni'],
            asistencia:asis[0]['asistencia'],
            id_clase:id
           
          }
          asistenciaa.push(aux)
        }
      

    }




    console.log(asistenciaa)
    res.json([clase, asistenciaa])
  } catch (error) {
    console.log(error)
  }


})

router.get('/listadeturnos/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id
  console.log(id)
  turnos = await pool.query('select * from turnos  where id_curso = ?', [id])

  todos = []
  for (ii in turnos) {
    cursado = await pool.query('select *, turnos.id from cursado join turnos on cursado.id_turno=turnos.id join personas on cursado.id_persona =personas.id where cursado.id_curso = ? and cursado.id_turno =?', [id, turnos[ii]['id']])
    if (cursado.length > 0) {
      todos.push(cursado)
      }else{
        console.log(turnos[ii])
        cursado = {
          id_turno:turnos[ii]['id'],
          turno: turnos[ii]['numero'],
          descripcion: turnos[ii]['descripcion'],
          encargado:turnos[ii]['encargado'],
          motivo:turnos[ii]['motivo'],
         
        }
        todos.push([cursado])
      }
    
    

  }
console.log(todos)
  res.json(todos)


})


router.get('/detalledelcurso/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id
  try {
    /////CLASES DEL CURSO
 
    //////pendientes inscriptos prioridad 1 2 3
    const pendientes1 = await pool.query('select inscripciones.id id_inscripcion,personas.hijos, inscripciones.estado,inscripciones.uno,inscripciones.dos,inscripciones.tres, personas.nombre,personas.dni, personas.apellido, personas.trabajo, personas.tipo_trabajo, personas.participante_anterior from inscripciones join personas on inscripciones.dni_persona = personas.dni where uno=?  ', [id])

    const pendientes2 = await pool.query('select inscripciones.id id_inscripcion,personas.hijos, inscripciones.estado,inscripciones.uno,inscripciones.dos,inscripciones.tres, personas.nombre,personas.dni, personas.trabajo, personas.apellido,personas.tipo_trabajo, personas.participante_anterior from inscripciones join personas on inscripciones.dni_persona = personas.dni where dos=? ', [id])
    const pendientes3 = await pool.query('select inscripciones.id id_inscripcion,personas.hijos, inscripciones.estado,inscripciones.uno,inscripciones.dos,inscripciones.tres, personas.nombre,personas.dni, personas.trabajo,personas.apellido, personas.tipo_trabajo, personas.participante_anterior from inscripciones join personas on inscripciones.dni_persona = personas.dni where tres=?  ', [id])

    cursado = await pool.query('select cursado.id, cursado.categoria, cursado.id_persona,cursado.inscripcion, cursado.id_curso,turnos.descripcion horario, personas.nombre, personas.apellido from cursado join personas on cursado.id_persona=personas.id join turnos on cursado.id_turno = turnos.id where cursado.id_curso = ? ', [id])


    array1 = pendientes1.concat(pendientes2);

    array1 = array1.concat(pendientes3);

    const criterios = await pool.query('select * from criterios ')
    /////isncripciones si participo/no participo
    //si
    //const cursadosi = await pool.query('select * from inscripciones join personas on inscripciones.dni_persona =personas.dni  where inscripciones.uno=? and personas.participante_anterior="Sí"', [id])
    //no
    //const cursadono = await pool.query('select * from inscripciones join personas on inscripciones.dni_persona =personas.dni  where inscripciones.uno=? and personas.participante_anterior="No"', [id])
    ///////datos del curso
    const curso = await pool.query('select * from cursos where id = ? ', [id])
    console.log(curso)
    ////////////ALUMNOS YAINSCRIPTOS
    const inscriptos = await pool.query('select * from cursado where id_curso=? ', [id])
    console.log(cursado.length)
    ///CLASES DEL CURSO
    const clases = []

    ///---------------------------------------------------
    //////ARMADO DE TABLA DL CURSO

    unounouno = 0
    unounodosuno = 0
    unounodosdos = 0
    unodosuno = 0
    unodosdosuno = 0
    unodosdosdos = 0
    dosunouno = 0
    dosunodosuno = 0
    dosunodosdos = 0
    dosdosuno = 0
    dosdosdos = 0


    for (ii in cursado) {

      switch (cursado[ii]['categoria']) {
        case "uno":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          unounouno += 1
          break;
        case "dos":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          unounodosuno += 1
          break
        case "tres":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          unounodosdos += 1
          break;
        case "cuatro":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          unodosuno += 1
          break;
        case "cinco":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          unodosdosuno += 1
          break;
        case "seis":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          unodosdosdos += 1
          break;
        case "siete":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          dosunouno += 1
          break;
        case "ocho":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          dosunodosuno += 1
          break;
        case "nueve":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          dosunodosdos += 1
          break;


        case "diez":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          dosdosuno += 1
          break;
        case "once":
          //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
          dosdosdos += 1
          break;

      }
    }

    lista = []
    auxil = {
      dato: "Cupo",
      cantidad: curso[0]['cupo']
    }
    lista.push(auxil)

    auxil = {
      dato: "Participo/tiene hijos/trabaja formal",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['nueve']) / 100).toFixed(2),
      aceptados: dosunodosdos,
      aclaracion: "Nueve",
      Categoria: "K"
    }
    lista.push(auxil)
    auxil = {
      dato: "Participo/tiene hijos/trabaja Informal",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['ocho']) / 100).toFixed(2),
      aceptados: dosunodosuno,
      aclaracion: "Ocho",
      Categoria: "I"
    }
    lista.push(auxil)
    auxil = {
      dato: "Participo/tiene hijos/No trabaja",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['siete']) / 100).toFixed(2),
      aceptados: dosunouno,
      aclaracion: "Siete",
      Categoria: "A"
    }
    lista.push(auxil)

    auxil = {
      dato: "Participo/No tiene hijos/No trabaja",
      cantidad: curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['diez'] / 100).toFixed(2),
      aceptados: dosdosuno,
      aclaracion: "Diez",
      Categoria: "E"
    }
    lista.push(auxil)

    auxil = {
      dato: "Participo/No tiene hijos/trabaja (formal/Informal)",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['once']) / 100).toFixed(2),
      aceptados: dosdosdos,
      aclaracion: "Once",
      Categoria: "J"
    }
    lista.push(auxil)

    auxil = {
      dato: "No Participo/tiene hijos/trabaja Formalmente ",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['tres']) / 100).toFixed(2),
      aceptados: unounodosdos,
      aclaracion: "Tres",
      Categoria: "F"
    }
    lista.push(auxil)

    auxil = {
      dato: "No Participo/tiene hijos/trabaja Informalmente ",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['dos']) / 100).toFixed(2),
      aceptados: unounodosuno,
      aclaracion: "Dos",
      Categoria: "C"
    }
    lista.push(auxil)

    auxil = {
      dato: "No Participo/tiene hijos/No trabaja ",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['uno']) / 100).toFixed(2),
      aceptados: unounouno,
      aclaracion: "Uno",
      Categoria: "B"
    }
    lista.push(auxil)


    auxil = {
      dato: "No Participo/No tiene hijos/No trabaja ",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['cuatro']) / 100).toFixed(2),
      aceptados: unodosuno,
      aclaracion: "Cuatro",
      Categoria: "D"
    }
    lista.push(auxil)

    auxil = {
      dato: "No Participo/No tiene hijos/Trabaja Formalmente ",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['seis']) / 100).toFixed(2),
      aceptados: unodosdosdos,
      aclaracion: "Seis",
      Categoria: "H"
    }
    lista.push(auxil)

    auxil = {
      dato: "No Participo/No tiene hijos/Trabaja Informalmente ",
      cantidad: (curso[0]['cupo'] * parseFloat(criterios[criterios.length - 1]['cinco']) / 100).toFixed(2),
      aceptados: unodosdosuno,
      aclaracion: "Cinco",
      Categoria: "G"
    }
    lista.push(auxil)

    res.json([array1, curso, inscriptos.length, clases, lista, cursado]);
  } catch (error) {
    console.log(error)
    res.json(['']);
  }


})



router.post("/crear", isLoggedInn2, async (req, res) => {
  const { nombre, observaciones, encargado, cupo } = req.body


  try {
    datos = {
      fecha: (new Date(Date.now())).toLocaleDateString(),
      nombre,
      observaciones,
      encargado,
      cupo
    }

    await pool.query('insert cursos  set ?', [datos])
    aux = await pool.query('select * from cursos ')
    console.log((aux.length))
    console.log(aux[(aux.length - 1)])
    console.log(aux[(aux.length - 1)]['id'])
    idaux = aux[(aux.length - 1)]['id']
    nove = {
      id_ref: idaux,
      asunto: 'Nuevo Curso',
      detalle: 'Lanzamiento de curso:' + nombre,
      fecha: (new Date(Date.now())).toLocaleDateString(),


    }
    await pool.query('insert novedades  set ?', [nove])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }

})



router.post("/nuevaclase", isLoggedInn2, async (req, res) => {
  const { id_curso, fecha, observaciones } = req.body
  console.log(id_curso)
  console.log(fecha)
  try {


    const nuev = {
      id_curso, fecha, observacion: observaciones
    }
    await pool.query('insert clases  set ?', [nuev])
    res.json('Cargada nueva clase')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }

})

router.post("/inscribir", isLoggedInn, async (req, res) => {
  const { id, usuario } = req.body

  try {
    const aux = await pool.query('select * from usuarios where usuario =?', [usuario])

    const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])


    nove = {
      id_persona: etc,
      id_curso: id,
      inscripcion: 'Pendiente',
      fecha: (new Date(Date.now())).toLocaleDateString(),


    }
    await pool.query('insert cursado  set ?', [nove])
    res.json('Solicitud realizada ')

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


router.post("/presente", isLoggedInn2, async (req, res) => {
  const { id_usuario, id } = req.body ///
  console.log(id_usuario)
})

module.exports = router