const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')
const { isLoggedInn } = require('../lib/auth')








router.get('/traerinscripciones', async (req, res) => {
    const todas = await pool.query('select * from inscripciones_carnaval join (select dni, nombre, apellido from personas) as sel on inscripciones_carnaval.dni_persona=sel.dni')


    res.json(todas)
})


router.post("/desinscribir", async (req, res) => {
    let { id} = req.body
    try {
            await pool.query('delete  from  inscripciones_carnaval where id = ?', [id])
            res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')
    }

})



router.get('/traerinscripcionesenc/', async (req, res) => {
    const id = req.params.id
  
  
    const etc = await pool.query('select * from inscripciones_carnaval left join (select dni as dnip, nombre, apellido from personas) as selec on inscripciones_carnaval.dni_persona=selec.dnip   where  (id_call is null or id_call= 0) order by id ')
    console.log(etc)
  
    res.json(etc);
  
  
  
  
  })
  

  router.post("/asignarinscripciones", async (req, res) => {
    let { id, inscrip } = req.body
  
  
    for (ins in inscrip) {
  
       
  
        await pool.query('update inscripciones_carnaval set id_call =? where  id = ?', [id, inscrip[ins]])
    }
    res.json('realizado')
  
  })



////conectado el usuario nivel6llamdos
  router.post("/nocontesta", async (req, res) => {
    let { dni, id_inscripcion, observaciones} = req.body
  
    try {
      
    await pool.query('update inscripciones_carnaval set estado="No contesta"   where id=?', [ id_inscripcion])
    const es = await pool.query('select * from personas where dni=?', [dni])
    if (observaciones != undefined){
      await pool.query('insert into observaciones set detalle=?, id_ref=? , fecha=?', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])
  
  }
  res.json('Guardado como no contesta')
  } catch (error) {
      console.log(error)
      res.json('No realizado, contacta al administrador')
  }
  })
////conectado el usuario nivel6llamdos

  router.post("/rechazarinscrip", async (req, res) => {
    let { dni, id_inscripcion, observaciones} = req.body
  
    try {
      
    await pool.query('update inscripciones_carnaval set estado="Rechazada"   where id=?', [ id_inscripcion])
    const es = await pool.query('select * from personas where dni=?', [dni])
    if (observaciones != undefined){
      await pool.query('insert into observaciones set detalle=?, id_ref=? , fecha=?', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])
  
  }
  res.json('Inscripcion rechazada ')
  } catch (error) {
      console.log(error)
      res.json('No realizado, contacta al administrador')
  }
  })


////conectado el usuario nivel6llamdos

  router.post("/asignarcurso", async (req, res) => {
    let { dni, id_inscripcion,  option1,option2,option3,option4,observaciones} = req.body
  console.log( dni, id_inscripcion,  option1,option2,option3,option4)
    try {
       
        const per = await pool.query('select * from personas where dni=?', [dni])

        if (option1){
             await pool.query('insert into cursado set id_inscripcion=?, id_turno=?, id_persona=?,motivo=?', [id_inscripcion,404,per[0]['id'],(new Date(Date.now())).toLocaleDateString()])
             await pool.query('update inscripciones_carnaval set estado="Asignadx a curso"   where id=?', [ id_inscripcion])
             const es = await pool.query('select * from personas where dni=?', [dni])
  
  
             if (observaciones != undefined){
                 await pool.query('insert into observaciones set detalle=?, id_ref=?, fecha=? ', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])
       
             }
        }
        if (option2){
          await pool.query('insert into cursado set id_inscripcion=?, id_turno=?, id_persona=?,motivo=?', [id_inscripcion,405,per[0]['id'],(new Date(Date.now())).toLocaleDateString()])
          await pool.query('update inscripciones_carnaval set estado="Asignadx a curso"   where id=?', [ id_inscripcion])
          const es = await pool.query('select * from personas where dni=?', [dni])


          if (observaciones != undefined){
              await pool.query('insert into observaciones set detalle=?, id_ref=?, fecha=? ', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])
    
          }
     }
     if (option3){
      await pool.query('insert into cursado set id_inscripcion=?, id_turno=?, id_persona=?,motivo=?', [id_inscripcion,406,per[0]['id'],(new Date(Date.now())).toLocaleDateString()])
      await pool.query('update inscripciones_carnaval set estado="Asignadx a curso"   where id=?', [ id_inscripcion])
      const es = await pool.query('select * from personas where dni=?', [dni])


      if (observaciones != undefined){
          await pool.query('insert into observaciones set detalle=?, id_ref=?, fecha=? ', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])

      }
 }
 if (option4){
  await pool.query('insert into cursado set id_inscripcion=?, id_turno=?, id_persona=?,motivo=?', [id_inscripcion,407,per[0]['id'],(new Date(Date.now())).toLocaleDateString()])
  await pool.query('update inscripciones_carnaval set estado="Asignadx a curso"   where id=?', [ id_inscripcion])
  const es = await pool.query('select * from personas where dni=?', [dni])


  if (observaciones != undefined){
      await pool.query('insert into observaciones set detalle=?, id_ref=?, fecha=? ', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])

  }
}
          
     /*        await pool.query('insert into cursado set id_inscripcion=?, id_turno=?, id_persona=?,motivo=?', [id_inscripcion,id_turno,per[0]['id'],(new Date(Date.now())).toLocaleDateString()])
           
  
            await pool.query('update inscripciones set estado="Asignada a curso"   where id=?', [ id_inscripcion])
  
            await pool.query('update turnos set disponibles=?  where id=?', [cup, id_turno])
  
             const es = await pool.query('select * from personas where dni=?', [dni])
  
  
        if (observaciones != undefined){
            await pool.query('insert into observaciones set detalle=?, id_ref=?, fecha=? ', [observaciones, es[0]['id'],(new Date(Date.now())).toLocaleDateString()])
  
        } */
        const mensaje = 'Listo! asignadx a curso '
        console.log(mensaje)
        res.json(mensaje)
    } catch (error) {
        console.log(error)
        res.json('error')
    }
  
  
  })

  router.get('/preinscriptascall/:id', async (req, res) => {
    const id = req.params.id
    
      try {
      
        inscriptos = await pool.query('select * from inscripciones_carnaval join (select dni, nombre, apellido,categoria, participante_anterior, trabajo, tipo_trabajo,tel,tel2 from personas) as sel on inscripciones_carnaval.dni_persona=sel.dni  where id_call=? ',[id])
     
        res.json([inscriptos])
        
      } catch (error) {
    console.log(error)
        res.json(["error"]) 
       }
      })
    



module.exports = router