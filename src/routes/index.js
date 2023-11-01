const express = require('express')
const router = express.Router()
const pool = require('../database')


/// borrar despues




router.get('/', async (req, res) => {
    console.log('hola')
try {
   pipo= 'HOLA MUNDO '
   res.json(pipo);
} catch (error) {
  res.json('error')
}
   


 
//res.render('index')
})



router.get('/tllamadoscarnaval', async (req, res) => {
 
 
  try {
    const encargados = await pool.query('select * from usuarios where nivel =6')
  
    let envio = []
    asignados = 0
    for (encargado in encargados) {
        let asignados = await pool.query('select * from inscripciones_carnaval where id_call =? ', [encargados[encargado]['id']])
  
  
        let sinc = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="Inscripto" ', [encargados[encargado]['id']])
        let asig = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="Asignadx a curso" ', [encargados[encargado]['id']])
        let rech = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="Rechazada" ', [encargados[encargado]['id']])
         nocont = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="No contesta" ', [encargados[encargado]['id']])
  
        let objeto_nuevo = {
            id: encargados[encargado]['id'],
            nombre: encargados[encargado]['nombre'],
            asignados: asignados.length,
            sinc: sinc.length,
            asig: asig.length,
            rech: rech.length,
            nocont:nocont.length
  
        }
        envio.push(objeto_nuevo)
    }
  
  
    console.log(envio)
    res.json([envio])
  } catch (error) {
    console.log(error)
  res.json(['error'])
  }
   
  
  
  
  //res.render('index')
  })



router.get('/todoslosencargadosllamados', async (req, res) => {
 
 
try {
  const encargados = await pool.query('select * from usuarios where nivel =6')

  let envio = []
  asignados = 0
  for (encargado in encargados) {
      let asignados = await pool.query('select * from inscripciones where id_call =? ', [encargados[encargado]['id']])


      let sinc = await pool.query('select * from inscripciones where id_call =? and estado="Preasignada" ', [encargados[encargado]['id']])
      let asig = await pool.query('select * from inscripciones where id_call =? and estado="Asignada a curso" ', [encargados[encargado]['id']])
      let rech = await pool.query('select * from inscripciones where id_call =? and estado="Rechazada" ', [encargados[encargado]['id']])
       nocont = await pool.query('select * from inscripciones where id_call =? and estado="No contesta" ', [encargados[encargado]['id']])

      let objeto_nuevo = {
          id: encargados[encargado]['id'],
          nombre: encargados[encargado]['nombre'],
          asignados: asignados.length,
          sinc: sinc.length,
          asig: asig.length,
          rech: rech.length,
          nocont:nocont.length

      }
      envio.push(objeto_nuevo)
  }


  console.log(envio)
  res.json([envio])
} catch (error) {
  console.log(error)
res.json(['error'])
}
 



//res.render('index')
})
router.get('/exitosignupp', async (req, res) => {
res.json('Modificado correctamente')

})

router.get('/noexitop', async (req, res) => {
  res.json('Error algo sucedio, complete correctamente los datos')

})

router.get('/prueba', async (req, res) => {
  console.log((new Date(Date.now())).toLocaleDateString())
  console.log((new Date(Date.now())))
  console.log((new Date.now()))
try {

} catch (error) {
res.json(['error'])
}
 



//res.render('index')
})


module.exports = router