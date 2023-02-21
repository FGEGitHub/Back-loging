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
 

console.log(etc2[0]['id'])
//console.log(etc)

const etc3 = await pool.query('select cursos.id,cursos.fecha , encargado, nombre, cupo, cursos.id, c.inscripcion, c.id_persona from cursos left join (select * from cursado where id_persona = ? ) c on cursos.id=c.id_curso  ', [etc2[0]['id']])

try {
///const etc4 = await pool.query('select * from cursos join  cursado ')

  res.json(etc3);} catch (error) {
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
   const clase  = await pool.query('select * from clases where id = ?',[id])
   
   const alumnos = await pool.query('select * from cursado left  join asistencia on cursado.id = asistencia.id_cursado   join usuarios on  cursado.id_usuario = usuarios.id    where cursado.id_curso = ?  and cursado.inscripcion= "Cursando" ',[clase[0]['id_curso']])
   
   console.log(alumnos)
res.json([clase,alumnos])
} catch (error) {
  console.log(error)
}


})




router.get('/detalledelcurso/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id
  try {
      /////CLASES DEL CURSO
    const etc = await pool.query('select * from clases where id_curso = ? ', [id])
   //////pendientes inscriptos prioridad 1 2 3
    const pendientes1 = await pool.query('select * from inscripciones where uno=? and estado ="pendiente"',[id])
    const pendientes2 = await pool.query('select * from inscripciones where dos=? and estado ="pendiente"',[id])
    const pendientes3 = await pool.query('select * from inscripciones where tres=? and estado ="pendiente"',[id])
    /////isncripciones si participo/no participo
    //si
    const cursadosi = await pool.query('select * from inscripciones join personas on inscripciones.dni_persona =personas.dni  where inscripciones.uno=? and personas.participante_anterior="Sí"',[id])
    //no
    const cursadono = await pool.query('select * from inscripciones join personas on inscripciones.dni_persona =personas.dni  where inscripciones.uno=? and personas.participante_anterior="No"',[id])
///////datos del curso
    const curso = await pool.query('select * from cursos where id = ? ', [id])
    ////////////ALUMNOS YAINSCRIPTOS
    const inscriptos = await pool.query('select * from cursado where id_curso=? and inscripcion ="Cursando"',[id])
    ///CLASES DEL CURSO
    const clases = await pool.query('select * from clases where id_curso=? ',[id])

    //////estadisticas
 lista=[]
 auxil = {dato:"Cupo",
 cantidad:curso[0]['cupo']
}
 lista.push(auxil)
console.log(lista)
auxil = {dato:"Participo/tiene hijos/trabaja formal",
cantidad:(curso[0]['cupo']*0.012285).toFixed(2)
}
lista.push(auxil)
auxil = {dato:"Participo/tiene hijos/trabaja Informal",
cantidad:(curso[0]['cupo']*0.022815.toFixed(2))
}
lista.push(auxil)
auxil = {dato:"Participo/tiene hijos/No trabaja",
cantidad:(curso[0]['cupo']*0.3159).toFixed(2)
}
 lista.push(auxil)

auxil = {dato:"Participo/No tiene hijos/No trabaja",
cantidad:curso[0]['cupo']*0.08415
}
lista.push(auxil)

auxil = {dato:"Participo/tiene hijos/trabaja",
cantidad:(curso[0]['cupo']*0.01485).toFixed(2)
}
 lista.push(auxil)

auxil = {dato:"No Participo/tiene hijos/trabaja Formalmente ",
cantidad:(curso[0]['cupo']*0.0561).toFixed(2)
}
 lista.push(auxil)

auxil = {dato:"No Participo/tiene hijos/trabaja Inormalmente ",
cantidad:(curso[0]['cupo']*0.1309).toFixed(2)
}
 lista.push(auxil)

auxil = {dato:"No Participo/tiene hijos/No trabaja ",
cantidad:(curso[0]['cupo']*0.187)
}
 lista.push(auxil)


auxil = {dato:"No Participo/No tiene hijos/No trabaja ",
cantidad:(curso[0]['cupo']*0.1232).toFixed(2)
}
 lista.push(auxil)

auxil = {dato:"No Participo/No tiene hijos/Trabaja Formalmente ",
cantidad:(curso[0]['cupo']*0.0262).toFixed(2)
}
 lista.push(auxil)

auxil = {dato:"No Participo/No tiene hijos/Trabaja Informalmente ",
cantidad:(curso[0]['cupo']*0.0262).toFixed(2)
}
 lista.push(auxil)

    res.json([etc,[pendientes1.length,pendientes2.length,pendientes3.length],[cursadosi,cursadono],curso,inscriptos.length,clases,lista]);
  } catch (error) {
    console.log(error)
    res.json(['']);
  }

  //res.render('index')
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
  id_curso, fecha ,observacion:observaciones
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
      id_persona:etc,
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
  const { id_usuario, id} = req.body ///
  console.log(id_usuario)
})

module.exports = router