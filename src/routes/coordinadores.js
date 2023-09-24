const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')





router.get('/clases/:id', async (req, res) => {
    const id = req.params.id
  
    turnos = await pool.query('select *, id as turnoid  from turnos join (select  id as idcurso, nombre from cursos  )as cursoss on turnos.id_curso=cursoss.idcurso where turnos.id_coordinador =? ', [id])
  
  
  
    todos = []
    for (ii in turnos) {
    
      tot = await pool.query('select * from cursado where id_turno= ? ',[turnos[ii]['id']])
     nuev = {
      id: turnos[ii]['id'],
      id_curso: turnos[ii]['id_curso'],
      numero: turnos[ii]['numero'],
      descripcion:turnos[ii]['descripcion'],
      id_encargado: turnos[ii]['id_encargado'],
      id_coordinador: null,
      idcurso: turnos[ii]['idcurso'],
      nombre:turnos[ii]['nombre'],
      turnoid: turnos[ii]['turnoid'],
      cantsinresp:cat.length,
      total:tot.length
   
  
    }
      todos.push(nuev)
    }
    ////////id usuario encargado
  console.log(turnos)
    res.json(todos);
    //res.render('index')
  })



  router.get('/curso/:id', async (req, res) => {
    const id = req.params.id
  
    curso = await pool.query('select cursado.id idcursado, personas.nombre, personas.apellido, personas.id, cursado.inscripcion, motivo from cursado join personas on cursado.id_persona = personas.id where id_turno=? ', [id])
  
  
  
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




router.get('/contactos/:id', async (req, res) => {
let id = req.params.id

let prueba= await pool.query('select  distinct(id_encargado), id_coordinador from turnos where id_coordinador=?',[id])
console.log(prueba)
  let encargados = await pool.query('select distinct(id_encargado) as id, id_coordinador, selec1.nombre from turnos join (select id as idusuario, nombre from usuarios) as selec1 on turnos.id_encargado=selec1.idusuario where turnos.id_coordinador=?  ',[id])


let enviar =[]
let totalconfirmados=0
let totalrechazados=0

for (ii in encargados) {


let confirmados =  await pool.query('select * from cursado join (select id as idturno, id_encargado from turnos  ) as selec1 on cursado.id_turno=selec1.idturno where selec1.id_encargado =? and inscripcion="Confirmado"',[encargados[ii]['id']])
let asignados =  await pool.query('select * from cursado join (select id as idturno, id_encargado from turnos  ) as selec1 on cursado.id_turno=selec1.idturno where selec1.id_encargado =? and inscripcion="Asignado a curso"',[encargados[ii]['id']])
let rechazados =  await pool.query('select * from cursado join (select id as idturno, id_encargado from turnos  ) as selec1 on cursado.id_turno=selec1.idturno where selec1.id_encargado =? and inscripcion="Rechazado"',[encargados[ii]['id']])
let nuevo ={
  nombre: encargados[ii]['nombre'],
  confirmados:confirmados.length,
  asignados:asignados.length,
  rechazados:rechazados.length
}
totalconfirmados= totalconfirmados + confirmados.length
totalrechazados =totalrechazados + rechazados.length
enviar.push(nuevo)
}

let resumen={
  totalconfirmados,
  totalrechazados
}
res.json([enviar,resumen])





})
  module.exports = router