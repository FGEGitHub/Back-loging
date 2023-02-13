const express = require('express')
const router = express.Router()

const pool = require('../database')



router.get('/lista/', async (req, res) => {
    const usuario = req.params.usuario
     console.log(usuario)
     const etc = await pool.query ('select * from cursos' )

   res.json(etc);
 //res.render('index')
 })













module.exports = router