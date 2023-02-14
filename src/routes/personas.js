const express = require('express')
const router = express.Router()

const pool = require('../database')





router.get('/datosusuario/:usuario', async (req, res) => {
   const usuario = req.params.usuario
    console.log(usuario)
    const etc = await pool.query ('select * from usuarios where usuario =?',[usuario] )
  
  res.json([etc,]);
//res.render('index')
})



router.get('/datosusuarioporid/:id', async (req, res) => {
  const id = req.params.id
   console.log(id)
   const etc = await pool.query ('select * from usuarios where id =?',[id] )
   
   porcentaje = 100
   console.log(etc[0]['trabajo'])
   if(etc[0]['trabajo']== 'Si'){
    
     porcentaje-=33
   }
   if(etc[0]['hijos']== 'Si'){
    porcentaje-=33
   }
   anios = parseInt(etc[0]['anios'])
   
   if(anios> 35){
    console.log(anios)
    porcentaje-=33
   }
   console.log(porcentaje)
 res.json([etc,porcentaje]);
//res.render('index')
})




module.exports = router