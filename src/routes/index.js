const express = require('express')
const router = express.Router()




/// borrar despues


const pool = require('../database')

router.get('/', async (req, res) => {
    console.log('hola')
  const auxs = await pool.query('Select * from usuarios')

  res.json(auxs);
//res.render('index')
})



  




module.exports = router