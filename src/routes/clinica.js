import express from "express";
const router = express.Router();

import { isLoggedInncli } from "../lib/auth.js";
import pool from "../database5.js";

import multer from "multer";
import path from "path";
import fs from "fs";
import fse from "fs/promises";
import axios from "axios";


import { Preference, MercadoPagoConfig } from "mercadopago";
import { MP_ACCESS_TOKEN } from "../keys.js";

const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

router.post("/crear-preferencia", async (req, res) => {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Consulta Clínica",
            quantity: 1,
            unit_price: 5000,
            currency_id: "ARS",
          },
        ],
 back_urls: {
  success: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/success",
  failure: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/failure",
  pending: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/pending",
},
auto_return: "approved",
      },
    });

    res.json({ id: result.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error Mercado Pago" });
  }
});

router.post("/webhook", (req, res) => {
  console.log("WEBHOOK RECIBIDO:", req.body);
  res.sendStatus(200);
});



 

router.get('/traerusuario/:cuil_cuit', async (req, res) => {
    const cuil_cuit = req.params.cuil_cuit
   console.log(cuil_cuit)


    const usuario = await pool.query('select * from usuarios where usuario= ? ', [cuil_cuit])
   
    res.json(usuario)


})




router.get('/traerpacientes',isLoggedInncli, async (req, res) => {
const    cuil_cuit = req.params.cuil_cuit
    const usuario = await pool.query('select * from pacientes where baja="No" ')
   
    res.json(usuario)


})


router.get('/traerTurnosDisponibles', isLoggedInncli, async (req, res) => {
  try {
    const turnos = await pool.query(`
      SELECT 
        t.*, 
  
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

     const consultas = await pool.query('select * from turnos where id_paciente =?', [id])
    res.json([chiques, "imagenBase64", turnos, consultas])
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
    id_paciente,
    motivo,
    evolucion,
    tratamiento,
    fecha
  } = req.body;

  try {

    // Normalizamos turno
    const turnoValido = id_turno && id_turno !== "sin_turno";

    // 🔹 Si no hay id_paciente y hay turno → buscar paciente
    let pacienteFinal = id_paciente;

    if (!pacienteFinal && turnoValido) {
      const turnoRows = await pool.query(
        'SELECT id_paciente FROM turnos WHERE id = ?',
        [id_turno]
      );

      if (turnoRows.length === 0) {
        return res.status(404).json({ message: 'Turno no encontrado' });
      }

      pacienteFinal = turnoRows[0].id_paciente;
    }

    if (!pacienteFinal) {
      return res.status(400).json({ message: 'Falta id_paciente' });
    }

    // =====================================
    // 🔹 CASO 1 → CONSULTA SIN TURNO
    // =====================================
    if (!turnoValido) {

      await pool.query(
        `INSERT INTO consultas
         (id_paciente, motivo, evolucion, tratamiento, fecha)
         VALUES (?, ?, ?, ?, ?)`,
        [
          pacienteFinal,
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date()
        ]
      );

      return res.json({ ok: true, creada: "sin_turno" });
    }

    // =====================================
    // 🔹 CASO 2 → CONSULTA CON TURNO
    // =====================================

    // Verifico si ya hay consulta para ese turno
    const consultaExistente = await pool.query(
      'SELECT id FROM consultas WHERE id_turno = ?',
      [id_turno]
    );

    if (consultaExistente.length === 0) {
      // Insert
      await pool.query(
        `INSERT INTO consultas
         (id_turno, id_paciente, motivo, evolucion, tratamiento, fecha)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id_turno,
          pacienteFinal,
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date()
        ]
      );
    } else {
      // Update
      await pool.query(
        `UPDATE consultas
         SET motivo=?, evolucion=?, tratamiento=?, fecha=?
         WHERE id_turno=?`,
        [
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date(),
          id_turno
        ]
      );
    }

    // Marco turno atendido
    await pool.query(
      `UPDATE turnos SET estado='Atendido' WHERE id=?`,
      [id_turno]
    );

    res.json({ ok: true, creada: "con_turno" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al guardar consulta' });
  }
});


router.post('/nuevoturnodisp',  async (req, res) => {
  try {
    let { fecha, hora, observaciones } = req.body;
console.log(fecha, hora, observaciones )
    // Validaciones mínimas
    if (!fecha || !hora) {
      return res.status(400).json({ message: "Fecha y hora son obligatorias" });
    }

    // Si observaciones viene vacío → texto por defecto
    if (!observaciones || observaciones.trim() === "") {
      observaciones = "Sin observaciones";
    }

    const sql = `
      INSERT INTO turnos
      (fecha, hora, observaciones)
      VALUES (?, ?, ?)
    `;

    await pool.query(sql, [fecha, hora, observaciones]);

    res.json({ message: "Turno creado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear turno" });
  }
});

router.post('/agendarapaciente',  async (req, res) => {
  try {
    const { id_turno, id_paciente, categoria } = req.body;

    // Validaciones básicas
    if (!id_turno || !id_paciente || !categoria) {
      return res.status(400).json({ 
        message: "Faltan datos obligatorios" 
      });
    }

    // Verificar que el turno exista
    const [turno] = await pool.query(
      "SELECT id FROM turnos WHERE id = ?",
      [id_turno]
    );

    if (turno.length === 0) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    // Actualizar turno con paciente y categoría
    const sql = `
      UPDATE turnos
      SET id_paciente = ?, categoria = ?
      WHERE id = ?
    `;

    await pool.query(sql, [id_paciente, categoria, id_turno]);

    res.json({ message: "Paciente agendado correctamente" });

  } catch (error) {
    console.error("Error en agendarapaciente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.post("/solicitarturno", async (req, res) => {
  try {
    const { id_turno, nombre, dni, telefono, categoria } = req.body;

    if (!id_turno || !nombre || !dni || !telefono || !categoria) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    // 1. Verificar / crear paciente
    const existe = await pool.query(
      "SELECT id FROM pacientes WHERE dni = ?",
      [dni]
    );

    let id_paciente;

    if (existe.length > 0) {
      id_paciente = existe[0].id;
    } else {
      const nuevo = await pool.query(
        "INSERT INTO pacientes (nombre, dni, telefono) VALUES (?, ?, ?)",
        [nombre, dni, telefono]
      );
      id_paciente = nuevo.insertId;
    }

    // 2. Verificar turno
    const turno = await pool.query(
      "SELECT id, id_paciente FROM turnos WHERE id = ?",
      [id_turno]
    );

    if (turno.length === 0) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    if (turno[0].id_paciente) {
      return res.status(409).json({ message: "Turno ya ocupado" });
    }

    // 3. Reservar turno (estado pendiente de pago)
/*     await pool.query(
      `UPDATE turnos 
       SET id_paciente = ?, categoria = ?, estado = 'pendiente_pago'
       WHERE id = ?`,
      [id_paciente, categoria, id_turno]
    ); */

    // 4. Crear preferencia de pago
const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Consulta Clínica",
            quantity: 1,
            unit_price: 5000,
            currency_id: "ARS",
          },
        ],
        external_reference: String(id_turno), // MUY IMPORTANTE
        notification_url: "https://unideographic-deborah-winnable.ngrok-free.dev/webhook",
     back_urls: {
  success: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/success",
  failure: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/failure",
  pending: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/pending",
},
auto_return: "approved",
      },
    });

    // 5. Responder con link de pago
    res.json({
      message: "Turno reservado, pendiente de pago",
   pago_url: result.sandbox_init_point,
      preference_id: result.id,
    });

  } catch (error) {
    console.error("Error solicitarturno:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

export default router;