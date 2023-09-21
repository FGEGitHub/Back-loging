const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database')




router.get('/lista/', isLoggedInn4, async (req, res) => {
  console.log('lista')
  const etc = await pool.query('select * from cursos where id = 132 or id = 133 or id = 134 or id = 135 or id = 136')
  respuesta = []
  for (iii in etc) {

    turnos = await pool.query('select * from turnos where id_curso =? ', [etc[iii]['id']])


    nuevo = {
      id: etc[iii]['id'],
      nombre: etc[iii]['nombre'],
      cantidad_turnos: turnos.length,

    }

    respuesta.push(nuevo)
  }





  res.json(respuesta);
  //res.render('index')
})



router.get('/traercursos', async (req, res) => {

const cursos = await pool.query('select * from cursos where id>131')

res.json(cursos)
})



router.get('/getturnos/:id', async (req, res) => {
  const id = req.params.id

  const turnos = await pool.query('select * from turnos where id_curso=?',[id])

  res.json(turnos)

})

router.get('/datosdelturno/:id', isLoggedInn4, async (req, res) => {
  try {
    const id = req.params.id

    let turno = await pool.query('select nombrecurso, turnos.id,  id_encargado, id_coordinador from turnos join (Select id as idcurso, nombre as nombrecurso from cursos) as selec1 on turnos.id_curso=selec1.idcurso where turnos.id=?  ', [id])
    let cantidad = await pool.query('select * from cursado where id_turno  =?', [id])
    let presentes = await pool.query('select * from asistencia join (select id as idclase, id_turno as idturno from clases )as selec1 on asistencia.id_clase=selec1.idclase where selec1.idturno =? and asistencia ="Presente" ',[id])
    let asusentes = await pool.query('select * from asistencia join (select id as idclase, id_turno as idturno from clases )as selec1 on asistencia.id_clase=selec1.idclase where selec1.idturno =? and asistencia <>"Presente" ',[id])
    
    let preaaus = {
      presentes:presentes.length,
      ausentes:asusentes.length
    }
    
    cant = {
      cantidad: cantidad.length
    }
    array1 = turno.concat(cant);

    encarg = await pool.query('select * from usuarios where id = ?', [turno[0]['id_encargado']])
    try {
      en = {
        encargado: encarg[0]['nombre']
      }
    } catch (error) {
      en = {
        encargado: 'Sin definir'
      }
    }

    array2 = array1.concat(en);

    coor = await pool.query('select * from usuarios where id = ?', [turno[0]['id_coordinador']])
    try {
      co = {
        coordinador: coor[0]['nombre']
      }
    } catch (error) {
      co = {
        coordinador: 'sin definir'
      }
    }

    array3 = array2.concat(co);
    
    array4 = array3.concat(preaaus);
    console.log('array')
console.log(array4)
    res.json(array4)
  } catch (error) {
    console.log(error)
    res.json(['nd', 'nd', 'nd', 'nd', 'nd'])
  }



})


