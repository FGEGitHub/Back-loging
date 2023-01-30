const express = require('express')
const router = express.Router()



/// borrar despues


const pool = require('../database')

router.get('/', async (req, res) => {
    console.log('hola')
    const etc = await pool.query ('select * from usuarios' )
  

  res.json(etc);
//res.render('index')
})



  




module.exports = router