const express = require('express')
const router = express.Router()
const { isLoggedInncli } = require('../lib/auth') //proteger profile
const pool = require('../database5')
const multer = require('multer')
const path = require('path')
const fse = require('fs').promises;
const fs = require('fs');
const axios = require('axios');

///import { format } from "date-fns"; // si lo querés más cómodo
////solicitado== se suma al partido
////convocado,= s enevia a un juagdor la invitacion

 

router.get('/traerusuario/:cuil_cuit', async (req, res) => {
    cuil_cuit = req.params.cuil_cuit
   console.log(cuil_cuit)


    const usuario = await pool.query('select * from usuarios where usuario= ? ', [cuil_cuit])
   
    res.json(usuario)


})




router.get('/traerpacientes',isLoggedInncli, async (req, res) => {
    cuil_cuit = req.params.cuil_cuit
   console.log(cuil_cuit)
    const usuario = await pool.query('select * from pacientes where baja="No" ')
   
    res.json(usuario)


})

router.get('/traerturnos', isLoggedInncli, async (req, res) => {
  try {
    const turnos = await pool.query(`
      SELECT 
        t.*, 
        p.nombre,
        p.apellido,
        p.dni,
        p.id AS id_pacientee
      FROM turnos t
      LEFT JOIN pacientes p ON t.id_paciente = p.id
      where t.baja="No" 
      ORDER BY t.hora ASC, p.dni ASC
    `);

    res.json(turnos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al traer turnos' });
  }
});

router.post('/modificarusuario', isLoggedInncli, async (req, res) => {
  try {
    const { id, ...datos } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID' });
    }

    // Quitamos null / undefined
    const campos = Object.keys(datos).filter(
      (k) => datos[k] !== undefined && datos[k] !== null
    );

    if (campos.length === 0) {
      return res.status(400).json({ error: 'No hay datos para modificar' });
    }

    const setSQL = campos.map(campo => `${campo} = ?`).join(', ');
    const values = campos.map(campo => datos[campo]);

    const sql = `
      UPDATE pacientes
      SET ${setSQL}
      WHERE id = ?
    `;

    values.push(id);

    await pool.query(sql, values);

    res.json('Paciente modificado correctamente');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al modificar paciente' });
  }
});



router.post('/crearturno', isLoggedInncli, async (req, res) => {
    try {
        const {
            id_paciente,
            fecha,
            hora,
            profesional,
            motivo,
            observaciones
        } = req.body;

        const sql = `
            INSERT INTO turnos
            (id_paciente, fecha, hora,  motivo, observaciones)
            VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            id_paciente || null,
            fecha || null,
            hora || null,
       
            motivo || null,
            observaciones || null
        ];

        const resultado = await pool.query(sql, values);

        res.json("Turno creado correctamente");

    } catch (error) {
        console.error("Error al crear turno:", error);
        res.status(500).json({ ok: false, error: "Error en el servidor" });
    }
});


router.post('/agregarPersona', isLoggedInncli, async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      genero,
      fecha_nacimiento,
      fecha_ingreso,
      telefono,
      direccion,
      obra_social,
      numero_afiliado
    } = req.body;
console.log(nombre,
      apellido,
      dni,
      genero,
      fecha_nacimiento,
      fecha_ingreso,
      telefono,
      direccion,
      obra_social,
      numero_afiliado)
    if (!dni) {
      return res.status(400).json('El DNI es obligatorio');
    }

    // 🔎 Verificar si ya existe el DNI (y que no esté dado de baja)
    const existe = await pool.query(
      `SELECT id FROM pacientes WHERE dni = ? AND baja = 'No'`,
      [dni]
    );

    if (existe.length > 0) {
      return res.json({
        ok: false,
        msg: "Ya existe un paciente con ese DNI"
      });
    }

    // ➕ Insertar paciente
    const sql = `
      INSERT INTO pacientes 
      (
        nombre,
        apellido,
        dni,
        genero,
        fecha_nacimiento,
        fecha_ingreso,
        telefono,
        direccion,
        obra_social,
        numero_afiliado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nombre || null,
      apellido || null,
      dni,
      genero || null,
      fecha_nacimiento || null,
      fecha_ingreso || null,
      telefono || null,
      direccion || null,
      obra_social || null,
      numero_afiliado || null
    ];

    await pool.query(sql, values);

    res.json({
      ok: true,
      msg: 'Paciente agregado correctamente'
    });

  } catch (error) {
    console.error('Error al agregar paciente:', error);
    res.status(500).json('Error al agregar paciente');
  }
});

