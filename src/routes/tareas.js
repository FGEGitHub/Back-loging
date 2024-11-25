const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2  } = require('../lib/auth') //proteger profile
const pool = require('../database')


router.get('/rk/', async (req, res) => {
    const id = req.params.id
    console.log(id)

    tareas = await pool.query('select * from rk order by punt desc')

    res.json(tareas)

})

router.post('/guardar', async (req, res) => {
    const {name, punt} = req.body
    console.log(id)

    await pool.query('insert into rk set name=?, punt=?', [name, punt])

    res.json("guardado")

})


router.get('/lista/:id', isLoggedInn2, async (req, res) => {
    const id = req.params.id
    console.log(id)

    tareas = await pool.query('select cursos.nombre nombre_curso, cursado.id id_cursado, cursado.inscripcion, personas.nombre, personas.apellido, personas.tel, personas.tel2 from cursado join cursos on cursado.id_curso=cursos.id  join personas on cursado.id_persona = personas.id where profesor=? ',[id])

    res.json(tareas)

})



router.post('/enviardatosvoto', async (req, res) => {
    const {nombre  ,telefono} = req.body
    console.log(nombre  ,telefono)
 
            try {
                const exis = await pool.query('select * from rk where punt=?',[telefono])
                if (exis.length>0){
                    res.json("Ya existe telefono registrado")
                }else{
                    await pool.query('insert into rk set name=?, punt=?', [nombre, telefono])

                    res.json("Si")
                }
              
            } catch (error) {

               console.log(error)

                res.json("Error, no se puedo guardar datos, verifica que el telefono contenga solo numeros ")
            }


})

module.exports = router