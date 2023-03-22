const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')




router.post("/modificarturno",  async (req, res) => {
  const { id,descripcion} = req.body
try {
  


  await pool.query('update turnos set descripcion=? where id =?', [descripcion,id])
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


router.get('/clasesdelturno/:id', async (req, res) => {
    const id = req.params.id
  
  
  
  
    const clases = await pool.query('select * from clases where id_turno =?', [id])
    etc=[]
    for (ii in clases) {
      const alumnos = await pool.query('select *, id as idcursado from cursado join   (select nombre,apellido, id as idpersona from personas) as  personaa on cursado.id_persona=personaa.idpersona  where cursado.id_turno = ?  and cursado.inscripcion= "Confirmado" ', [clases[ii]['id_turno']])

      total = alumnos.length
      presentes=0
      ausentes=0
      notomados = 0
     
    for (iiii in alumnos) {//////recorremos todas las asistencias de la clase
      asis = await pool.query('select * from asistencia where id_persona = ? and id_clase = ?',[alumnos[iiii]['id_persona'],clases[ii]['id']])
      console.log(asis)

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
  numero:clases[ii]['numero'],
}

etc.push(nuevo)
  }//fin todas las clases


    res.json(etc);
    //res.render('index')
  })




module.exports = router