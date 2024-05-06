const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')
const { isLoggedInn } = require('../lib/auth')





router.get('/clases/:id', async (req, res) => {
    const id = req.params.id
  
    turnos = await pool.query('select *, id as turnoid  from turnos join (select  id as idcurso, nombre from cursos  )as cursoss on turnos.id_curso=cursoss.idcurso where etapa=3 and turnos.id_coordinador =? ', [id])
  
  
  
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

  
  
  router.get('/listadeausentes/:id', async (req, res) => {
    const id = req.params.id
  
    curso = await pool.query('select *  from asistencia join (select id as idc, id_turno, fecha as fechaclase  from clases) as sel1 on  asistencia.id_clase=sel1.idc join (select id as idt, id_coordinador, etapa from turnos) as sel2 on sel1.id_turno=sel2.idt join (select id as idp, nombre, apellido, dni, tel, tel2 from personas) as sel3 on asistencia.id_persona=sel3.idp where (asistencia in("Ausente","No")) and id_coordinador=? and etapa=2', [id])
  
  
  
    ////////id usuario encargado
  
    res.json([curso]);
    //res.render('index')
  })

  


  router.post("/justificar", isLoggedInn, async (req, res) => {
    let { id, descripcion} = req.body
    try {

      await pool.query('update asistencia set justificacion = ? where id=?', [descripcion,id])


      res.json('Realizado')
    } catch (error) {
      console.log(error)
      res.json('Error algo sucedio')
    }
  
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




router.get('/alertas/:id', async (req, res) => {
  let id = req.params.id
  
 cursado = await pool.query('select * from cursado join (select id as idp, nombre, apellido, dni from personas) as sel on cursado.id_persona=sel.idp join (select id as idt, id_coordinador, descripcion, etapa as etapa2 from turnos )as sel2 on cursado.id_turno=sel2.idt    where id_coordinador=? and etapa2=2', [id])
  //cursado = await pool.query('select dni,pres from cursado join (select id as idp, nombre, apellido, dni from personas) as sel on cursado.id_persona=sel.idp join (select id as idt, id_coordinador, descripcion from turnos )as sel2 on cursado.id_turno=sel2.idt left join (select id as idclase, id_turno as idtur,COUNT(*) as pres from clases left join (select id as idasis, id_clase, asistencia from asistencia) as sel5 on clases.idclase=sel5.id_clase where  asistencia ="Presente") as sel4 on sel2.idt= sel4.idtur where id_coordinador=? group by dni', [id])
 //cursado = await pool.query('select * from cursado join (select id as idp, nombre, apellido, dni from personas) as sel on cursado.id_persona=sel.idp join (select id as idt, id_coordinador, descripcion from turnos )as sel2 on cursado.id_turno=sel2.idt    where id_coordinador=? ', [id])


  
  let enviar =[]
  let totalconfirmados=0
  let totalrechazados=0

 // asistencia= await pool.query('select * from asistencia join (select id as idc, id_turno from clases) as sel on asistencia.id_clase=sel.idc  where id_turno=?',[cursado[ii]['id_turno']])
 
   for (ii in cursado) {
    clases = await pool.query('select * from clases where id_turno=? group by id',cursado[ii]['id_turno'])
    let pres = await pool.query('select * from asistencia join (select id as idc, id_turno from clases) as sel on asistencia.id_clase=sel.idc where asistencia="Presente" and id_persona=? and id_turno=?',[cursado[ii]['idp'],cursado[ii]['id_turno']])
    let aus = await pool.query('select * from asistencia join (select id as idc, id_turno from clases) as sel on asistencia.id_clase=sel.idc where (asistencia="Ausente" or asistencia="No") and id_persona=? and id_turno=?',[cursado[ii]['idp'],cursado[ii]['id_turno']])


if (pres.length*100/clases.length < 75){
  nuevo={
    dni:cursado[ii]['dni'],
    nombre:cursado[ii]['nombre'],
    apellido:cursado[ii]['apellido'],
    descripcion:cursado[ii]['descripcion'],
    presentes:pres.length,
    ausentes:aus.length,
    clases:clases.length,
    porcentaje:pres.length*100/clases.length
    
    }
}

enviar.push(nuevo)
  } 
  

  res.json([enviar,{asasa:0}])
  
  
  })



  module.exports = router