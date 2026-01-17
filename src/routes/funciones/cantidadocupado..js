import pool from "../../database.js";

export async function cantidadcategoriaporcurso(
  categoria,
  id_curso,
  porcentaje_creiterio,
  id_turno
) {
  let haylugar = true;

  // Personas anotadas en ese turno y categoría
  const cursado = await pool.query(
    "SELECT * FROM cursado WHERE id_turno = ? AND categoria = ?",
    [id_turno, categoria]
  );

  // Cupo real del curso (cantidad de turnos * 44)
  let cuporeal = await pool.query(
    "SELECT * FROM turnos WHERE id_curso = ?",
    [id_curso]
  );

  cuporeal = cuporeal.length * 44; // ⚠️ cambiar a 25 si corresponde

  // Validación por porcentaje
  if ((cuporeal * porcentaje_creiterio) / 100 < cursado.length + 1) {
    haylugar = false;
  } else {
    // Validación por límite absoluto del turno
    const curs = await pool.query(
      `SELECT *
       FROM cursado
       JOIN (SELECT id AS idturno FROM turnos) t
         ON cursado.id_turno = t.idturno
       WHERE cursado.id_turno = ?`,
      [id_turno]
    );

    if (curs.length >= 44) {
      haylugar = false;
    }
  }

  return haylugar;
}
