import express from "express";
const router = express.Router();

//import { isLoggedInncli } from "../lib/auth.js";
import pool from "../database6.js";


import bcrypt from "bcryptjs";

const convertirBigInt = (dato) => {
  if (typeof dato === "bigint") {
    return dato.toString();
  }

  if (Array.isArray(dato)) {
    return dato.map(convertirBigInt);
  }

  if (dato && typeof dato === "object") {
    return Object.fromEntries(
      Object.entries(dato).map(([clave, valor]) => [
        clave,
        convertirBigInt(valor),
      ])
    );
  }

  return dato;
};


/* router.get("/crear-usuario", async (req, res) => {
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
}); */
router.delete("/eliminarsocio/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM socios WHERE id = ?",
      [id]
    );

    res.json({
      ok: true,
      msg: "Socio eliminado correctamente"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      msg: "Error al eliminar socio"
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
      medio,
      monto
    } = req.body;

    // Si no se envía monto, guardar 0
    const montoFinal =
      monto === undefined || monto === null || monto === ""
        ? 0
        : Number(monto);

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

    if (!Number.isFinite(montoFinal) || montoFinal < 0) {
      return res.status(400).json({
        ok: false,
        msg: "El monto debe ser un número mayor o igual a 0",
      });
    }

    /* ================= VERIFICAR SI YA EXISTE ================= */

    const existe = await pool.query(
      `SELECT id
       FROM cuotas
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

    await pool.query(
      `INSERT INTO cuotas
       (id_socio, mes, anio, fecha, medio, monto)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        socio_id,
        mes,
        anio,
        fecha_pago || null,
        medio || null,
        montoFinal,
      ]
    );

    /* ================= OK ================= */

    return res.status(201).json({
      ok: true,
      msg: "Cuota registrada correctamente",
    });

  } catch (error) {
    console.error("Error pagarcuota:", error);

    return res.status(500).json({
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
/* router.get("/traersocios", async (req, res) => {
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
 */


router.post("/enviagregastonuevo", async (req, res) => {
  try {

    const {
      usuario_id,
      actividad_id,
      tipo,
      zona_id,
      descripcion,
      monto,
      fecha
    } = req.body;

    console.log(
      usuario_id,
      actividad_id,
      tipo,
      zona_id,
      descripcion,
      monto,
      fecha
    );

    if (!usuario_id) {
      return res.status(400).json({
        error: "Falta usuario_id"
      });
    }

    if (!actividad_id) {
      return res.status(400).json({
        error: "Falta actividad_id"
      });
    }

    if (!tipo) {
      return res.status(400).json({
        error: "Falta tipo"
      });
    }

    if (!zona_id) {
      return res.status(400).json({
        error: "Falta zona_id"
      });
    }

    if (!descripcion) {
      return res.status(400).json({
        error: "Falta descripción"
      });
    }

    if (!monto || Number(monto) <= 0) {
      return res.status(400).json({
        error: "Monto inválido"
      });
    }

    if (!fecha) {
      return res.status(400).json({
        error: "Falta fecha"
      });
    }

    const sql = `
      INSERT INTO movimientos (
        usuario_id,
        actividad_id,
        tipo,
        zona_id,
        descripcion,
        monto,
        fecha
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const resultado = await pool.query(sql, [
      usuario_id,
      actividad_id,
      tipo,
      zona_id,
      descripcion,
      monto,
      fecha
    ]);

    res.status(201).json({
      ok: true,
      mensaje: "Gasto agregado correctamente"
    });

  } catch (error) {

    console.error("Error agregando gasto:", error);

    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
});


router.get("/traerdatosinicio", async (req, res) => {
  try {
    const { id, mes, anio } = req.query;

    if (!id || !mes || !anio) {
      return res.status(400).json({
        error: "Faltan el id del usuario, el mes o el año.",
      });
    }

    const mesNumero = Number(mes);
    const anioNumero = Number(anio);
    const idNumero = Number(id);

    if (
      !Number.isInteger(idNumero) ||
      idNumero <= 0 ||
      !Number.isInteger(mesNumero) ||
      mesNumero < 1 ||
      mesNumero > 12 ||
      !Number.isInteger(anioNumero) ||
      anioNumero < 2000 ||
      anioNumero > 2100
    ) {
      return res.status(400).json({
        error: "Los parámetros enviados no son válidos.",
      });
    }

    // 1. Jugadores activos
    const jugadores = await pool.query(`
      SELECT COUNT(*) AS cantidad
      FROM socios
      WHERE estado_deportivo = 'Activo'
    `);

    // 2. Nombre del usuario que inició sesión
    const usuarios = await pool.query(
      `
        SELECT nombre
        FROM usuarios
        WHERE id = ?
        LIMIT 1
      `,
      [idNumero]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: "No se encontró el usuario.",
      });
    }

    // 3. Total cobrado en cuotas del mes y año seleccionados
    const cuotas = await pool.query(
      `
        SELECT
          COUNT(*) AS cantidad,
          COALESCE(SUM(
            CAST(monto AS DECIMAL(15, 2))
          ), 0) AS total
        FROM cuotas
        WHERE mes = ? AND anio = ?
      `,
      [mesNumero, anioNumero]
    );

    // 4. Total cobrado a sponsors.
    // monto está guardado como texto.
    // Se eliminan $ y separadores de miles antes de convertir.
    const sponsors = await pool.query(
      `
        SELECT
          COALESCE(
            SUM(
              CAST(
                REPLACE(
                  REPLACE(
                    REPLACE(TRIM(monto), '$', ''),
                    '.',
                    ''
                  ),
                  ',',
                  '.'
                ) AS DECIMAL(15, 2)
              )
            ),
            0
          ) AS total
        FROM movimientos
        WHERE actividad_id = 3
          AND MONTH(fecha) = ?
          AND YEAR(fecha) = ?
      `,
      [mesNumero, anioNumero]
    );

    return res.json({
      nombreUsuario: usuarios[0].nombre,
      jugadoresActivos: Number(jugadores[0].cantidad),
      cuotasCobradas: Number(cuotas[0].cantidad),
      cobradoCuotas: Number(cuotas[0].total),
      cobradoSponsors: Number(sponsors[0].total),
      mes: mesNumero,
      anio: anioNumero,
    });
  } catch (error) {
    console.error("Error en traerdatosinicio:", error);

    return res.status(500).json({
      error: "Error al obtener los datos del inicio.",
    });
  }
});


router.get("/traeractividades", async (req, res) => {
  try {
    const resultados = await pool.query(`
      SELECT 
        id,
        nombre,
        tipo_id
      FROM actividades
      ORDER BY nombre ASC
    `);

    res.status(200).json(resultados);

  } catch (error) {
    console.error("Error al traer actividades:", error);

    res.status(500).json({
      error: "No se pudieron obtener las actividades"
    });
  }
});



router.get("/traerGastos", async (req, res) => {
  try {
    const resultados = await pool.query(`
      SELECT 
      *
      FROM movimientos
      ORDER BY id DESC
    `);

    res.status(200).json(resultados);

  } catch (error) {
    console.error("Error al traer actividades:", error);

    res.status(500).json({
      error: "No se pudieron obtener las actividades"
    });
  }
});


router.get("/traersocios", async (req, res) => {
  try {

    const rows = await pool.query(`

      SELECT 
        s.*,

        c.id AS cuota_id,
        c.mes,
        c.anio,
        c.fecha,
        c.medio,

        CASE 
          WHEN (c.anio, c.mes) = (
            SELECT c2.anio, c2.mes
            FROM cuotas c2
            WHERE c2.id_socio = s.id
            ORDER BY c2.anio DESC, c2.mes DESC
            LIMIT 1
          )
          THEN true
          ELSE false
        END AS es_ultima_cuota

      FROM socios s

      LEFT JOIN cuotas c
        ON c.id_socio = s.id

      ORDER BY s.apellido ASC, s.nombre ASC, c.anio DESC, c.mes DESC

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

router.post("/agregaractividad", async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
console.log(nombre, tipo);  
    // Validaciones
    if (
      typeof nombre !== "string" ||
      !nombre.trim() ||
      typeof tipo !== "string" ||
      !tipo.trim()
    ) {
      return res.status(400).json({
        message: "El nombre y el tipo son obligatorios.",
      });
    }

    // Insertar actividad
    const resultado = await pool.query(
      `INSERT INTO actividades (nombre, tipo)
       VALUES (?, ?)`,
      [nombre.trim(), tipo.trim()]
    );

    return res.status(201).json({
      message: "Actividad agregada correctamente.",
      
    });
  } catch (error) {
    console.error("Error al agregar actividad:", error);

    return res.status(500).json({
      message: "Error interno al guardar la actividad.",
    });
  }
});





// ======================================================
// GET /PARTIDOS/quilmes_listar_categorias
// ======================================================
router.get("/PARTIDOS/quilmes_listar_categorias", async (req, res) => {
  try {
    const categorias = await pool.execute(`
      SELECT id, nombre
      FROM categorias
      WHERE activo = 1
      ORDER BY nombre
    `);

    res.json(categorias);
  } catch (error) {
    console.error("Error listando categorías:", error);
    res.status(500).json({ mensaje: "Error al listar categorías" });
  }
});

// ======================================================
// GET /PARTIDOS/quilmes_listar_partidos
// Filtros opcionales: desde, hasta, categoria_id, estado
// ======================================================
router.get("/PARTIDOS/quilmes_listar_partidos", async (req, res) => {
  try {
    const { desde, hasta, categoria_id, estado } = req.query;

    let sql = `
      SELECT
        p.id,
        p.club_id,
        p.categoria_id,
        p.rival,
        p.fecha,
        p.hora,
        p.condicion,
        p.goles_favor,
        p.goles_contra,
        p.estado,
        p.observaciones,
        c.nombre AS club,
        cat.nombre AS categoria,

        COALESCE(SUM(
          CASE WHEN m.tipo = 'ingreso'
          THEN m.monto ELSE 0 END
        ), 0) AS recaudacion,

        COALESCE(SUM(
          CASE WHEN m.tipo = 'gasto'
          THEN m.monto ELSE 0 END
        ), 0) AS gastos,

        COALESCE(SUM(
          CASE
            WHEN m.tipo = 'ingreso' THEN m.monto
            WHEN m.tipo = 'gasto' THEN -m.monto
            ELSE 0
          END
        ), 0) AS resultado_neto

      FROM partidos p
      INNER JOIN clubes c ON c.id = p.club_id
      INNER JOIN categorias cat ON cat.id = p.categoria_id
      LEFT JOIN partidos_movimientos m ON m.partido_id = p.id
      WHERE c.nombre = 'Quilmes'
    `;

    const params = [];

    if (desde) {
      sql += " AND p.fecha >= ?";
      params.push(desde);
    }

    if (hasta) {
      sql += " AND p.fecha <= ?";
      params.push(hasta);
    }

    if (categoria_id) {
      sql += " AND p.categoria_id = ?";
      params.push(categoria_id);
    }

    if (estado) {
      sql += " AND p.estado = ?";
      params.push(estado);
    }

    sql += `
      GROUP BY p.id
      ORDER BY p.fecha DESC, p.id DESC
    `;

const partidos = await pool.execute(sql, params);

const partidosSerializables = partidos.map((partido) => {
  return Object.fromEntries(
    Object.entries(partido).map(([clave, valor]) => [
      clave,
      typeof valor === "bigint" ? valor.toString() : valor
    ])
  );
});

return res.json(partidosSerializables);
  } catch (error) {
    console.error("Error listando partidos:", error);
    res.status(500).json({ mensaje: "Error al listar partidos" });
  }
});

// ======================================================
// GET /PARTIDOS/quilmes_resumen_partidos
// Filtros opcionales: desde, hasta, categoria_id
// ======================================================
router.get("/PARTIDOS/quilmes_resumen_partidos", async (req, res) => {
  try {
    const { desde, hasta, categoria_id } = req.query;

    let sql = `
      SELECT
        COUNT(DISTINCT p.id) AS partidos_registrados,

        COALESCE(SUM(
          CASE WHEN m.tipo = 'ingreso'
          THEN m.monto ELSE 0 END
        ), 0) AS recaudacion,

        COALESCE(SUM(
          CASE WHEN m.tipo = 'gasto'
          THEN m.monto ELSE 0 END
        ), 0) AS gastos,

        COALESCE(SUM(
          CASE
            WHEN m.tipo = 'ingreso' THEN m.monto
            WHEN m.tipo = 'gasto' THEN -m.monto
            ELSE 0
          END
        ), 0) AS resultado_neto

      FROM partidos p
      INNER JOIN clubes c ON c.id = p.club_id
      LEFT JOIN partidos_movimientos m ON m.partido_id = p.id
      WHERE c.nombre = 'Quilmes'
    `;

    const params = [];

    if (desde) {
      sql += " AND p.fecha >= ?";
      params.push(desde);
    }

    if (hasta) {
      sql += " AND p.fecha <= ?";
      params.push(hasta);
    }

    if (categoria_id) {
      sql += " AND p.categoria_id = ?";
      params.push(categoria_id);
    }

    const resultado = await pool.execute(sql, params);

const resumen = resultado[0];

res.json({
  partidos_registrados: Number(resumen.partidos_registrados ?? 0),
  recaudacion: Number(resumen.recaudacion ?? 0),
  gastos: Number(resumen.gastos ?? 0),
  resultado_neto: Number(resumen.resultado_neto ?? 0),
});
  } catch (error) {
    console.error("Error obteniendo resumen:", error);
    res.status(500).json({ mensaje: "Error al obtener resumen" });
  }
});

// ======================================================
// GET /PARTIDOS/quilmes_obtener_partido/:id
// ======================================================
router.get("/PARTIDOS/quilmes_obtener_partido/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const partidos = await pool.execute(
      `SELECT
         p.*,
         c.nombre AS club,
         cat.nombre AS categoria,
         COALESCE((
           SELECT SUM(m.monto)
           FROM partidos_movimientos m
           WHERE m.partido_id = p.id AND m.tipo = 'ingreso'
         ), 0) AS recaudacion,
         COALESCE((
           SELECT SUM(m.monto)
           FROM partidos_movimientos m
           WHERE m.partido_id = p.id AND m.tipo = 'gasto'
         ), 0) AS gastos
       FROM partidos p
       INNER JOIN clubes c ON c.id = p.club_id
       INNER JOIN categorias cat ON cat.id = p.categoria_id
       WHERE p.id = ? AND c.nombre = 'Quilmes'`,
      [id]
    );

    if (!partidos.length) {
      return res.status(404).json({ mensaje: "Partido no encontrado" });
    }

    const [movimientos] = await pool.execute(
      `SELECT id, tipo, concepto, monto, fecha, observaciones
       FROM partidos_movimientos
       WHERE partido_id = ?
       ORDER BY id DESC`,
      [id]
    );

    const partido = partidos[0];
    partido.resultado_neto =
      Number(partido.recaudacion) - Number(partido.gastos);

    res.json({ ...partido, movimientos });
  } catch (error) {
    console.error("Error obteniendo partido:", error);
    res.status(500).json({ mensaje: "Error al obtener partido" });
  }
});

// ======================================================
// POST /PARTIDOS/quilmes_crear_partido
// ======================================================
router.post("/PARTIDOS/quilmes_crear_partido", async (req, res) => {
  try {
    const {
      categoria_id,
      rival,
      fecha,
      hora,
      condicion = "local",
      estado = "programado",
      goles_favor = null,
      goles_contra = null,
      observaciones = null,
    } = req.body;

    if (
      !categoria_id ||
      !Number.isInteger(Number(categoria_id)) ||
      !rival?.trim() ||
      !fecha
    ) {
      return res.status(400).json({
        mensaje: "Categoría, rival y fecha son obligatorios",
      });
    }

    if (!["local", "visitante", "neutral"].includes(condicion)) {
      return res.status(400).json({ mensaje: "Condición inválida" });
    }

    if (
      !["programado", "jugado", "suspendido", "cancelado"].includes(estado)
    ) {
      return res.status(400).json({ mensaje: "Estado inválido" });
    }

    const clubes = await pool.execute(
      "SELECT id FROM clubes WHERE nombre = ?",
      ["Quilmes"]
    );

    if (!clubes.length) {
      return res.status(500).json({
        mensaje: "No existe el club Quilmes en la base de datos",
      });
    }

    const categorias = await pool.execute(
      "SELECT id FROM categorias WHERE id = ? AND activo = 1",
      [Number(categoria_id)]
    );

    if (!categorias.length) {
      return res.status(400).json({ mensaje: "Categoría inválida" });
    }

    const resultado = await pool.execute(
      `INSERT INTO partidos (
        club_id, categoria_id, rival, fecha, hora,
        condicion, estado, goles_favor, goles_contra, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clubes[0].id,
        Number(categoria_id),
        rival.trim(),
        fecha,
        hora || null,
        condicion,
        estado,
        goles_favor,
        goles_contra,
        observaciones,
      ]
    );

 
res.status(201).json({
  mensaje: "Partido creado correctamente",
  id: resultado.insertId.toString(),
});

  } catch (error) {
    console.error("Error creando partido:", error);
    res.status(500).json({ mensaje: "Error al crear partido" });
  }
});

// ======================================================
// PUT /PARTIDOS/quilmes_editar_partido/:id
// ======================================================
router.put("/PARTIDOS/quilmes_editar_partido/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoria_id,
      rival,
      fecha,
      hora,
      condicion,
      estado,
      goles_favor,
      goles_contra,
      observaciones,
    } = req.body;

    if (
      !categoria_id ||
      !Number.isInteger(Number(categoria_id)) ||
      !rival?.trim() ||
      !fecha
    ) {
      return res.status(400).json({
        mensaje: "Categoría, rival y fecha son obligatorios",
      });
    }

    if (!["local", "visitante", "neutral"].includes(condicion)) {
      return res.status(400).json({ mensaje: "Condición inválida" });
    }

    if (
      !["programado", "jugado", "suspendido", "cancelado"].includes(estado)
    ) {
      return res.status(400).json({ mensaje: "Estado inválido" });
    }

    const result = await pool.execute(
      `UPDATE partidos p
       INNER JOIN clubes c ON c.id = p.club_id
       SET p.categoria_id = ?,
           p.rival = ?,
           p.fecha = ?,
           p.hora = ?,
           p.condicion = ?,
           p.estado = ?,
           p.goles_favor = ?,
           p.goles_contra = ?,
           p.observaciones = ?
       WHERE p.id = ? AND c.nombre = 'Quilmes'`,
      [
        Number(categoria_id),
        rival.trim(),
        fecha,
        hora || null,
        condicion,
        estado,
        goles_favor ?? null,
        goles_contra ?? null,
        observaciones || null,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ mensaje: "Partido no encontrado" });
    }

    res.json({ mensaje: "Partido actualizado correctamente" });
  } catch (error) {
    console.error("Error editando partido:", error);
    res.status(500).json({ mensaje: "Error al editar partido" });
  }
});

// ======================================================
// POST /PARTIDOS/quilmes_agregar_movimiento/:id
// Body: { tipo, concepto, monto, fecha, observaciones }
// ======================================================
router.post(
  "/PARTIDOS/quilmes_agregar_movimiento/:id",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo, concepto, monto, fecha, observaciones } = req.body;
      const importe = Number(monto);

      if (
        !["ingreso", "gasto"].includes(tipo) ||
        !concepto?.trim() ||
        !Number.isFinite(importe) ||
        importe <= 0
      ) {
        return res.status(400).json({
          mensaje: "Tipo, concepto e importe positivo son obligatorios",
        });
      }

      const partidos = await pool.execute(
        `SELECT p.id
         FROM partidos p
         INNER JOIN clubes c ON c.id = p.club_id
         WHERE p.id = ? AND c.nombre = 'Quilmes'`,
        [id]
      );

      if (!partidos.length) {
        return res.status(404).json({ mensaje: "Partido no encontrado" });
      }

      const resultado = await pool.execute(
        `INSERT INTO partidos_movimientos
          (partido_id, tipo,  monto, fecha, observaciones)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          tipo,
          concepto.trim(),
          importe,
          fecha || null,
          observaciones || null,
        ]
      );


res.status(201).json({
  mensaje: "Movimiento registrado correctamente",
  id: resultado.insertId.toString(),
});
    } catch (error) {
      console.error("Error agregando movimiento:", error);
      res.status(500).json({ mensaje: "Error al registrar movimiento" });
    }
  }
);

