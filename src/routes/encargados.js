const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')






///////////////aca agregar etapa
router.get('/clases/:id', async (req, res) => {
  const id = req.params.id
/* 
  turnos = await pool.query('select *  from turnos join (select  id as idcurso, nombre from cursos  )as cursoss on turnos.id_curso=cursoss.idcurso where etapa=3 and turnos.id_encargado =?', [id])
  console.log(turnos)


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
  } */
  ////////id usuario encargado
  turnos = await pool.query('select *  from turnos  where etapa=3 and turnos.id_encargado =?', [id])

  console.log(turnos)
  res.json(turnos);
  //res.render('index')
})



router.get('/alumnasdelcurso/:id', async (req, res) => {
  const id = req.params.id
  try {
    curso = await pool.query('select * from cursado join (select id as idp, nombre, apellido, dni, tel, tel2 from personas) as sel on cursado.id_persona=sel.idp join (select id as idi, estado from inscripciones) as sel2 on cursado.id_inscripcion=sel2.idi where id_turno=? order by apellido', [id])
    // curso = await pool.query('select dni, COUNT(CASE  WHEN sel3.asistencia = "presente" THEN 1    WHEN sel3.asistencia = "No" THEN 2    WHEN sel3.asistencia is null THEN 3  ELSE NULL END) as cantidad_por_estado from cursado join (select id as idp, nombre, apellido, dni, tel, tel2 from personas) as sel on cursado.id_persona=sel.idp  left join (select id as idclase, id_turno as idtu  from clases) as sel2   on cursado.id_turno=sel2.idtu left join (select id as ida, asistencia, id_clase from asistencia) as sel3 on sel2.idclase=sel3.id_clase   where id_turno=?  group by dni', [id])
    clases = await pool.query('select * from clases where id_turno=?', [id])

    let enviar = []
    for (i in curso) {
      let pres = await pool.query('select * from asistencia join (select id as idc, id_turno from clases) as sel on asistencia.id_clase=sel.idc where asistencia="Presente" and id_persona=? and id_turno=?', [curso[i]['idp'], id])
      let aus = await pool.query('select * from asistencia join (select id as idc, id_turno from clases) as sel on asistencia.id_clase=sel.idc where (asistencia="Ausente" or asistencia="No") and id_persona=? and id_turno=?', [curso[i]['idp'], id])

      nuevo = {
        id_cursado: curso[i]['id'],
        observaciones: curso[i]['observaciones'],
        nombre: curso[i]['nombre'],
        apellido: curso[i]['apellido'],
        dni: curso[i]['dni'],
        tel: curso[i]['tel'],
        tel2: curso[i]['tel2'],
        estado:curso[i]['estado'],
        presentes: pres.length,
        ausentes: aus.length,
        sintomar: (clases.length) - (aus.length) - (pres.length)
      }
      enviar.push(nuevo)
    }



    res.json([enviar])
  } catch (error) {
    console.log(error)
    res.json(['error'])
  }


}
)

router.get('/curso/:id', async (req, res) => {
  const id = req.params.id

  curso = await pool.query('select cursado.id idcursado, personas.nombre, personas.apellido, personas.id, cursado.inscripcion, personas.tel, personas.tel2  from cursado join personas on cursado.id_persona = personas.id where id_turno=? ', [id])



  ////////id usuario encargado

  res.json(curso);
  //res.render('index')
})


router.get('/listadeausentes/:id', async (req, res) => {
  const id = req.params.id

  curso = await pool.query('select *  from asistencia join (select id as idc, id_turno, fecha as fechaclase  from clases) as sel1 on  asistencia.id_clase=sel1.idc join (select id as idt, id_encargado, etapa from turnos) as sel2 on sel1.id_turno=sel2.idt join (select id as idp, nombre, apellido, dni, tel, tel2 from personas) as sel3 on asistencia.id_persona=sel3.idp where (asistencia in("Ausente","No")) and id_encargado=? and etapa=2', [id])



  ////////id usuario encargado

  res.json([curso]);
  //res.render('index')
})




