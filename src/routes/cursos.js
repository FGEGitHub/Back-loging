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
try {
  

id_usuarioo = await pool.query('select id from usuarios where usuario = ?',[usuario])


  const etc = await pool.query('select cursos.id,cursos.fecha , encargado, nombre, cupo, cursos.id, cursado.inscripcion from cursos left join cursado on cursos.id=(select cursado.id_curso from cursado where  id_usuario =?) group by cursos.id', [id_usuarioo[0]['id']])

  res.json(etc);} catch (error) {
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
    user = await pool.query('select * from usuarios where usuario =? ', [usuario])
    nove = {
      id_usuario: user[0]['id'],
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




module.exports = router