router.get('/avancedelcurso/:id', isLoggedInn, async (req, res) => {
  const id = req.params.id



  let clases = await pool.query('select * from clases join (select id as idturno, id_curso, descripcion from turnos ) as selec on clases.id_turno = selec.idturno where selec.id_curso=? ', [id])
  let curso = await pool.query('select * from cursos where id =?', [id])

  let presentes1 = 0
  let ausentes1 = 0
  let ausentesjus1 = 0

  let presentes2 = 0
  let ausentes2 = 0
  let ausentesjus2 = 0

  let presentes3 = 0
  let ausentes3 = 0
  let ausentesjus3 = 0

  let presentes4 = 0
  let ausentes4 = 0
  let ausentesjus4 = 0

  let presentes5 = 0
  let ausentes5 = 0
  let ausentesjus5 = 0
  let clase1 = 0
  let clase2 = 0
  let clase3 = 0
  let clase4 = 0
  let clase5 = 0
  let totalpresentes = 0
  let totalausentes = 0
  //let total = await pool.query('select * from cursado join (select id as idturno, id_curso as idcurso from turnos) as selec1 on cursado.id_turno=selec1.idturno where selec1.idcurso=? and inscripcion="Confirmado"',[id])

  try {

    etc = []
    for (i in clases) {

      console.log(clases[i])

      let total = await pool.query('select * from cursado join (select id as idturno, id_curso as idcurso from turnos) as selec1 on cursado.id_turno=selec1.idturno where selec1.idturno=? and inscripcion="Confirmado"', [[clases[i]['id_turno']]])

      let pres = await pool.query('select * from asistencia where id_clase =?  and asistencia="Presente" ', [clases[i]['id']])


      let aus = await pool.query('select * from asistencia where id_clase =? and (asistencia<>"Presente" )', [clases[i]['id']])

      let ausjus = await pool.query('select * from asistencia where id_clase =? and (asistencia="Ausente justificado" )', [clases[i]['id']])

      totalpresentes = totalpresentes + pres.length
      totalausentes = totalausentes + aus.length


      switch (clases[i]['numero_clase']) {
        case '1':
          presentes1=presentes1+pres.length
          ausentes1=ausentes1+ aus.length
          ausentesjus1= ausentesjus1+ausjus.length
          break;
          case '2':
            presentes2=presentes2+pres.length
            ausentes2=ausentes2+ aus.length
            ausentesjus2= ausentesjus2+ausjus.length
            break;case '3':
            presentes3=presentes3+pres.length
            ausentes3=ausentes3+ aus.length
            ausentesjus3= ausentesjus3+ausjus.length
            break;case '4':
            presentes4=presentes4+pres.length
            ausentes4=ausentes4+ aus.length
            ausentesjus3= ausentesjus3+ausjus.length
            break;case '5':
            presentes5=presentes5+pres.length
            ausentes5=ausentes5+ aus.length
            ausentesjus3= ausentesjus3+ausjus.length
            break;




      }



      nuevo = {
        nombre: curso[0]['nombre'],
        id_clase: clases[i]['id'],
        id_turno:clases[i]['id_turno'],
        dato1: "Clase " + clases[i]['numero_clase'],
        presentes: pres.length,
        ausentes: aus.length,
        justificados: ausjus.length,
        descripcion: clases[i]['descripcion'],
        total: total.length



      }
      etc.push(nuevo)
    }




    ///const etc4 = await pool.query('select * from cursos join  cursado ')

    segundo = {
      totalpresentes,
      totalausentes,
      presentes1,
      ausentes1,
      ausentesjus1,
      presentes2,
      ausentes2,
      ausentesjus2,
      presentes3,
      ausentes3,
      ausentesjus3,
      presentes4,
      ausentes4,
      ausentesjus4,
      presentes5, 
      ausentes5,
      ausentesjus5 
    }
console.log(segundo)
    res.json([etc, segundo]);
  } catch (error) {
    console.log(Error)
    res.json([{
      nombre: 'Sin clases',
      dato1: "Clase 5",
      presentes: "Sin datos",
      ausentes: "Sin datos"
    }, {

      totalpresentes: "N/D",
      totalausentes: "N/D",

    }
    ])
  }
  //res.render('index')
})

