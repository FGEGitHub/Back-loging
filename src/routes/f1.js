const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database4')
const multer = require('multer')
const path = require('path')
const fse = require('fs').promises;
const fs = require('fs');


const storage = multer.diskStorage({
  destination: path.join(__dirname, '../imagenesvendedoras'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


router.post("/crearpartido", async (req, res) => {
  try {
    const {
      usuario_id,
      cancha,
      barrio,
      ciudad,
      fecha,
      hora,
      tipo,
      cupo,
      nivel,
      tipofutbol,
      sebusca
    } = req.body;
console.log(   usuario_id,
      cancha,
      barrio,
      ciudad,     
      fecha,
      hora,
      tipo,
      cupo,
      nivel,
      tipofutbol,
      sebusca)
    let cancha_id = cancha;

    if (barrio && ciudad) {
      // Es una nueva cancha
      const insertCancha = await pool.query(
        "INSERT INTO canchas (nombre, barrio, ciudad) VALUES (?, ?, ?)",
        [cancha, barrio, ciudad]
      );
      cancha_id = insertCancha.insertId;
    }

    // Valores por defecto si no están definidos
    const nivelDef = nivel ?? "Sin especificar";
    const tipofutbolDef = tipofutbol ?? "Futbol 5";
    const sebuscaDef = sebusca ?? "Jugadores";

    // Crear partido
    await pool.query(
      `INSERT INTO partidos 
      (id_creador, cancha, fecha, hora, tipo, cupo, nivel, tipofutbol, sebusca) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, cancha_id, fecha, hora, tipo, cupo, nivelDef, tipofutbolDef, sebuscaDef]
    );

    res.status(200).json({ message: "Partido creado con éxito" });

  } catch (error) {
    console.error("Error al crear partido:", error);
    res.status(500).json({ error: "Error interno al crear el partido" });
  }
});



router.get('/traermovimientos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_movimientos join(select id as idp, id_usuario as idusuario,producto from esme_productos) as sel on esme_movimientos.id_producto=sel.idp where idusuario=? order by id desc', [id])
res.json(productosdeunapersona)

})

router.get('/traercanchas', async (req, res) => {
 

  const productosdeunapersona = await pool.query('select * from canchas order by nombre')
res.json(productosdeunapersona)

})
router.post('/traerpartidos', async (req, res) => {
  const { id_usuario } = req.body;
console.log(id_usuario)
  try {
    // Traer todos los partidos con datos de cancha y usuario creador
    const partidos = await pool.query(`
      SELECT 
        p.*, 
        c.nombre AS nombrecancha, 
        c.barrio,
        u.usuario,
        s.estado AS estado_sumada
      FROM partidos p
      JOIN canchas c ON p.cancha = c.id
      JOIN usuarios u ON p.id_creador = u.id
      LEFT JOIN sumadas s ON s.id_partido = p.id AND s.id_solicitante = ?
      ORDER BY p.id DESC
    `, [id_usuario || 0]); // si no hay usuario, pone 0 que no va a coincidir
console.log(partidos)
    res.json(partidos);
  } catch (error) {
    console.error("Error al traer partidos:", error);
    res.status(500).json({ error: 'Error al traer partidos' });
  }
});
router.post("/sumarsepartido", async (req, res) => {
  const { id_partido, id_usuario } = req.body;

  try {
    console.log("Recibido:", id_partido, id_usuario);

    // Verificar si ya existe
    const [existe] = await pool.query(
      "SELECT * FROM sumadas WHERE id_partido = ? AND id_solicitante = ?",
      [id_partido, id_usuario]
    );

    if (existe.length > 0) {
      return res.status(400).json({ mensaje: "Ya te has unido a este partido" });
    }

    // Si no existe, insertamos
    await pool.query(
      "INSERT INTO sumadas (id_partido, id_solicitante) VALUES (?, ?)",
      [id_partido, id_usuario]
    );

    res.status(200).json({ mensaje: "Solicitud enviada correctamente" });
  } catch (error) {
    console.error("Error al insertar en sumadas:", error);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});



router.post("/modificarganancia",async (req, res) => {
  const { id, ganancia } = req.body;

  if (!id || ganancia === undefined) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const query = "UPDATE usuarios SET trabajo = ? WHERE id = ?";
  pool.query(query, [ganancia, id], (err, result) => {
    if (err) {
      console.error("Error al modificar ganancia:", err);
      return res.status(500).json({ error: "Error al modificar ganancia" });
    }

    res.json("Ganancia actualizada correctamente");
  });
});
module.exports = router