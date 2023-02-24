const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2  } = require('../lib/auth') //proteger profile
const pool = require('../database')





router.get('/lista/:id', isLoggedInn2, async (req, res) => {
    const id = req.params.id
    console.log(id)

    tareas = await pool.query('select cursos.nombre nomrbe_curso, cursado.inscripcion, personas.nombre, personas.apellido from cursado join cursos on cursado.id_curso=cursos.id  join personas on cursado.id_persona = personas.id where profesor=? ',[id])

    res.json(tareas)

})



module.exports = router