/////// lista desde el usuario 1
router.get('/listaniv1/:usuario', isLoggedInn, async (req, res) => {
  const usuario = req.params.usuario


  const aux = await pool.query('select * from usuarios where usuario =?', [usuario])

  const etc2 = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])


  try {
    const etc3 = await pool.query('select cursos.id,cursos.fecha , encargado, nombre, cupo, cursos.id, c.inscripcion, c.id_persona from cursos left join (select * from cursado where id_persona = ? ) c on cursos.id=c.id_curso  ', [etc2[0]['id']])


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








router.get('/asistencia/:id', isLoggedInn4, async (req, res) => {
  const id = req.params.id

  try {
    /// trae la clase
    const clase = await pool.query('select * from clases where id = ?', [id])
    //// trae el listado de alumnos  que cursan en ese turno

    const alumnos = await pool.query('select * from cursado join   (select nombre,apellido, id as idpersona,dni from personas) as  personaa on cursado.id_persona=personaa.idpersona  where cursado.id_turno = ?  ORDER BY personaa.apellido', [clase[0]['id_turno']])

    total = alumnos.length
    presentes = 0
    ausentes = 0
    notomados = 0
    ////recorremos por la asistencia
    asistenciaa = []
    for (ii in alumnos) {

   let   asis = await pool.query('select * from asistencia where id_persona = ? and id_clase = ?', [alumnos[ii]['id_persona'], id])
let asisprimera  = await pool.query('select * from asistencia join (select id as idclase, id_turno, numero_clase from clases) as selec1 on asistencia.id_clase=selec1.idclase where id_persona = ? and numero_clase=1 and id_turno = ?', [alumnos[ii]['id_persona'], clase[0]['id_turno']])
     
let primera="No"
if (asisprimera.length>0){
         primera="Si"
      }else{
         primera="No"
      }

      if (asis.length === 0) {
        notomados += 1
        aux = {
          id_alumno: alumnos[ii]['id_persona'],
          nombre: alumnos[ii]['nombre'],
          apellido: alumnos[ii]['apellido'],
          dni: alumnos[ii]['dni'],
          asistencia: 'No Tomada',
          id_clase: id,
          primera

        }
        asistenciaa.push(aux)
      } else {
        if (asis[0]['asistencia'] === 'Presente') {
          presentes += 1
        } else {
          ausentes += 1
        }

        aux = {
          id_alumno: alumnos[ii]['id_persona'],
          nombre: alumnos[ii]['nombre'],
          apellido: alumnos[ii]['apellido'],
          dni: alumnos[ii]['dni'],
          asistencia: asis[0]['asistencia'],
          id_clase: id,
          primera

        }
        asistenciaa.push(aux)
      }


    }


    estadisticas = {
      presentes,
      ausentes,
      notomados,

    }

    res.json([clase, asistenciaa, estadisticas])
  } catch (error) {
    console.log(error)
  }


})



router.get('/borrarturno/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  try {

    try {

      cursado = await pool.query('select * from cursado where id_turno = ?', [id])

      for (ii in cursado) {



        await pool.query('update incripciones set estado="pendiente" where id=?  ', [cursado[ii]['id_inscripcion']])
      }
    } catch (error) {
      console.log(error)
    }


    await pool.query('delete  from  cursado where id_turno = ?', [id])
    //await pool.query('delete  from  inscripciones where id = ?', [id])
    await pool.query('delete  from  turnos where id = ?', [id])
    console.log('realizado')
    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json(' no realizado')
  }


})



router.get('/listadetodoslosturnos/', isLoggedInn2, async (req, res) => {
  try {
    console.log('listadetodos')
    tur = await pool.query('select * from turnos   join  (select id as idcurso, nombre as nombrecurso from cursos) as selec1  on turnos.id_curso= selec1.idcurso ')


    todos = []
    for (ii in tur) {

      cat = await pool.query('select * from cursado where id_turno= ?', [tur[ii]['id']])
      faltan = await pool.query('select * from cursado where id_turno= ? and (inscripcion <> "Confirmado" and inscripcion <> "Rechazado") ', [tur[ii]['id']])
      en = await pool.query('select * from usuarios where id= ?', [tur[ii]['id_encargado']])
      c1 = await pool.query('select * from usuarios where id= ?', [tur[ii]['id_coordinador']])
      rechazados = await pool.query('select * from cursado where id_turno= ? and inscripcion = "Rechazado" ', [tur[ii]['id']])
      enc = 'sin determinar'
      if (en.length > 0) {
        enc = en[0]['nombre']
      }

      coor = 'sin determinar'
      if (c1.length > 0) {
        coor = c1[0]['nombre']
      }




      nuev = {
        id: tur[ii]['id'],
        id_curso: tur[ii]['id_curso'],
        numero: tur[ii]['numero'],
        descripcion: tur[ii]['descripcion'],
        enc,
        coor,
        idcurso: 123,
        nombrecurso: tur[ii]['nombrecurso'],
        id_turno: tur[ii]['id_turno'],
        cant: cat.length,
        faltanporresp: faltan.length,
        rechazados: rechazados.length
      }
      todos.push(nuev)
    }


    res.json(todos)
  } catch (error) {
    console.log(error)
    res.json([])
  }


})



