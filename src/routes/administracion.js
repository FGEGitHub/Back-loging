const express = require('express')
const router = express.Router()

const pool = require('../database')


router.get('/todos/', async (req, res) => {
   
  
    const etc = await pool.query ('select * from usuarios' )

  res.json(etc);
//res.render('index')
})

router.post("/presente",  async (req, res) => {
    const { id_usuario, id } = req.body ///
    console.log(id_usuario)
  })


module.exports = router