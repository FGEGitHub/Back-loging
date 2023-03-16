const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../dbconnector')







router.get('/clases/:id', async (req, res) => {
  const id = req.params.id

  turnos = await pool.query('select *, id as turnoid  from turnos join (select  id as idcurso, nombre from cursos  )as cursoss on turnos.id_curso=cursoss.idcurso where turnos.id_encargado =? ', [id])



  ////////id usuario encargado
console.log(turnos)
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
  let { confirmacion, id_turno, id_persona, id_cursado,observaciones } = req.body
  try {

if(observaciones===undefined ){
observaciones='sin definir'
}

    cursado = await pool.query('select * from cursado where id = ? ', [id_cursado])

    

    await pool.query('update cursado set inscripcion = ?,motivo =? where id=?', [confirmacion,observaciones, id_cursado])
   
    await pool.query('update inscripciones set estado=? ,motivo =?  where id=?', [confirmacion,observaciones, cursado[0]['id_inscripcion']])
   
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


module.exports = router