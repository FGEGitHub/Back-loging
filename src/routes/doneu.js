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



router.post("/determinarmapa1bosques", async (req, res) => {
    const { mapa1, manzana, lote } = req.body
    console.log(mapa1, manzana, lote)
    try {
        let mensaje
        const lot = await pool.query('select * from lotes where zona="Bosques" manzana=? and lote=?', [manzana, lote])
        if (lot.length > 0) {
            await pool.query('update personas set mapa=? where id=?', [mapa1, lot[0]['id']])
            mensaje = "realizado"

        } else {
            mensaje = "Lote no existe o no cargado"
        }
    } catch (error) {
        console.log(error)
        mensaje = "Error"

    }

    res.json(mensaje)
})


module.exports = router

