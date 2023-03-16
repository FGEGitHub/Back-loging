const express = require('express')
const router = express.Router()
const pool = require('../dbconnector')


/// borrar despues




router.get('/', async (req, res) => {
    console.log('hola')
    pipo= 'pipo2'


  res.json(pipo);
//res.render('index')
})



  




module.exports = router