const express = require('express')
const router = express.Router()
const pool = require('../database')


/// borrar despues




router.get('/', async (req, res) => {
    console.log('hola')
try {
   pipo= await pool.query('select * from usuarios')
   res.json(pipo);
} catch (error) {
  res.json('error')
}
   


 
//res.render('index')
})



  




module.exports = router