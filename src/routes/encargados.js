const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')







router.get('/clases/:id', async (req, res) => {
  const id = req.params.id

  turnos = await pool.query('select * from turnos join cursos on turnos.id_curso=cursos.id where id_encargado =? ', [id])



  ////////id usuario encargado

  res.json(turnos);
  //res.render('index')
})

router.get('/curso/:id', async (req, res) => {
  const id = req.params.id

  curso = await pool.query('select * from cursado where id_curso =? ', [id])



  ////////id usuario encargado

  res.json(curso);
  //res.render('index')
})





module.exports = router