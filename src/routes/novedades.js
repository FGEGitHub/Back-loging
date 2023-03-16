const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2  } = require('../lib/auth') //proteger profile
const pool = require('../dbconnector')






router.get('/todas/',isLoggedInn, async (req, res) => {
   
  
    const etc = await pool.query ('select * from novedades' )

  res.json(etc);
//res.render('index')
})





module.exports = router