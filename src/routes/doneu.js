const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database2')



router.get("/traerlotes", async (req, res) => {

    try {
        const lot = await pool.query('select * from lotes left join (select id as idventa, id_lote,id_cliente from ventas) as sel on lotes.id=sel.id_lote  left join (select id as idp, nombre from clientes) as sel2 on sel.id_cliente=sel2.idp')
        console.log(lot)
        res.json(lot)
    } catch (error) {
        console.log("error",error)
        res.json(["lot"])
    }
   
  

})


router.get("/traerloteslogin", async (req, res) => {

    try {
        const lot = await pool.query('select * from lotes left join (select id as idventa, id_lote,id_cliente from ventas) as sel on lotes.id=sel.id_lote  left join (select id as idp, nombre from clientes) as sel2 on sel.id_cliente=sel2.idp')
        const sum = await pool.query('select sum(clicks) from lotes')

     
        res.json([lot,sum[0]['sum(clicks)']])
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

router.post("/modificarlotee", async (req, res) => {
    const { id, precio} = req.body
    console.log(id, precio)
    try {
        await pool.query('update lotes set precio=? where id=?', [ precio,id])

        res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')
    }
})


router.post("/actualizarventa", async (req, res) => {
    const { id, escritura,posecion, consctruccion} = req.body
    try {
        ///////////////////id es del lote
        console.log(  id, escritura,posecion, consctruccion)
        await pool.query('update ventas set escritura=?,posecion=?, construccion=? where id=?', [  escritura,posecion, consctruccion,id])

        res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')
    }
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
router.post("/modificarcliente", async (req, res) => {
    const { nombre, dni, sexo, estado_civil, provincia, fecha_nac,telefono, correo,id} = req.body

console.log( id)
try {
    await pool.query('update clientes set nombre=?, dni=?, sexo=?, estado_civil=?, provincia=?, fecha_nac=?,telefono=?, correo=? where id=?', [nombre, dni, sexo, estado_civil, provincia, fecha_nac,telefono, correo,id])

res.json('realizado')
} catch (error) {
    console.log(error)
    res.json('No realizado')
}

})
router.post("/nuevocliente", async (req, res) => {
    let { nombre, dni, sexo, estado_civil, provincia, fecha_nac,telefono, correo} = req.body
    try {
        if(dni==undefined){
            dni="Sin determinar"  
        }
        if(sexo==undefined){
            sexo="Sin determinar"  
        }
        if(estado_civil==undefined){
            estado_civil="Sin determinar"  
        }
        if(provincia==undefined){
            provincia="Sin determinar"  
        }
        if(fecha_nac==undefined){
            fecha_nac="Sin determinar"  
        }
        if(telefono==undefined){
            telefono="Sin determinar"  
        }
        if(correo==undefined){
            correo="Sin determinar"  
        }
       // console.log( nombre, dni, sexo, estado_civil, provincia, fecha_nac,telefono, correo)
    await pool.query('insert into clientes set  nombre=?, dni=?, sexo=?, estado_civil=?, provincia=?, fecha_nac=?,telefono=?, correo=?', [ nombre, dni, sexo, estado_civil, provincia, fecha_nac,telefono, correo])

        res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')
    }
})

router.post("/clickgenerallote", async (req, res) => {
    const { id, id_usuario} = req.body
    try {
        console.log(id)
        console.log(id_usuario)
        const lotes= await pool.query('select * from lotes where mapa1 =?',[id])
        console.log(lotes)
        if(lotes.length>0){
            await pool.query('update lotes set clicks = clicks + 1 where mapa1=?', [id])
        }
       
console.log(lotes)
        res.json(lotes)
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