/* 

router.get('/alumnasdelcurso/:id', async (req, res) => {
  const id = req.params.id
  /////id: turno
  curso = await pool.query('select * from cursado join (select id as idp, nombre, apellido, dni, tel, tel2 from personas) as sel on cursado.id_persona=sel.idp where id_turno=?', [id])
///curso es cursado  (lista de alumnas)
console.log('curso')

  clases = await pool.query('select * from clases where id_turno =?', [id])
  let confirmadosc = await pool.query('select * from cursado where inscripcion = "Confirmado" and id_turno =?',[id])
  let rechazadosc = await pool.query('select * from cursado where inscripcion = "Rechazado" and id_turno =?',[id])
  let datosconfirmados={
    confirmados:confirmadosc.length,
    rechazados:rechazadosc.length

  }
let estadisticasclases = []


for (xxx  in clases) {


  let numero_de_clase= clases[xxx]['numero_clase']
  let numero_presentes_calse= await pool.query('select * from asistencia  where asistencia="Presente" and id_clase=?',clases[xxx]['id'])
  let numero_ausentes_calse= await pool.query('select * from asistencia  where asistencia="Ausente" and  id_clase=?',clases[xxx]['id'])


  estadisticasclases.push({
    presenteclase:numero_presentes_calse.length,
    ausenteclase:numero_ausentes_calse.length,
    numero:numero_de_clase

  })
        }
       

  let mandar = []
  let totalpresentes = 0
  let totalausentes = 0
  let totalausentesjustificadas=0
  totalsintomar = 0
  for (ii in curso) {
    primerclase = "No"
    presente = 0
    ausente = 0
    sintomar = 0



    for (iiii in clases) {
    
      asis = await pool.query('select * from asistencia where id_persona=? and id_clase =? ', [curso[ii]['idpers'], clases[iiii]['id']])
      if (asis.length === 0) {
        sintomar += 1
        totalsintomar += 1
      } else {
        if (asis[0]['asistencia'] === 'Presente') {
          presente += 1
          totalpresentes += 1
       
          if (clases[iiii]['numero_clase'] === '1') {//primer clase
            primerclase = "Si"
          }
        } else {
          ausente += 1
          totalausentes += 1
          if (asis[0]['asistencia'] === 'Ausente justificado') {
            totalausentesjustificadas += 1
          }
          
        }
      }


    }

    nuevo = {
      presente,
      ausente,
      sintomar,
      justificadas: totalausentesjustificadas,
      observaciones:curso[ii]['observaciones'],
      idcursado: curso[ii]['idcursado'],
      dni: curso[ii]['dni'],
      tel: curso[ii]['tel'],
      tel2: curso[ii]['tel2'],
      nombre: curso[ii]['nombre'],
      apellido: curso[ii]['apellido'],
      id: curso[ii]['id'],
      inscripcion: curso[ii]['inscripcion'],
      primerclase

    }

    mandar.push(nuevo)
    
  }


  datos = {
    clases: clases.length,
    totalpresentes,
    totalausentes,
    totalsintomar,
    total: totalpresentes + totalausentes + totalsintomar,
    totalreal: totalpresentes + totalausentes

  }

  ////////id usuario encargado


 


  ////

  res.json([mandar, datos,estadisticasclases,datosconfirmados]);
  //res.render('index')
})


 */




router.post("/cambiarestadocurado", async (req, res) => {
  let { id_cursado, observaciones } = req.body

  console.log(id_cursado)
  console.log(observaciones)
  try {
    await pool.query('update cursado set observaciones = ? where id=?', [observaciones, id_cursado])
    const nombre_curso = await pool.query('select * from cursado join (select id as idcurso, nombre as nombrecurso from cursos) as selec1 on cursado.id_curso=selec1.idcurso where id =? ', [id_cursado])
    console.log(nombre_curso)
    if (observaciones == 'Finalizado') {
      await pool.query('insert cursos_realizados  set nombre_curso=?, id_cursado=?, id_persona=?, fecha_carga=?', [nombre_curso[0]['nombrecurso'], id_cursado, nombre_curso[0]['id_persona'], (new Date(Date.now())).toLocaleDateString()])

    }

    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }


})




router.post("/confirmaciondellamado", async (req, res) => {
  let { confirmacion, id_turno, id_persona, id_cursado, observaciones } = req.body
  try {
    console.log(id_cursado)

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