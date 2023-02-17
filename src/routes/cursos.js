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

    const etc = await pool.query('select * from clases where id_curso = ? ', [id])
    const pendientes = await pool.query('select * from cursado where id_curso=? and inscripcion ="Pendiente"',[id])
    const cursado = await pool.query('select * from cursado join usuarios on cursado.id_usuario =usuarios.id  where id_curso=?',[id])
    const curso = await pool.query('select * from cursos where id = ? ', [id])
    const inscriptos = await pool.query('select * from cursado where id_curso=? and inscripcion ="Cursando"',[id])
    const clases = await pool.query('select * from clases where id_curso=? ',[id])

    res.json([etc,pendientes,cursado,curso,inscriptos.length,clases]);
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