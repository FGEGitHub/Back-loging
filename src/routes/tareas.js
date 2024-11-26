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
      // Obtener todos los registros de la tabla 'votacion'
      const votaciones = await pool.query('SELECT * FROM rk');

      // Procesar cada registro
      for (const votacion of votaciones) {
          // Inicializar votos procesados como un arreglo vacío
          let votosDetallados = [];
  
          if (votacion.votos) {
              try {
                console.log(votacion.votos)
                  // Parsear el campo 'votos' como JSON
                 // const votosArray = JSON.parse(votacion.votos);
                //  console.log(votacion.votos)
                 // console.log(votosArray)
                  // Verificar que el valor parseado sea un arreglo
                  if (Array.isArray(votacion.votos)) {
                      // Obtener detalles de cada ID en el campo 'votos'
                      console.log()
                      const detalles = await pool.query(
                          `SELECT  name as candidadp, category as categoria, subcategory as subcategoria FROM votacion WHERE id IN (?)`,
                          [votacion.votos]
                      );

                      // Reemplazar IDs por los detalles correspondientes
                      votosDetallados = detalles;
                  }
              } catch (error) {
                  console.error(`Error al procesar los votos para votacion.id=${votacion.id}:`, error);
              }
          }

          // Actualizar el campo 'votos' con los detalles obtenidos
          votacion.votos = JSON.stringify(votosDetallados);
      }
      console.log(votaciones)
      // Devolver la tabla 'votacion' con los votos transformados
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