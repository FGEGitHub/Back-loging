const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database2')



router.get("/traerlotes", async (req, res) => {
const lot = await pool.query('select * from lotes')
console.log(lot.length)
res.json(lot)

})
 

router.get("/traerclientes", async (req, res) => {
    const lot = await pool.query('select * from clientes')
    console.log(lot.length)
    res.json(lot)
    
    })
     

module.exports = router

