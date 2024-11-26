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
router.get('/traervotantes/', async (req, res) => {
   

    tareas = await pool.query('select * from rk ')

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
    const { nombre, telefono } = req.body;
    console.log(nombre, telefono);

    try {
        // Verificar si el teléfono ya existe
        const exis = await pool.query('SELECT * FROM rk WHERE punt = ?', [telefono]);

        if (exis.length > 0) {
            res.json("Ya existe teléfono registrado");
        } else {
            // Insertar nuevo registro
            const resultado = await pool.query('INSERT INTO rk (name, punt) VALUES (?, ?)', [nombre, telefono]);

            // Obtener el id generado
            const idVotante = resultado.insertId;
            console.log( Number(idVotante))
            // Enviar el ID como respuesta
            res.json({ mensaje: "Registro exitoso", id: Number(idVotante) });
        }
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al guardar datos. Verifica que el teléfono contenga solo números."
        });
    }
});


module.exports = router