router.get('/listadeturnos/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id

  turnos = await pool.query('select * from turnos  where id_curso = ?', [id])

  todos = []
  for (ii in turnos) {

    // cursado = await pool.query('select *, turnos.id id, usuarios.nombre coordinador from cursado join turnos on cursado.id_turno=turnos.id join personas on cursado.id_persona =personas.id  join usuarios on turnos.id_coordinador = usuarios.id where cursado.id_curso = ? and cursado.id_turno =?', [id, turnos[ii]['id']])
    cursado = await pool.query('select *  from cursado  join(select id as idturno, descripcion, id_coordinador, id_encargado from turnos ) as selec1 on cursado.id_turno = selec1.idturno  left join (select id as idpersona, nombre as nombrepersona,apellido as apellidopersona, dni from personas) as selec2 on cursado.id_persona = selec2.idpersona left join (select id as idusuario, nombre as nombrecoordinador from usuarios ) as selec3 on  selec1.id_coordinador = selec3.idusuario left join (select id as  idusuarioo, nombre as nombreencargado from usuarios ) as selec4 on selec1.id_encargado = selec4.idusuarioo where cursado.id_turno =? ', [turnos[ii]['id']])

    if (cursado.length > 0) {
      todos.push(cursado)
    } else {

      cursado = {
        id_turno: turnos[ii]['id'],
        turno: turnos[ii]['numero'],
        descripcion: turnos[ii]['descripcion'],
        encargado: turnos[ii]['encargado'],
        motivo: turnos[ii]['motivo'],

      }
      todos.push([cursado])
    }



  }

  res.json(todos)


})


router.get('/traerturnos/:id',  async (req, res) => {
  const id = req.params.id

  const turnos = await pool.query('select * from turnos where id_curso=?',[id])

  res.json(turnos)
  
})
router.get('/detalledelcurso/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id
  try {
    /////CLASES DEL CURSO

    //////pendientes inscriptos prioridad 1 2 3
    const pendientes1 = await pool.query('select inscripciones.id id_inscripcion,personas.hijos, dni_persona,inscripciones.horario, inscripciones.estado,inscripciones.uno,inscripciones.dos,inscripciones.tres, personas.nombre,personas.dni, personas.apellido, personas.trabajo, personas.tipo_trabajo, personas.participante_anterior from inscripciones join personas on inscripciones.dni_persona = personas.dni where uno=?  ', [id])

    const pendientes2 = await pool.query('select inscripciones.id id_inscripcion,personas.hijos,dni_persona, inscripciones.horario,inscripciones.estado,inscripciones.uno,inscripciones.dos,inscripciones.tres, personas.nombre,personas.dni, personas.trabajo, personas.apellido,personas.tipo_trabajo, personas.participante_anterior from inscripciones join personas on inscripciones.dni_persona = personas.dni where dos=? ', [id])

    cursado = await pool.query('select cursado.id, cursado.categoria, cursado.id_persona,cursado.inscripcion, cursado.id_curso,turnos.descripcion horario, personas.nombre, personas.apellido from cursado join personas on cursado.id_persona=personas.id join turnos on cursado.id_turno = turnos.id where turnos.id_curso = ? ', [id])


    array1 = pendientes1.concat(pendientes2);



    const criterios = await pool.query('select * from criterios ')
    /////isncripciones si participo/no participo
    //si
    //const cursadosi = await pool.query('select * from inscripciones join personas on inscripciones.dni_persona =personas.dni  where inscripciones.uno=? and personas.participante_anterior="Sí"', [id])
    //no
    //const cursadono = await pool.query('select * from inscripciones join personas on inscripciones.dni_persona =personas.dni  where inscripciones.uno=? and personas.participante_anterior="No"', [id])
    ///////datos del curso
    const cursos = await pool.query('select * from cursos where id = ? ', [id])
    turnos = await pool.query('select * from turnos where id_curso = ? ', [id])
    curso = [{
      nombre: cursos[0]['nombre'],
      cupo: 44 * turnos.length,
      turnos: turnos.length

    }]


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
    res.json([[''], [''], 0, [''], [''], ['']]);
  }


})



router.post("/rechazarinscrip", async (req, res) => {
  let { dni, id_inscripcion, observaciones} = req.body

  try {
    
  await pool.query('update inscripciones set estado="Rechazada"   where id=?', [ id_inscripcion])
  const es = await pool.query('select * from personas where dni=?', [dni])
  if (observaciones != undefined){
    await pool.query('insert into observaciones set detalle=?, id_ref=? ', [observaciones, es])

}
res.json('Inscripcion rechazada ')
} catch (error) {
    console.log(error)
    res.json('No realizado, contacta al administrador')
}
})

