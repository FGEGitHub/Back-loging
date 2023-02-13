const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2} = require('../lib/auth') //proteger profile
const pool = require('../database')



router.get('/lista/',isLoggedInn2, async (req, res) => {
   
  
     const etc = await pool.query ('select * from cursos' )

   res.json(etc);
 //res.render('index')
 })

 
 router.get('/detalledelcurso/:id',isLoggedInn2, async (req, res) => {
   const id = req.params.id
  try {
    const etc = await pool.query ('select * from clases where id_curso = ? ',[id] )

    res.json(etc);
  } catch (error) {
    res.json(['']);
  }
 
//res.render('index')
})
 router.post("/crear", isLoggedInn2,async (req, res) => {
  const { nombre, observaciones, encargado,cupo } = req.body


    try {
      datos = {
        fecha: (new Date(Date.now())).toLocaleDateString(),
        nombre,
        observaciones, 
        encargado,
        cupo
      }
    
      await pool.query('insert cursos  set ?',   [datos] )
      aux = await pool.query('select * from cursos ')
      console.log((aux.length))
      console.log(aux[(aux.length-1)])
      console.log(aux[(aux.length-1)]['id'])
      idaux = aux[(aux.length-1)]['id']
      nove = {
            id_ref: idaux,
            asunto:'Nuevo Curso',
            detalle:'Lanzamiento de curso:'+nombre,
            fecha:(new Date(Date.now())).toLocaleDateString(),


      }
      await pool.query('insert novedades  set ?',   [nove] )
      res.json('Realizado')
    } catch (error) {
      console.log(error)
      res.json('Error algo sucedio')
    }
 
 })









module.exports = router