router.get('/datospaciente/:id', async (req, res) => {
  const id = req.params.id
  try {  const chiques = await pool.query('select * from pacientes where id =?', [id])

      const turnos = await pool.query('select * from turnos where id_paciente =?', [id])

    res.json([chiques, "imagenBase64", turnos])
  } catch (error) {
    console.log(error)
    res.json([])
  }

})
////////////////////traerusuario


router.get('/traerTurnoDetalle/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Traer turno + paciente
    const rows = await pool.query(
      `SELECT 
         t.*,
         p.id        AS paciente_id,
         p.nombre,
         p.apellido,
         p.dni,
         p.telefono,
         p.direccion,
         p.fecha_nacimiento,
         p.fecha_ingreso
       FROM turnos t
       JOIN pacientes p ON t.id_paciente = p.id
       WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // 2️⃣ Traer consultas asociadas al turno
    const consultas = await pool.query(
      `SELECT * FROM consultas WHERE id_turno = ?`,
      [id]
    );

    // 3️⃣ Tomar la primera consulta si existe
    const consulta = consultas.length > 0
      ? {
          motivo: consultas[0].motivo,
          evolucion: consultas[0].evolucion,
          tratamiento: consultas[0].tratamiento,
        }
      : null;

    // 4️⃣ Respuesta final
    res.json({
      turno: {
        id: rows[0].id,
        fecha: rows[0].fecha,
        hora: rows[0].hora,
        motivo: rows[0].motivo,
        estado: rows[0].estado,
        observaciones: rows[0].observaciones,
      },
      paciente: {
        id: rows[0].paciente_id,
        nombre: rows[0].nombre,
        apellido: rows[0].apellido,
        dni: rows[0].dni,
        telefono: rows[0].telefono,
        direccion: rows[0].direccion,
        fecha_nacimiento: rows[0].fecha_nacimiento,
      },
      consulta
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al traer turno' });
  }
});



router.post('/borrarpaciente', isLoggedInncli, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID del paciente' });
    }

    await conn.beginTransaction();

    // Baja lógica en pacientes
    await conn.query(
      `UPDATE pacientes SET baja = 'Si' WHERE id = ?`,
      [id]
    );

    // Baja lógica en turnos
    await conn.query(
      `UPDATE turnos SET baja = 'Si' WHERE id_paciente = ?`,
      [id]
    );

    await conn.commit();

    res.json('Paciente dado de baja correctamente');

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json( 'Error al dar de baja al paciente');
  } finally {
    conn.release();
  }
});


router.post('/guardarConsulta', async (req, res) => {
  const {
    id_turno,
    motivo,
    evolucion,
    tratamiento,
    fecha
  } = req.body;

  if (!id_turno) {
    return res.status(400).json({ message: 'Falta id_turno' });
  }

  try {
    // 1️⃣ Buscar el id_paciente desde el turno
    const turnoRows = await pool.query(
      'SELECT id_paciente FROM turnos WHERE id = ?',
      [id_turno]
    );

    if (turnoRows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    const id_paciente = turnoRows[0].id_paciente;

    // 2️⃣ Verificar si ya existe consulta para ese turno
    const consultaExistente = await pool.query(
      'SELECT id FROM consultas WHERE id_turno = ?',
      [id_turno]
    );

    if (consultaExistente.length === 0) {
      // 3️⃣ Crear consulta
      await pool.query(
        `INSERT INTO consultas
         (id_turno, id_paciente, motivo, evolucion, tratamiento, fecha)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id_turno,
          id_paciente,
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date()
        ]
      );
    } else {
      // 4️⃣ Actualizar consulta existente
      await pool.query(
        `UPDATE consultas
         SET motivo = ?, evolucion = ?, tratamiento = ?, fecha = ?
         WHERE id_turno = ?`,
        [
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date(),
          id_turno
        ]
      );
    }

    // 5️⃣ Marcar turno como Atendido
    await pool.query(
      `UPDATE turnos
       SET estado = 'Atendido'
       WHERE id = ?`,
      [id_turno]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al guardar consulta' });
  }
});


module.exports = router