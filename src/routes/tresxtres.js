import express from "express";
const router = express.Router();
import pool from "../database.js";
import {
  isLoggedIn,
  isLoggedInn,
  isLoggedInn2,
  isLoggedInn4
} from "../lib/auth.js";
router.post("/equipo", async (req, res) => {
  const { equipo, jugadores } = req.body;

  if (!equipo || !jugadores || jugadores.length < 3) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const dnis = jugadores.map(j => j.dni);

    // 🔎 Buscar DNIs existentes
    const existentes = await connection.query(
      `SELECT j.dni, e.nombre AS equipo
       FROM jugadores j
       JOIN equipos e ON j.id_equipo = e.id
       WHERE j.dni IN (?)`,
      [dnis]
    );

    if (existentes.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        error: "Algunos DNIs ya pertenecen a un equipo",
        detalle: existentes.map(e => ({
          dni: e.dni,
          equipo: e.equipo,
          mensaje: `El DNI ${e.dni} ya pertenece al equipo ${e.equipo}`
        })),
      });
    }

    // 🏀 Insertar equipo
    const equipoResult = await connection.query(
      `INSERT INTO equipos (nombre) VALUES (?)`,
      [equipo]
    );

    const idEquipo = equipoResult.insertId;

    // 👥 Insertar jugadores uno por uno
    for (const j of jugadores) {
      await connection.query(
        `INSERT INTO jugadores (nombre, apellido, dni, id_equipo)
         VALUES (?, ?, ?, ?)`,
        [j.nombre, j.apellido, j.dni, idEquipo]
      );
    }

    await connection.commit();

    res.json({
      ok: true,
      
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  } finally {
    connection.release();
  }
});

router.get("/traertorneo/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const zonas = await pool.query(
      "SELECT * FROM zonas_3x3 WHERE id_torneo = ?",
      [id]
    );

    const participaciones = await pool.query(
      "SELECT * FROM participacion_3x3 WHERE id_zona IN (?)",
      [zonas.map((z) => z.id)]
    );

    const equipos = await pool.query(
      "SELECT * FROM equipos WHERE id IN (?)",
      [participaciones.map((p) => p.id_equipo)]
    );

    // 🔥 NUEVO: traer partidos
    const partidos = await pool.query(
      "SELECT * FROM partidos_3x3 WHERE id_torneo = ?",
      [id]
    );
    res.json({
      zonas,
      participaciones,
      equipos,
      partidos, // 👈 clave
    });
  } catch (error) {
    console.error("Error en traerTorneo:", error);
    res.status(500).json({ error: "Error al traer torneo" });
  }
});

router.get("/traertablas/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const zonas = await pool.query(
      "SELECT * FROM zonas_3x3 WHERE id_torneo = ?",
      [id]
    );

    const resultado = [];

    for (const zona of zonas) {
      // 🔹 1. PARTICIPACIONES → equipos de la zona
      const participaciones = await pool.query(
        "SELECT id_equipo FROM participacion_3x3 WHERE id_zona = ?",
        [zona.id]
      );

      const equiposIds = participaciones.map((p) => p.id_equipo);

      // 🔹 2. TRAER EQUIPOS
      let equipos = [];
      if (equiposIds.length > 0) {
        equipos = await pool.query(
          "SELECT id, nombre FROM equipos WHERE id IN (?)",
          [equiposIds]
        );
      }

      const equiposMap = {};
      equipos.forEach((e) => {
        equiposMap[e.id] = e.nombre;
      });

      // 🔹 3. INICIALIZAR TABLA (aunque no haya partidos)
      const tabla = {};
      equiposIds.forEach((idEquipo) => {
        tabla[idEquipo] = {
          equipo: equiposMap[idEquipo] || "Sin nombre",
          puntos: 0,
          goles_favor: 0,
          goles_contra: 0,
          diferencia: 0,
          jugados: 0,
        };
      });

      // 🔹 4. PARTIDOS
      const partidos = await pool.query(
        "SELECT * FROM partidos_3x3 WHERE id_zona = ?",
        [zona.id]
      );

      // 🔹 5. PROCESAR PARTIDOS
      partidos.forEach((p) => {
        const g1 = Number(p.goles_1);
        const g2 = Number(p.goles_2);

        if (isNaN(g1) || isNaN(g2)) return;

        const e1 = tabla[p.id_equipo_1];
        const e2 = tabla[p.id_equipo_2];

        if (!e1 || !e2) return; // 🔥 seguridad

        e1.jugados++;
        e2.jugados++;

        e1.goles_favor += g1;
        e1.goles_contra += g2;

        e2.goles_favor += g2;
        e2.goles_contra += g1;

        if (g1 > g2) e1.puntos += 3;
        else if (g2 > g1) e2.puntos += 3;
        else {
          e1.puntos += 1;
          e2.puntos += 1;
        }
      });

      // 🔹 6. DIFERENCIA
      Object.values(tabla).forEach((e) => {
        e.diferencia = e.goles_favor - e.goles_contra;
      });

      // 🔹 7. ORDEN
      const tablaOrdenada = Object.values(tabla).sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.diferencia !== a.diferencia)
          return b.diferencia - a.diferencia;
        return b.goles_favor - a.goles_favor;
      });

      // 🔹 8. PARTIDOS FORMATEADOS
      const partidosFormateados = partidos.map((p) => ({
        equipo1: equiposMap[p.id_equipo_1] || "Equipo 1",
        equipo2: equiposMap[p.id_equipo_2] || "Equipo 2",
        goles1: p.goles_1,
        goles2: p.goles_2,
      }));

      resultado.push({
        zona: zona.nombre || `Zona ${zona.id}`,
        tabla: tablaOrdenada,
        partidos: partidosFormateados,
      });
    }

    // 🔥 ÚLTIMO PARTIDO GLOBAL
    let ultimoPartido = null;

    const ultimo = await pool.query(
      "SELECT * FROM partidos_3x3 WHERE id_torneo = ? ORDER BY id DESC LIMIT 1",
      [id]
    );

    if (ultimo.length > 0) {
      const p = ultimo[0];

      const equipos = await pool.query(
        "SELECT id, nombre FROM equipos WHERE id IN (?, ?)",
        [p.id_equipo_1, p.id_equipo_2]
      );

      const map = {};
      equipos.forEach((e) => (map[e.id] = e.nombre));

      ultimoPartido = {
        equipo1: map[p.id_equipo_1],
        equipo2: map[p.id_equipo_2],
        goles1: p.goles_1,
        goles2: p.goles_2,
      };
    }

    res.json({
      zonas: resultado,
      ultimoPartido,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en tablas" });
  }
});



