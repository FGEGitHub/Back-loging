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
router.get('/traervotantes', async (req, res) => {
    try {
        // Obtener todos los registros de la tabla 'rk'
        const votaciones = await pool.query('SELECT * FROM rk');
  
        // Procesar cada registro
        for (const votacion of votaciones) {
            // Inicializar votos procesados como un arreglo vacío
            let votosDetallados = [];
    
            if (votacion.votos) {
                try {
                    console.log('Votos en formato LONGTEXT:', votacion.votos);
  
                    // Intentar parsear el campo 'votos' que es un LONGTEXT (puede ser un array de ids en formato JSON)
                    let votosArray = [];
                    try {
                        votosArray = JSON.parse(votacion.votos); // Intenta parsear la cadena LONGTEXT a un array
                    } catch (error) {
                        console.error(`Error al parsear votos de votacion.id=${votacion.id}:`, error);
                        votosArray = [];
                    }
  
                    // Verificar que el valor parseado sea un arreglo de IDs
                    if (Array.isArray(votosArray)) {
                        // Obtener detalles de cada ID en el campo 'votos'
                        const detalles = await pool.query(
                            `SELECT name AS candidato, category AS categoria, subcategory AS subcategoria 
                             FROM votacion 
                             WHERE id IN (?)`,
                            [votosArray] // Pasamos el array de IDs
                        );
  
                        // Reemplazar IDs por los detalles correspondientes
                        votosDetallados = detalles;
                    } else {
                        console.error(`El campo votos no es un array válido en votacion.id=${votacion.id}`);
                    }
                } catch (error) {
                    console.error(`Error al procesar los votos para votacion.id=${votacion.id}:`, error);
                }
            }
  
            // Actualizar el campo 'votos' con los detalles obtenidos como un string JSON
            votacion.votos = JSON.stringify(votosDetallados);
        }
  
        // Devolver la lista de votaciones con los votos transformados
        console.log('Votaciones con votos detallados:', votaciones);
        res.json(votaciones);
    } catch (error) {
        console.error('Error al obtener votaciones:', error);
        res.status(500).json({ mensaje: 'Error al obtener las votaciones' });
    }
  });
  
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
    const { nombre, telefono, apellido, dni,barrio } = req.body;
    console.log(nombre, telefono, apellido, dni,barrio);

    try {
        // Verificar si el teléfono ya existe
        const exis = await pool.query('SELECT * FROM rk WHERE punt = ? or dni = ?  ', [telefono,dni]);

        if (exis.length > 0) {
            res.json("Ya existe dni o  teléfono registrado");
        } else {
            // Insertar nuevo registro
            const resultado = await pool.query('INSERT INTO rk (name,lastname,dni, punt, barrio) VALUES (?, ?, ?, ?, ?)', [nombre,apellido,dni, telefono, barrio]);

            // Obtener el id generado
            const idVotante = resultado.insertId;
            console.log( Number(idVotante))
            // Enviar el ID como respuesta
            res.json({ mensaje: "Registro exitoso", id: Number(idVotante) });
        }
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al guardar datos. Verifica los  datos."
        });
    }
});


module.exports = router