const express = require('express')
const router = express.Router()
const pool = require('../database')


/// borrar despues




router.get('/', async (req, res) => {
    console.log('hola')
try {
   pipo= await pool.query('select * from usuarios')
   res.json(pipo);
} catch (error) {
  res.json('error')
}
   


 
//res.render('index')
})



router.get('/exitosignupp', async (req, res) => {
res.json('Modificado correctamente')

})

router.get('/noexitop', async (req, res) => {
  res.json('Error algo sucedio, complete correctamente los datos')

})




module.exports = router