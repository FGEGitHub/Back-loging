const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database2')



router.get("/traerlotes", async (req, res) => {

    try {
        const lot = await pool.query('select * from lotes left join (select id as idventa, id_lote,id_cliente from ventas) as sel on lotes.id=sel.id_lote  left join (select id as idp, nombre from clientes) as sel2 on sel.id_cliente=sel2.idp')
        console.log(lot.length)
        res.json(lot)
    } catch (error) {
        console.log("error",error)
        res.json(["lot"])
    }
   
  

})

router.get("/traerventa/:id", async (req, res) => {
 
id= req.params.id
    try {
      const venta = await pool.query('select * from ventas where id=?',[id])
   
      res.json([venta])
    } catch (error) {
      console.log(error)
      res.json(['Error','error'])
    }
  })
router.get("/traerclientes", async (req, res) => {
    const lot = await pool.query('select * from clientes')
    console.log(lot.length)
    res.json(lot)

})

router.post("/asignarventa", async (req, res) => {
    const { id, id_lote} = req.body
    try {
        console.log( id, id_lote)
        await pool.query('insert into ventas set id_cliente=?, id_lote=?', [id, id_lote])

        res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')
    }
})

router.post("/determinarmapa1bosques", async (req, res) => {
    const { mapa1, manzana, lote } = req.body
    console.log(mapa1, manzana, lote)
    let mensaje="Error"
    try {
      
        const lot = await pool.query('select * from lotes where sector="Bosques" and manzana=? and lote=?', [manzana, lote])
        if (lot.length > 0) {
            await pool.query('update lotes set mapa1=? where id=?', [mapa1, lot[0]['id']])
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

