const express = require('express')
const router = express.Router()

const pool = require('../database')





router.get('/datosusuario/:usuario', async (req, res) => {
   const usuario = req.params.usuario
    console.log(usuario)
    const etc = await pool.query ('select * from usuarios where usuario =?',[usuario] )
    console.log(etc)

  res.json(etc);
//res.render('index')
})







module.exports = router