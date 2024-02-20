const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database')






router.get('/listachiques/',  async (req, res) => {

    const chiques = await pool.query('select * from dtc_chicos')
    res.json([chiques])
})



router.post("/nuevochique", async (req, res) => {
    let { nombre, apellido, observaciones, numero_clase, fecha_nacimiento } = req.body
  
  
    try {
  if (observaciones ==undefined){
    observaciones="Sin observaciones"
  }
  if (fecha_nacimiento ==undefined){
    fecha_nacimiento="Sin asignar"
  }
 
  
      await pool.query('insert dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?', [nombre, apellido, fecha_nacimiento, observaciones])
  
      res.json('Agregado')
    } catch (error) {
      console.log(error)
      res.json('No agregado')
    }
  
  })
  

module.exports = router

