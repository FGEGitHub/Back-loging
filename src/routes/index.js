const express = require('express')
const router = express.Router()
const pool = require('../database')


/// borrar despues




router.get('/', async (req, res) => {
    console.log('hola')
try {
   pipo= 'select * from personas'
} catch (error) {
  
}
   


  res.json(pipo);
//res.render('index')
})



  




module.exports = router