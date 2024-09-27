const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database2')



router.get("/traerlotes", async (req, res) => {

    try {
        const lot = await pool.query('select * from lotes left join (select id as idventa, id_lote,id_cliente from ventas) as sel on lotes.id=sel.id_lote  left join (select id as idp, nombre from clientes) as sel2 on sel.id_cliente=sel2.idp')
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





router.post("/enviarformlotes", async (req, res) => {
  const { id,idLote, precio, preciofinanciado, escritura, construccion, posecion } = req.body;
//console.log(id,idLote, precio, preciofinanciado, escritura, construccion, posecion )
  try {
    // Transacción para asegurarse de que todas las actualizaciones se realicen correctamente


      // Actualiza los valores en la tabla 'lotes' (si se modificaron)
      if (precio !== undefined || preciofinanciado !== undefined) {
        let updateLotesQuery = 'UPDATE lotes SET ';
        const params = [];
        
        if (precio !== undefined) {
          updateLotesQuery += 'precio = ?, ';
          params.push(precio);
        }
        
        if (preciofinanciado !== undefined) {
          updateLotesQuery += 'preciofinanciado = ?, ';
          params.push(preciofinanciado);
        }

        // Remover la coma final
        updateLotesQuery = updateLotesQuery.slice(0, -2);
        updateLotesQuery += ' WHERE id = ?';
        params.push(id);
console.log(updateLotesQuery, params)
        await pool.query(updateLotesQuery, params);
      }

      // Actualiza los valores en la tabla 'ventas' (si se modificaron)
      if (escritura !== undefined || construccion !== undefined || posecion !== undefined) {
        let updateVentasQuery = 'UPDATE ventas SET ';
        const paramsVentas = [];
        
        if (escritura !== undefined) {
          updateVentasQuery += 'escritura = ?, ';
          paramsVentas.push(escritura);
        }
        
        if (construccion !== undefined) {
          updateVentasQuery += 'construccion = ?, ';
          paramsVentas.push(construccion);
        }

        if (posecion !== undefined) {
          updateVentasQuery += 'posecion = ?, ';
          paramsVentas.push(posecion);
        }

        // Remover la coma final
        updateVentasQuery = updateVentasQuery.slice(0, -2);
        updateVentasQuery += ' WHERE id_lote = ?';
        paramsVentas.push(id);
        console.log(2)
console.log(updateVentasQuery, paramsVentas)
        await pool.query(updateVentasQuery, paramsVentas);
      }

      // Finalizar transacción
     
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error actualizando los datos' });
  }
});



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
    const { mapa1, manzana, lote, sector } = req.body
    console.log(mapa1, manzana, lote)
    let mensaje="Error"
    try {
      
        const lot = await pool.query('select * from lotes where sector=? and manzana=? and lote=? ', [sector,manzana, lote])
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

