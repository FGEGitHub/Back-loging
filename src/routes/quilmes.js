import express from "express";
const router = express.Router();

//import { isLoggedInncli } from "../lib/auth.js";
import pool from "../database6.js";


import bcrypt from "bcryptjs";


router.get("/crear-usuario", async (req, res) => {
  try {
    const usuario = "pipo";
    const nivel = 1;   
    const password = "1234";


    if (!usuario || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email y password son obligatorios"
      });
    }

    // 1️⃣ Verificar si ya existe
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (existe.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El usuario ya existe"
      });
    }

    // 2️⃣ Hashear contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3️⃣ Insertar usuario
    const result = await pool.query(
      "INSERT INTO usuarios (nivel, password, usuario) VALUES (?, ?, ?)",
      [nivel, passwordHash, usuario]
    );

    res.status(201).json({
      ok: true,
      message: "Usuario creado",
      userId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Error del servidor"
    });
  }
});


router.post("/agregarsocio", async (req, res) => {
  try {
    const {
      // Datos personales
      dni,
      apellido,
      nombre,
      fecha_nacimiento,
      genero,

      // Información deportiva
      disciplina,
      categoria,
      equipo,
      condicion_deportiva,
      estado_deportivo,

      // Contacto
      telefono,
      email,
      direccion,

      // Tutor
      tiene_tutor,
      tutor_nombre,
      tutor_dni,
      tutor_telefono,
      tutor_email,
      vinculo,

      // Salud
      apto_medico,
      venc_apto,
      obra_social,
      tel_emergencia,
      obs_medicas,

      // Consentimientos
      autorizacion_imagen,
      autorizacion_viajes,

      // Control interno
      profesor_carga,
      fecha_inscripcion,
      obs_internas
    } = req.body;

    /* ===============================
       VALIDACIONES OBLIGATORIAS
    ================================ */
    if (
      !dni ||
      !apellido ||
      !nombre 
 
    ) {
      return res.status(400).json({
        ok: false,
        message: "Faltan datos obligatorios"
      });
    }

    /* ===============================
       VALIDAR DNI ÚNICO
    ================================ */
    const dniExiste = await pool.query(
      "SELECT id FROM socios WHERE dni = ?",
      [dni.trim()]
    );

    if (dniExiste.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "El DNI ya se encuentra registrado"
      });
    }

    /* ===============================
       INSERT
    ================================ */
    const sql = `
      INSERT INTO socios (
        dni,
        apellido,
        nombre,
        fecha_nacimiento,
        genero,
        disciplina,
        categoria,
        equipo,
        condicion_deportiva,
        estado_deportivo,
        telefono,
        email,
        direccion_barrio,
        tutor_nombre,
        tutor_dni,
        tutor_tel,
        tutor_email,
        vinculo,
        apto_medico,
        venc_apto,
        obra_social,
        tel_emergencia,
        obs_medicas,
        autorizacion_imagen,
        autorizacion_viajes,
        profesor_carga,
        fecha_inscripcion,
        obs_internas
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const valores = [
      dni.trim(),
      apellido.trim(),
      nombre.trim(),
      fecha_nacimiento || null,
      genero || null,
      disciplina || null,
      categoria || null,
      equipo || null,
      condicion_deportiva || null,
      estado_deportivo || "Activo",
      telefono || null,
      email || null,
      direccion || null,
      tiene_tutor ? tutor_nombre : null,
      tiene_tutor ? tutor_dni : null,
      tiene_tutor ? tutor_telefono : null,
      tiene_tutor ? tutor_email : null,
      tiene_tutor ? vinculo : null,
      apto_medico || null,
      venc_apto || null,
      obra_social || null,
      tel_emergencia || null,
      obs_medicas || null,
      autorizacion_imagen || null,
      autorizacion_viajes || null,
      profesor_carga || null,
      fecha_inscripcion || new Date(),
      obs_internas || null
    ];

    const result = await pool.query(sql, valores);

    res.status(201).json("Socio creado con exito");

  } catch (error) {
    console.error("Error agregarsocio:", error);
    res.status(500).json({
      ok: false,
      message: "Error al crear socio"
    });
  }
});


router.get("/traersocios", async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT 
       *
        
      FROM socios
      ORDER BY apellido ASC, nombre ASC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Error al traer socios:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener socios"
    });
  }
});

router.get("/traersocio/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await pool.query(`
      SELECT 
       *
        
      FROM socios
      where id=?
      ORDER BY apellido ASC, nombre ASC
    `, [id] 
    );
    res.json(rows);

  } catch (error) {
    console.error("Error al traer socios:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener socios"
    });
  }
});
export default router;