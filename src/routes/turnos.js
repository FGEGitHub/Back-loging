const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')






router.post("/nuevaclase",  async (req, res) => {
  const { id_turno, dni, observaciones,  fecha} = req.body
console.lof(observaciones)
console.lof(fecha)
console.lof(id_turno)
})


router.get('/clasesdelturno/:id', async (req, res) => {
    const id = req.params.id
  
  
  
  
    const etc = await pool.query('select * from clases where id_turno =?', [id])
  
    res.json([etc]);
    //res.render('index')
  })




module.exports = router