const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../dbconnector')




router.post("/modificarturno",  async (req, res) => {
  const { id,descripcion} = req.body
try {
  


  await pool.query('update turnos set descripcion=? where id =?', [descripcion,id])
  res.json('Realizado')
} catch (error) {
  console.log(error)
  res.json('No realizado')
}

})

router.post("/nuevaclase",  async (req, res) => {
  const { id_turno, dni, observaciones,numero_clase,  fecha} = req.body


try {
  
act = {
observacion:observaciones,
fecha,
numero_clase,
id_turno
}

await pool.query('insert clases  set ?', [act])
res.json('Clase agregada')
} catch (error) {
  console.log(error)
  res.json('Clase agregada')
}

})


router.get('/clasesdelturno/:id', async (req, res) => {
    const id = req.params.id
  
  
  
  
    const etc = await pool.query('select * from clases where id_turno =?', [id])
  
    res.json(etc);
    //res.render('index')
  })




module.exports = router