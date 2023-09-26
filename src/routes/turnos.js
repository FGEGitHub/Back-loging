const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')




router.post("/desasignar",  async (req, res) => {
  const { id_inscripcion,observaciones,dni} = req.body
try {
  const es = await pool.query('select * from personas where dni=?', [dni])
  if (observaciones != undefined){
    await pool.query('insert into observaciones set detalle=?, id_ref=? fecha=? ', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])

}
const cur = await pool.query('select * from cursado where id_inscripcion=?', [id_inscripcion])

const tur = await pool.query('select * from turnos where id=?', [cur[0]['id_turno']])
await pool.query('update turnos set disponibles=? where id =?', [tur[0]['disponibles']+1, tur[0]['id']])
  await pool.query('delete  from  cursado where id_inscripcion = ?',[id_inscripcion])
  await pool.query('update inscripciones set estado="Preasignada" where id =?', [id_inscripcion])

  res.json('Realizado')
} catch (error) {
  console.log(error)
  res.json('No realizado')
}

})

router.post("/modificarturno",  async (req, res) => {
  const { id,descripcion,id_encargado} = req.body
try {
  
if (id_encargado!=undefined){

  if (descripcion!=undefined){
    await pool.query('update turnos set descripcion=?,id_encargado=? where id =?', [descripcion,id_encargado,id])
  console.log(1)
  }else{
    console.log(2)
    await pool.query('update turnos set id_encargado=? where id =?', [id_encargado,id])
 
  }



}else{
 
  if (descripcion!=undefined){
    await pool.query('update turnos set descripcion=? where id =?', [descripcion,id])
  
  }
 



}

  
  res.json('Realizado')
} catch (error) {
  console.log(error)
  res.json('No realizado')
}

})

router.post("/nuevaclase",  async (req, res) => {
  const { id_turno, dni, observaciones,numero_clase,  fecha} = req.body


try {
  
act = {
observacion:observaciones,
fecha,
numero_clase,
id_turno
}


await pool.query('insert clases  set observacion=?,fecha=?,numero_clase=?,id_turno=?', [observaciones,fecha,numero_clase,id_turno])

res.json('Clase agregada')
} catch (error) {
  console.log(error)
  res.json('Clase agregada')
}

})



router.post("/modificarclase",  async (req, res) => {
  const { id,observacion,numero_clase,fecha} = req.body
try {


  await pool.query('update clases set  numero_clase = ?,observacion= ?,fecha=? where id =?', [numero_clase,observacion, fecha,id])
  res.json('Realizado')
} catch (error) {
  console.log(error)
  res.json('No realizado')
}

})


router.post("/borrarclase",  async (req, res) => {
  const { id} = req.body
try {
console.log(id)  
await pool.query('delete  from  clases where id = ?',[id])
 // await pool.query('update clases set  numero_clase = ?,observacion= ?,fecha=? where id =?', [numero_clase,observacion, fecha,id])
  res.json('Realizado')
} catch (error) {
  console.log(error)
  res.json('No realizado')
}

})



router.get('/traerclase/:id', async (req, res) => {
  const id = req.params.id

try {
  
const turn = await pool.query('select * from clases  where id =? ',[id])
console.log(turn)
res.json([turn])
} catch (error) {
  console.log(error)
  res.json(['error'])
}

})
router.get('/detalledelcurso/:id', async (req, res) => {
  const id = req.params.id

try {
  
const turn = await pool.query('select * from turnos left join(select id as idc, nombre as coordinador from usuarios) as selec1 on turnos.id_coordinador=selec1.idc left join (select id as ide, nombre as encargado from usuarios) as selec2 on turnos.id_encargado=selec2.ide left join(select id as idcu, nombre as nombrecurso from cursos) as selec3 on turnos.id_curso=selec3.idcu where id =? ',[id])
console.log(turn)
res.json([turn])
} catch (error) {
  console.log(error)
  res.json(['error'])
}

})




router.get('/clasesdelturno/:id', async (req, res) => {
    const id = req.params.id
  
  
    const clases = await pool.query('select * from clases where id_turno =?', [id])
    etc=[]
    for (ii in clases) {
      const alumnos = await pool.query('select *, id as idcursado from cursado join   (select nombre,apellido, id as idpersona from personas) as  personaa on cursado.id_persona=personaa.idpersona  where cursado.id_turno = ? ', [clases[ii]['id_turno']])
console.log(alumnos.length)
      total = alumnos.length
      presentes=0
      ausentes=0
      notomados = 0
     
    for (iiii in alumnos) {//////recorremos todas las asistencias de la clase
      asis = await pool.query('select * from asistencia where id_persona = ? and id_clase = ?',[alumnos[iiii]['id_persona'],clases[ii]['id']])
     

      if (asis.length === 0) {
        notomados += 1
      
      
        }else{
          if(asis[0]['asistencia'] ==='Presente'){
            presentes +=1
          }else{
            ausentes+=1
          }
    
        
      
        }
      
    }///fin clase en cuestion

nuevo ={
  notomados,
  presentes,
  ausentes,
  id:clases[ii]['id'],
  fecha:clases[ii]['fecha'],
  observacion:clases[ii]['observacion'],
  numero:clases[ii]['numero_clase'],
}

etc.push(nuevo)
  }//fin todas las clases


    res.json(etc);
    //res.render('index')
  })


  router.get('/listadetodoslosturnos/', isLoggedInn2, async (req, res) => {
    try {
      console.log('listadetodos')
      tur = await pool.query('select * from turnos   join  (select id as idcurso, nombre as nombrecurso from cursos) as selec1  on turnos.id_curso= selec1.idcurso ')
  
  
      todos = []
      for (ii in tur) {
        console.log(ii)
        console.log(tur)
        console.log(tur[ii])
        console.log(tur[ii]['id'])
        cat = await pool.query('select * from cursado where id_turno= ?', [tur[ii]['id']])
        faltan = await pool.query('select * from cursado where id_turno= ? and (inscripcion <> "Confirmado" and inscripcion <> "Rechazado") ', [tur[ii]['id']])
        en = await pool.query('select * from usuarios where id= ?', [tur[ii]['id_encargado']])
        c1 = await pool.query('select * from usuarios where id= ?', [tur[ii]['id_coordinador']])
        rechazados = await pool.query('select * from cursado where id_turno= ? and inscripcion = "Rechazado" ', [tur[ii]['id']])
        enc = 'sin determinar'
        if (en.length > 0) {
          enc = en[0]['nombre']
        }
  
        coor = 'sin determinar'
        if (c1.length > 0) {
          coor = c1[0]['nombre']
        }
  
  
        
  
        nuev = {
          id: tur[ii]['id'],
          id_curso: tur[ii]['id_curso'],
          numero: tur[ii]['numero'],
          descripcion: tur[ii]['descripcion'],
          enc,
          coor,
          idcurso: 123,
          nombrecurso: tur[ii]['nombrecurso'],
          id_turno: tur[ii]['id_turno'],
          cant: cat.length,
          faltanporresp: faltan.length,
          rechazados:rechazados.length
        }
        todos.push(nuev)
      }
  
  
      res.json(todos)
    } catch (error) {
      console.log(error)
      res.json([])
    }
  
  
  })
  


module.exports = router