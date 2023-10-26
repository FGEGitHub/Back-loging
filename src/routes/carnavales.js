const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')
const { isLoggedInn } = require('../lib/auth')








router.get('/traerinscripciones', async (req, res) => {
    const todas = await pool.query('select * from inscripciones_carnaval join (select dni, nombre, apellido from personas) as sel on inscripciones_carnaval.dni_persona=sel.dni')


    res.json(todas)
})



module.exports = router