// ======================================================
// DELETE /PARTIDOS/quilmes_eliminar_partido/:id
// ======================================================
router.delete(
  "/PARTIDOS/quilmes_eliminar_partido/:id",
  async (req, res) => {
    try {
      const resultado = await pool.execute(
        `DELETE p FROM partidos p
         INNER JOIN clubes c ON c.id = p.club_id
         WHERE p.id = ? AND c.nombre = 'Quilmes'`,
        [req.params.id]
      );

      if (!resultado.affectedRows) {
        return res.status(404).json({ mensaje: "Partido no encontrado" });
      }

      res.json({ mensaje: "Partido eliminado correctamente" });
    } catch (error) {
      console.error("Error eliminando partido:", error);
      res.status(500).json({ mensaje: "Error al eliminar partido" });
    }
  }
);


// Resumen de caja

router.get("/CAJA/quilmes_resumen_caja", async (req, res) => {
  try {
    const movimientosGenerales = await pool.execute(`
      SELECT
        COALESCE(SUM(
          CASE WHEN tipo = 'cobro' THEN monto ELSE 0 END
        ), 0) AS ingresos,
        COALESCE(SUM(
          CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END
        ), 0) AS egresos
      FROM movimientos
    `);

    const movimientosPartidos = await pool.execute(`
      SELECT
        COALESCE(SUM(
          CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END
        ), 0) AS ingresos,
        COALESCE(SUM(
          CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END
        ), 0) AS egresos
      FROM partidos_movimientos
    `);

    const ingresos =
      Number(movimientosGenerales[0]?.ingresos ?? 0) +
      Number(movimientosPartidos[0]?.ingresos ?? 0);

    const egresos =
      Number(movimientosGenerales[0]?.egresos ?? 0) +
      Number(movimientosPartidos[0]?.egresos ?? 0);

   return res.json(
  convertirBigInt({
    ingresos,
    egresos,
    resultado: ingresos - egresos,
    gastos_fijos_pendientes: 0,
  })
);
  } catch (error) {
    console.error("Error obteniendo resumen de caja:", error);
    return res.status(500).json({
      mensaje: "Error al obtener el resumen de caja",
    });
  }
});


