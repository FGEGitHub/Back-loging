const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')







router.get('/clases/:id', async (req, res) => {
  const id = req.params.id

  turnos = await pool.query('select *, turnos.id turnoid from turnos join cursos on turnos.id_curso=cursos.id where id_encargado =? ', [id])



  ////////id usuario encargado

  res.json(turnos);
  //res.render('index')
})

router.get('/curso/:id', async (req, res) => {
  const id = req.params.id

  curso = await pool.query('select cursado.id idcursado, personas.nombre, personas.apellido, personas.id, cursado.inscripcion from cursado join personas on cursado.id_persona = personas.id where id_turno=? ', [id])



  ////////id usuario encargado

  res.json(curso);
  //res.render('index')
})





module.exports = router