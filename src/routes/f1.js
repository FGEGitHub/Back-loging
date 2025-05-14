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
router.get('/traerpartidos', async (req, res) => {
 

  const productosdeunapersona = await pool.query('select * from partidos join (select id as idc, nombre as nombrecancha, barrio from canchas) as sel on partidos.cancha=sel.idc order by id desc')
res.json(productosdeunapersona)

})

router.post("/modificarganancia", (req, res) => {
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