router.get("/CAJA/quilmes_listar_movimientos", async (req, res) => {
  try {
    const movimientosGenerales = await pool.execute(`
      SELECT
        m.id,
        m.monto,
        m.tipo,
        m.fecha,
        a.nombre AS actividad,
        'general' AS origen
      FROM movimientos m
      LEFT JOIN actividades a ON a.id = m.actividad_id
    `);

    const movimientosPartidos = await pool.execute(`
      SELECT
        pm.id,
        pm.monto,
        pm.tipo,
        pm.fecha,
        CONCAT('Partido vs. ', p.rival) AS actividad,
        'partido' AS origen
      FROM partidos_movimientos pm
      INNER JOIN partidos p ON p.id = pm.partido_id
      INNER JOIN clubes c ON c.id = p.club_id
      WHERE c.nombre = 'Quilmes'
    `);

    const todos = [
      ...movimientosGenerales.map((m) => ({
        ...m,
        tipo: m.tipo === "ingreso" ? "cobro" : m.tipo,
      })),
      ...movimientosPartidos.map((m) => ({
        ...m,
        tipo: m.tipo === "ingreso" ? "cobro" : m.tipo,
      })),
    ];

    todos.sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return fechaB - fechaA || Number(b.id) - Number(a.id);
    });

  return res.json(convertirBigInt(todos.slice(0, 20)));
  } catch (error) {
    console.error("Error listando movimientos de caja:", error);
    return res.status(500).json({
      mensaje: "Error al listar los movimientos",
    });
  }
});


export default router;