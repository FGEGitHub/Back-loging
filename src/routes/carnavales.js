const express = require('express')
const router = express.Router()
const passport = require('passport')
const pool = require('../database')
const { isLoggedInn } = require('../lib/auth')








router.get('/traerinscripciones', async (req, res) => {
    const todas = await pool.query('select * from inscripciones_carnaval join (select dni, nombre, apellido from personas) as sel on inscripciones_carnaval.dni_persona=sel.dni')


    res.json(todas)
})


router.post("/desinscribir", async (req, res) => {
    let { id} = req.body
    try {
            await pool.query('delete  from  inscripciones_carnaval where id = ?', [id])
            res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')
    }

})
module.exports = router