router.post("/asignarcurso", async (req, res) => {
  let { dni, id_inscripcion, id_turno, observaciones} = req.body

  try {
     
      const tu = await pool.query('select * from turnos where id=?', [id_turno])
      cup =parseInt(tu[0]['disponibles'])-1
      const per = await pool.query('select * from personas where dni=?', [dni])
        
          await pool.query('insert into cursado set id_inscripcion=?, id_turno=?, id_persona=?,motivo=?', [id_inscripcion,id_turno,per[0]['id'],(new Date(Date.now())).toLocaleDateString()])
         

          await pool.query('update inscripciones set estado="Asignada a curso"   where id=?', [ id_inscripcion])

          await pool.query('update turnos set disponibles=?  where id=?', [cup, id_turno])

           const es = await pool.query('select * from personas where dni=?', [dni])


      if (observaciones != undefined){
          await pool.query('insert into observaciones set detalle=?, id_ref=? ', [observaciones, es])

      }
      const mensaje = 'Listo! Alumna asignada a curso '+tu[0]['descripcion']+', en ese turno quedan '+cup+' Cupos disponibles'
      console.log(mensaje)
      res.json(mensaje)
  } catch (error) {
      console.log(error)
      res.json('error')
  }


})


router.post("/modificarcurso", async (req, res) => {
  const { id, nombre } = req.body
  try {


    

    await pool.query('update cursos set nombre=? where id=?  ', [nombre, id])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }


})

///
router.post("/crear", isLoggedInn2, async (req, res) => {
  const { nombre } = req.body


  try {

    fecha = (new Date(Date.now())).toLocaleDateString()


    await pool.query('insert cursos  set nombre=?, fecha=?', [nombre, fecha])


    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }

})


router.post("/nuevoturno", isLoggedInn4, async (req, res) => {
  const { id_curso, numero, descripcion } = req.body

  try {



    await pool.query('insert turnos  set id_curso=?,numero=?,descripcion=?', [id_curso, numero, descripcion])
    res.json('Cargada nueva clase')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }

})




router.post("/nuevaclase", isLoggedInn4, async (req, res) => {
  const { id_curso, fecha, observaciones } = req.body
  console.log(id_curso)
  console.log(fecha)
  try {


    const nuev = {
      id_curso, fecha, observacion: observaciones
    }
    await pool.query('insert clases  set id_curso=?,fecha=?,observacion=?', [id_curso, fecha, observaciones])
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

router.post("/traerlosturnos", async (req, res) => {
  const { id } = req.body
  try {
    console.log(id)
    turnos = await pool.query('select * from turnos where id_curso =?', [id])
    res.json(turnos)
  } catch (error) {
    console.log(error)
    res.json([{ id: id }])
  }



})


router.post("/presente", async (req, res) => {
  const { id_alumno, asistencia, id_clase, observaciones } = req.body ///

  ///asistencia (presente ausente)
  try {

    console.log(id_alumno)
    console.log(id_clase)
    const yatomada = await pool.query('select * from asistencia where id_persona = ? and id_clase =? ', [id_alumno, id_clase])
    if (yatomada.length > 0) {



      if (asistencia === 'Sin determinar') {
        await pool.query('delete  from  asistencia where id = ?', [yatomada[0]['id']])
      } else {
        await pool.query('update asistencia set asistencia="Presente", justificacion="Ninguna" where id=?  ', [ yatomada[0]['id']])
      }
    } else {

      await pool.query('insert into asistencia set id_persona=?,asistencia="Presente",id_clase=?,justificacion="Ninguna"', [id_alumno,  id_clase])
    }
    res.json('Realizado')

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }

})
router.post("/ausente", async (req, res) => {
  const { id_alumno, asistencia, id_clase, observaciones } = req.body ///

  ///asistencia (presente ausente)
  try {

    const yatomada = await pool.query('select * from asistencia where id_persona = ? and id_clase =? ', [id_alumno, id_clase])
    if (yatomada.length > 0) {



      if (asistencia === 'Sin determinar') {
        await pool.query('delete  from  asistencia where id = ?', [yatomada[0]['id']])
      } else {
        await pool.query('update asistencia set asistencia="Ausente", justificacion="Ninguna" where id=?  ', [ yatomada[0]['id']])
      }
    } else {

      await pool.query('insert into asistencia set id_persona=?,asistencia="No",id_clase=?,justificacion="Ninguna"', [id_alumno,  id_clase])
    }
    res.json('Realizado')

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }

})



module.exports = router