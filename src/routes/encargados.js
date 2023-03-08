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





router.post("/confirmaciondellamado", async (req, res) => {
  const { confirmacion, id_turno, id_persona, id_cursado,observaciones } = req.body
  try {


    cursado = await pool.query('select * from cursado where id = ? ', [id_cursado])

    act = {
      inscripcion: confirmacion,
      motivo:observaciones

    }

    await pool.query('update cursado set ? where id=?', [act, id_cursado])
    act = {
      estado: confirmacion,
      motivo:observaciones
    }
console.log(act)
    await pool.query('update inscripciones set ? where id=?', [act, cursado[0]['id_inscripcion']])
   
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


module.exports = router