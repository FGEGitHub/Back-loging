const express = require('express')
const router = express.Router()



/// borrar despues


const pool = require('../database')

router.get('/', async (req, res) => {
    console.log('hola')
    
  

  res.json('hola');
//res.render('index')
})



  




module.exports = router