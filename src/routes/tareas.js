const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2  } = require('../lib/auth') //proteger profile
const pool = require('../database')


router.get('/rk/', async (req, res) => {
    const id = req.params.id
    console.log(id)

    tareas = await pool.query('select * from rk order by punt desc')

    res.json(tareas)

})

router.post('/guardar', async (req, res) => {
    const {name, punt} = req.body
    console.log(id)

    await pool.query('insert into rk set name=?, punt=?', [name, punt])

    res.json("guardado")

})


router.get('/lista/:id', isLoggedInn2, async (req, res) => {
    const id = req.params.id
    console.log(id)

    tareas = await pool.query('select cursos.nombre nombre_curso, cursado.id id_cursado, cursado.inscripcion, personas.nombre, personas.apellido, personas.tel, personas.tel2 from cursado join cursos on cursado.id_curso=cursos.id  join personas on cursado.id_persona = personas.id where profesor=? ',[id])

    res.json(tareas)

})



module.exports = router