import express from "express";
const router = express.Router();

import pool from "../database7.js";
import cron from "node-cron";
import axios from "axios";
import * as cheerio from "cheerio";
import { clav } from "../keys.js";



cron.schedule("32 6-14 * * 1-5", async () => {
  try {
    console.log("Iniciando actualización de expedientes...");

    const expedientes = await pool.query(`
      SELECT
        id,
        anio,
        letra,
        numero,
        ultimomovimiento,
        fecha_ultimo_cambio
      FROM expedientes
    `);

    const listaExpedientes = expedientes;

    for (const expediente of listaExpedientes) {
      const url =
        `https://sistemas.ciudaddecorrientes.gov.ar/consulta/resultado.php?` +
        `lugar=1&anio=${expediente.anio}` +
        `&letra=${expediente.letra}` +
        `&orden=${expediente.numero}` +
        `&codigo=${clav}`;

      try {
        console.log(`Consultando: ${url}`);

        const respuesta = await axios.get(url);
        const $ = cheerio.load(respuesta.data);

        let iniciador = "";
        let extracto = "";

        $("h5").each((i, el) => {
          const texto = $(el).text().trim();

          if (texto.includes("Iniciador:")) {
            iniciador = texto.replace("Iniciador:", "").trim();
          }

          if (texto.includes("Extracto:")) {
            extracto = texto.replace("Extracto:", "").trim();
          }
        });

        const tabla = $("table.table.table-bordered").first();

        if (!tabla.length) {
          console.log(
            `Expediente ${expediente.id}: no se encontró la tabla`
          );
          continue;
        }

        const filas = tabla.find("tbody tr");

        console.log(
          `Expediente ${expediente.id}: ${filas.length} movimientos encontrados`
        );

        // ==========================
        // ÚLTIMO MOVIMIENTO
        // ==========================

        let ultimoMovimiento = null;

        if (filas.length > 0) {
          const primeraFila = $(filas[0]);
          const columnasActual = primeraFila.find("td");

          if (columnasActual.length >= 3) {
            ultimoMovimiento = columnasActual.eq(2).text().trim();
          }
        }

        // ==========================
        // CONTROL DE CAMBIOS
        // ==========================

        let fechaUltimoCambio =
          expediente.fecha_ultimo_cambio;

        let diasSinMovimiento = 0;

        const movimientoCambio =
          expediente.ultimomovimiento !== ultimoMovimiento;

        if (movimientoCambio) {
          fechaUltimoCambio = new Date();
          diasSinMovimiento = 0;

          console.log(
            `Expediente ${expediente.id}: CAMBIÓ movimiento`
          );
        } else {
          if (fechaUltimoCambio) {
            const hoy = new Date();

            diasSinMovimiento = Math.floor(
              (hoy - new Date(fechaUltimoCambio)) /
              (1000 * 60 * 60 * 24)
            );
          }

          console.log(
            `Expediente ${expediente.id}: sin cambios hace ${diasSinMovimiento} días`
          );
        }

        // ==========================
        // ACTUALIZAR EXPEDIENTE
        // ==========================

        await pool.query(
          `
          UPDATE expedientes
          SET
            iniciador = ?,
            extracto = ?,
            ultimomovimiento = ?,
            fecha_ultimo_cambio = ?,
            dias_sin_movimiento = ?
          WHERE id = ?
          `,
          [
            iniciador,
            extracto,
            ultimoMovimiento,
            fechaUltimoCambio,
            diasSinMovimiento,
            expediente.id,
          ]
        );


        // ==========================
        // MOVIMIENTOS
        // ==========================

      // ==========================
// MOVIMIENTOS
// ==========================

for (let i = filas.length - 1; i >= 0; i--) {
  const columnas = $(filas[i]).find("td");

  if (columnas.length < 3) {
    continue;
  }

  const fecha = columnas.eq(0).text().trim();
  const origen = columnas.eq(1).text().trim();
  const destino = columnas.eq(2).text().trim();

  let diasEnArea = null;

  if (columnas.length >= 4) {
    diasEnArea =
      columnas.eq(3).text().trim() || null;
  }

  const existe = await pool.query(
    `
    SELECT
      id,
      fecha_sistema,
      dias_sistema
    FROM movimientos
    WHERE id_expediente = ?
      AND fecha = ?
      AND origen = ?
      AND destino = ?
    `,
    [
      expediente.id,
      fecha,
      origen,
      destino,
    ]
  );

  const registros = existe;

  // ==========================
  // INSERTAR MOVIMIENTO NUEVO
  // ==========================

  if (registros.length === 0) {

    await pool.query(
      `
      INSERT INTO movimientos
      (
        id_expediente,
        fecha,
        origen,
        destino,
        dias,
        fecha_sistema,
        dias_sistema
      )
      VALUES
      (
        ?, ?, ?, ?, ?,
        NOW(),
        0
      )
      `,
      [
        expediente.id,
        fecha,
        origen,
        destino,
        diasEnArea,
      ]
    );

    console.log(
      `Movimiento agregado expediente ${expediente.id}`
    );

  } else {

    // Solo actualizamos el dato que viene del scraping
    await pool.query(
      `
      UPDATE movimientos
      SET dias = ?
      WHERE id = ?
      `,
      [
        diasEnArea,
        registros[0].id,
      ]
    );
  }
}

// ===================================================
// ACTUALIZAR DIAS_SISTEMA SOLO DEL MOVIMIENTO ACTUAL
// (PRIMERA FILA DE LA TABLA)
// ===================================================

if (filas.length > 0) {

  const primeraFila = $(filas[0]);
  const columnasActual = primeraFila.find("td");

  if (columnasActual.length >= 3) {

    const fechaActual =
      columnasActual.eq(0).text().trim();

    const origenActual =
      columnasActual.eq(1).text().trim();

    const destinoActual =
      columnasActual.eq(2).text().trim();

    const movimientoActual =
      await pool.query(
        `
        SELECT
          id,
          fecha_sistema
        FROM movimientos
        WHERE id_expediente = ?
          AND fecha = ?
          AND origen = ?
          AND destino = ?
        LIMIT 1
        `,
        [
          expediente.id,
          fechaActual,
          origenActual,
          destinoActual,
        ]
      );

    if (movimientoActual.length > 0) {

      let fechaSistema =
        movimientoActual[0].fecha_sistema;

      // Si no tiene fecha_sistema, la inicializamos hoy
      if (!fechaSistema) {

        fechaSistema = new Date();

        await pool.query(
          `
          UPDATE movimientos
          SET fecha_sistema = ?
          WHERE id = ?
          `,
          [
            fechaSistema,
            movimientoActual[0].id,
          ]
        );
      }

      const hoy = new Date();

      const diasSistema = Math.floor(
        (
          hoy.getTime() -
          new Date(fechaSistema).getTime()
        ) /
        (1000 * 60 * 60 * 24)
      );

      await pool.query(
        `
        UPDATE movimientos
        SET dias_sistema = ?
        WHERE id = ?
        `,
        [
          diasSistema,
          movimientoActual[0].id,
        ]
      );

      console.log(
        `Movimiento activo ${destinoActual} - ${diasSistema} días`
      );
    }
  }
}

        console.log(
          `Expediente ${expediente.id} procesado correctamente`
        );
      } catch (error) {
        console.error(
          `Error expediente ${expediente.id}:`,
          error.message
        );
      }
    }

    console.log("Actualización finalizada");
  } catch (error) {
    console.error(error);
  }
});


router.get('/traerexpedientes', async (req, res) => {
  try {
    const expedientes = await pool.query(`
      SELECT
        id,
        titulo,
        anio,
        letra,
        numero,
        iniciador,
        extracto,
        ultimomovimiento
      FROM expedientes
      ORDER BY anio DESC, numero DESC
    `);

    const movimientos = await pool.query(`
      SELECT
        id,
        id_expediente,
        origen,
        destino,
        fecha,
        dias
      FROM movimientos
      ORDER BY id DESC
    `);

    const resultado = expedientes.map(exp => {
      const movimientosExp = movimientos
        .filter(mov => mov.id_expediente == exp.id)
        .sort((a, b) => b.id - a.id);

      return {
        ...exp,
        dias:
          movimientosExp.length > 0
            ? movimientosExp[0].dias
            : 0,
        movimientos: movimientosExp
      };
    });

    res.json(resultado);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al obtener expedientes'
    });
  }
});

export default router;