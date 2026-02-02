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

router.get("/crear-usuario-profes", async (req, res) => {
  try {
    const usuario = "profes";
    const nivel = 1;   
    const password = "quilmes2026";


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
router.get("/crear-usuario-club", async (req, res) => {
  try {
    const usuario = "club";
    const nivel = 2;   
    const password = "quilmesadmin2026";


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

router.post("/actualizarsocio", async (req, res) => {
  const { id, ...datos } = req.body;

  if (!id) {
    return res.status(400).json({
      mensaje: "ID requerido"
    });
  }

  if (!datos || Object.keys(datos).length === 0) {
    return res.status(400).json({
      mensaje: "No hay campos para actualizar"
    });
  }

  try {
    const campos = [];
    const valores = [];

    Object.entries(datos).forEach(([campo, valor]) => {
      campos.push(`${campo} = ?`);
      valores.push(valor);
    });

    valores.push(id);

    const sql = `
      UPDATE socios
      SET ${campos.join(", ")}
      WHERE id = ?
    `;

    await pool.query(sql, valores);

    res.json("Socio actualizado correctamente"
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al actualizar socio"
    });
  }

}
);


router.post("/pagarcuota", async (req, res) => {
  try {
    const {
      socio_id,
      mes,
      anio,
      fecha_pago,
      medio
    } = req.body;
    /* ================= VALIDACIONES ================= */

    if (!socio_id || !mes || !anio) {
      return res.status(400).json({
        ok: false,
        msg: "id_socio, mes y anio son obligatorios",
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        ok: false,
        msg: "Mes inválido (1 a 12)",
      });
    }

    /* ================= VERIFICAR SI YA EXISTE ================= */

    const existe = await pool.query(
      `SELECT id FROM cuotas 
       WHERE id_socio = ? AND mes = ? AND anio = ?`,
      [socio_id, mes, anio]
    );

    if (existe.length > 0) {
      return res.status(409).json({
        ok: false,
        msg: "Esta cuota ya está registrada",
      });
    }

    /* ================= INSERT ================= */

    const result = await pool.query(
      `INSERT INTO cuotas
      (id_socio, mes, anio, fecha, medio)
      VALUES (?, ?, ?, ?, ?)`,
      [
        socio_id,
        mes,
        anio,
        fecha_pago || null,
        medio || null,
      ]
    );

    /* ================= OK ================= */

    res.status(201).json("Cuota registrada correctamente");

  } catch (error) {
    console.error("Error pagarcuota:", error);

    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
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
      tutor_tel,
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
console.log(tiene_tutor);
    /* ===============================
       VALIDACIONES OBLIGATORIAS
    ================================ */
    if (
      !dni ||
      !apellido ||
      !nombre 
 
    ) {
      return res.status(400).json("Faltan datos obligatorios");
    }
    /* ===============================
       VALIDAR DNI ÚNICO
    ================================ */
    const dniExiste = await pool.query(
      "SELECT id FROM socios WHERE dni = ?",
      [dni.trim()]
    );

    if (dniExiste.length > 0) {
      return res.status(400).json("El DNI ya se encuentra registrado");
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
        tiene_tutor,
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
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
      tiene_tutor || false,
      tiene_tutor ? tutor_nombre : null,
      tiene_tutor ? tutor_dni : null,
      tiene_tutor ? tutor_tel : null,
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
      fecha_inscripcion || new Date().toISOString().split("T")[0],
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
        s.*,

        c.mes  AS ultimaCuotaMes,
        c.anio AS ultimaCuotaAnio

      FROM socios s

      LEFT JOIN cuotas c
        ON c.id_socio = s.id
        AND (c.anio, c.mes) = (
          SELECT c2.anio, c2.mes
          FROM cuotas c2
          WHERE c2.id_socio = s.id
          ORDER BY c2.anio DESC, c2.mes DESC
          LIMIT 1
        )

      ORDER BY s.apellido ASC, s.nombre ASC
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



router.get("/traercuotastodas", async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT
        c.*,

        s.nombre,
        s.apellido,
        s.disciplina,
        s.categoria

      FROM cuotas c

      JOIN socios s
        ON c.id_socio = s.id

      ORDER BY 
        c.anio DESC,
        c.mes DESC,
        s.apellido ASC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Error al traer cuotas:", error);

    res.status(500).json({
      ok: false,
      message: "Error al obtener cuotas"
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

router.get("/traercuotas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await pool.query(`select * from cuotas where id_socio=?`, [id] );
    res.json(rows); 
  } catch (error) {
    console.error("Error al traer socios:", error);
    res.status(500).json()
  }}
)
export default router;