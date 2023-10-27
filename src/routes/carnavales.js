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
  
  
    const etc = await pool.query('select * from inscripciones_carnaval left join (select dni as dnip, nombre, apellido from personas) as selec on inscripciones_carnaval.dni_persona=selec.dnip   where  (id_call is null or id_call= 0)  ')
    console.log(etc)
  
    res.json(etc);
  
  
  
  
  })
  

  router.post("/asignarinscripciones", async (req, res) => {
    let { id, inscrip } = req.body
  
  
    for (ins in inscrip) {
  
       
  
        await pool.query('update inscripciones_carnaval set id_call =?, estado="Preasignada"  where  id = ?', [id, inscrip[ins]])
    }
    res.json('realizado')
  
  })



  router.get('/preinscriptascall/:id', async (req, res) => {
    const id = req.params.id
    
      try {
      
        inscriptos = await pool.query('select * from inscripciones_carnaval join (select dni, nombre, apellido,categoria, participante_anterior, trabajo, hijos, tipo_trabajo,tel,tel2 from personas) as sel on inscripciones_carnaval.dni_persona=sel.dni  where id_call=? ',[id])
     
        res.json([inscriptos])
        
      } catch (error) {
    console.log(error)
        res.json(["error"]) 
       }
      })
    



module.exports = router