router.post("/guardarpartido", async (req, res) => {
  try {
    const {
      id_torneo,
      id_zona,
      id_equipo_1,
      id_equipo_2,
      goles_1,
      goles_2,
    } = req.body;

    if (
      !id_torneo ||
      !id_zona ||
      !id_equipo_1 ||
      !id_equipo_2
    ) {
      return res.status(400).json({
        error: "Faltan datos obligatorios",
      });
    }

    // 🔥 IMPORTANTE: contemplar A vs B y B vs A
    const partidoExistente = await pool.query(
      `
      SELECT * FROM partidos_3x3
      WHERE id_torneo = ?
      AND id_zona = ?
      AND (
        (id_equipo_1 = ? AND id_equipo_2 = ?)
        OR
        (id_equipo_1 = ? AND id_equipo_2 = ?)
      )
      LIMIT 1
      `,
      [
        id_torneo,
        id_zona,
        id_equipo_1,
        id_equipo_2,
        id_equipo_2,
        id_equipo_1,
      ]
    );

    if (partidoExistente.length > 0) {
      // 🔥 UPDATE
      const partido = partidoExistente[0];

      await pool.query(
        `
        UPDATE partidos_3x3
        SET goles_1 = ?, goles_2 = ?
        WHERE id = ?
        `,
        [
          goles_1 || 0,
          goles_2 || 0,
          partido.id,
        ]
      );

      return res.json({
        message: "Partido actualizado",
      });
    }

    // 🔥 INSERT
    await pool.query(
      `
      INSERT INTO partidos_3x3 
      (id_torneo, id_zona, id_equipo_1, id_equipo_2, goles_1, goles_2)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        id_torneo,
        id_zona,
        id_equipo_1,
        id_equipo_2,
        goles_1 || 0,
        goles_2 || 0,
      ]
    );

    res.json({
      message: "Partido creado",
    });

  } catch (error) {
    console.error("Error al guardar partido:", error);
    res.status(500).json({ error: "Error al guardar partido" });
  }
});


router.get("/equipos-con-jugadores", async (req, res) => {
  const equipos = await pool.query("SELECT * FROM equipos");
  const jugadores = await pool.query("SELECT * FROM jugadores");

  const resultado = equipos.map((eq) => ({
    ...eq,
    jugadores: jugadores.filter(j => j.id_equipo == eq.id)
  }));
  res.json(resultado);
});


router.get("/traertorneos", async (req, res) => {
  const torneos = await pool.query("SELECT * FROM torneos");

  res.json(torneos);
});

router.post("/torneos", async (req, res) => {
  const { nombre, zonas } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Crear torneo
    const torneoResult = await connection.query(
      "INSERT INTO torneos (nombre) VALUES (?)",
      [nombre]
    );

    const idTorneo = torneoResult.insertId;

    // 2. Crear zonas + guardar equipos
    for (let i = 0; i < zonas.length; i++) {
      const zona = zonas[i];

      // crear zona
      const zonaResult = await connection.query(
        "INSERT INTO zonas_3x3 (nombre, id_torneo) VALUES (?, ?)",
        [zona.nombre, idTorneo]
      );

      const idZona = zonaResult.insertId;

      // 3. insertar equipos en la zona
      for (let j = 0; j < zona.equipos.length; j++) {
        const equipo = zona.equipos[j];

        await connection.query(
          "INSERT INTO participacion_3x3 (id_equipo, id_zona) VALUES (?, ?)",
          [equipo.id, idZona]
        );
      }
    }

    await connection.commit();

    res.json({
      ok: true,
  
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "Error al crear torneo completo" });
  } finally {
    connection.release();
  }
});



export default router;