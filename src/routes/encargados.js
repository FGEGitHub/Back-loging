const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')







router.get('/clases/:id', async (req, res) => {
  const id = req.params.id

  turnos = await pool.query('select *, id as turnoid  from turnos join (select  id as idcurso, nombre from cursos  )as cursoss on turnos.id_curso=cursoss.idcurso where turnos.id_encargado =? ', [id])



  todos = []
  for (ii in turnos) {
    cat = await pool.query('select * from cursado where id_turno= ? and inscripcion <> "Confirmado" and inscripcion <> "Rechazado"', [turnos[ii]['id']])
    tot = await pool.query('select * from cursado where id_turno= ? ', [turnos[ii]['id']])
    nuev = {
      id: turnos[ii]['id'],
      id_curso: turnos[ii]['id_curso'],
      numero: turnos[ii]['numero'],
      descripcion: turnos[ii]['descripcion'],
      id_encargado: turnos[ii]['id_encargado'],
      id_coordinador: null,
      idcurso: turnos[ii]['idcurso'],
      nombre: turnos[ii]['nombre'],
      turnoid: turnos[ii]['turnoid'],
      cantsinresp: cat.length,
      total: tot.length


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

  curso = await pool.query('select cursado.id idcursado, personas.nombre, personas.apellido, personas.id, cursado.inscripcion, personas.tel, personas.tel2  from cursado join personas on cursado.id_persona = personas.id where id_turno=? ', [id])



  ////////id usuario encargado

  res.json(curso);
  //res.render('index')
})



router.get('/alumnasdelcurso/:id', async (req, res) => {
  const id = req.params.id
  /////id: turno
  curso = await pool.query('select cursado.id idcursado, personas.nombre, personas.apellido, personas.id as idpers, cursado.inscripcion from cursado join personas on cursado.id_persona = personas.id where id_turno=? and inscripcion="Confirmado"', [id])

  clases = await pool.query('select * from clases where id_turno =?', [id])
mandar=[]
totalpresentes=0
totalausentes=0
totalsintomar=0
  for (ii in curso) {

    presente = 0
    ausente = 0
    sintomar = 0

    for (iiii in clases) {
      asis = await pool.query('select * from asistencia where id_persona=? and id_clase =? ',[curso[ii]['idpers'], clases[iiii]['id']])
      if (asis.length === 0) {
        sintomar += 1
        totalsintomar+= 1
      } else {
        if (asis[0]['asistencia'] === 'Presente') {
          presente += 1
          totalpresentes+=1
        } else {
          ausente += 1
          totalausentes+=1
        }
      }

    }

    nuevo = {
      presente,
      ausente,
      sintomar,
      idcursado:curso[ii]['idcursado'],
      nombre:curso[ii]['nombre'],
      apellido:curso[ii]['apellido'],
      id:curso[ii]['id'],
      inscripcion:curso[ii]['inscripcion'],
 
    }

    mandar.push(nuevo)
  }


datos = {
  clases:clases.length,
  totalpresentes,
  totalausentes,
  totalsintomar,
  total:totalpresentes+totalausentes+totalsintomar,
  totalreal:totalpresentes+totalausentes

}

  ////////id usuario encargado

  res.json([mandar,datos]);
  //res.render('index')
})

router.post("/confirmaciondellamado", async (req, res) => {
  let { confirmacion, id_turno, id_persona, id_cursado, observaciones } = req.body
  try {

    if (observaciones === undefined) {
      observaciones = 'sin definir'
    }

    cursado = await pool.query('select * from cursado where id = ? ', [id_cursado])



    await pool.query('update cursado set inscripcion = ?,motivo =? where id=?', [confirmacion, observaciones, id_cursado])

    await pool.query('update inscripciones set estado=? ,motivo =?  where id=?', [confirmacion, observaciones, cursado[0]['id_inscripcion']])

    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


module.exports = router