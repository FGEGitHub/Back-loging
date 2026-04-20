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