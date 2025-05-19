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


router.post("/traernotificaciones", async (req, res) => {
  const { id} = req.body;

  try {
    console.log("Recibido:", id);

    // Verificar si ya existe
    const existe = await pool.query(
      "SELECT * FROM sumadas  join ( select id as idp, id_creador  from partidos) as sel on sumadas.id_partido=idp WHERE id_creador = ? AND estado = ?",
      [id, "solicitado"]
    );


  
    res.status(200).json([existe]);
  } catch (error) {
    console.error("Error al insertar en sumadas:", error);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});


router.post("/traersolicitudes", async (req, res) => {
  const { id} = req.body;

  try {
  

    // Verificar si ya existe
    const existe = await pool.query(
      "SELECT * FROM sumadas  join ( select id as idp, id_creador  from partidos) as sel on sumadas.id_partido=idp join (select id as idu, nombre as nombresol, posicion, apodo from usuarios )as sel2 on sumadas.id_solicitante=sel2.idu WHERE id_creador = ? ",
      [id]
    );


  
    res.status(200).json([existe]);
  } catch (error) {
    console.error("Error al insertar en sumadas:", error);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});
// Confirmar solicitud
router.post('/confirmar', async (req, res) => {
  const { id_solicitud } = req.body;
  try {
    await pool.query('UPDATE sumadas SET estado = ? WHERE id = ?', ['confirmado', id_solicitud]);
    res.status(200).json({ message: 'Solicitud confirmada' });
  } catch (error) {
    console.error('Error al confirmar:', error);
    res.status(500).json({ error: 'Error al confirmar solicitud' });
  }
});

// Rechazar solicitud
router.post('/rechazar', async (req, res) => {
  const { id_solicitud } = req.body;
  try {
    await pool.query('UPDATE sumadas SET estado = ? WHERE id = ?', ['rechazado', id_solicitud]);
    res.status(200).json({ message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error al rechazar:', error);
    res.status(500).json({ error: 'Error al rechazar solicitud' });
  }
});

// Reestablecer estado (pendiente o solicitado)
router.post('/marcarPendiente', async (req, res) => {
  const { id_solicitud, nuevo_estado } = req.body;

  

  try {
    await pool.query('UPDATE sumadas SET estado = ? WHERE id = ?', ["solicitado", id_solicitud]);
    res.status(200).json({ message: `Solicitud restablecida a ${nuevo_estado}` });
  } catch (error) {
    console.error('Error al restablecer:', error);
    res.status(500).json({ error: 'Error al restablecer solicitud' });
  }
});



router.post('/traerJugadores', async (req, res) => {
  const { id } = req.body;
  try {
   respuesta =  await pool.query('select * from usuarios')
    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error al confirmar:', error);
    res.status(500).json({ error: 'Error al confirmar solicitud' });
  }
});



router.post('/traerJugador', async (req, res) => {
  const { id_usuario } = req.body;
  try {
   respuesta =  await pool.query('select * from usuarios where id=?',[id_usuario])
    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error al confirmar:', error);
    res.status(500).json({ error: 'Error al confirmar solicitud' });
  }
});



router.post('/modificarJugador', async (req, res) => {
  const {
    id,
    nombre,
    apellido,
    dni,
    telefono,
    dias_disponibles,
    horarios_disponibles,
    es_pago,
  } = req.body;

  console.log(id, nombre, apellido, dni, telefono, dias_disponibles, horarios_disponibles, es_pago);

  try {
    // Obtener datos actuales del usuario
    const [usuarioActual] = await pool.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (!usuarioActual.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = usuarioActual[0];

    // Usar valores nuevos si están en req.body, si no usar los existentes
    const nuevoNombre = nombre ?? usuario.nombre;
    const nuevoApellido = apellido ?? usuario.apellido;
    const nuevoDni = dni ?? usuario.dni;
    const nuevoTelefono = telefono ?? usuario.telefono;
    const nuevosDias = dias_disponibles ?? usuario.dias;
    const nuevoHorario = horarios_disponibles ?? usuario.horario;
    const nuevoPago = es_pago !== undefined
      ? es_pago === true || es_pago === "true"
        ? "Sí"
        : "No"
      : usuario.es_pago;

    await pool.query(
      `UPDATE usuarios 
       SET nombre = ?, apellido = ?, dni = ?, telefono = ?, dias_disponibles = ?, horarios_disponibles = ?, es_pago = ?
       WHERE id = ?`,
      [
        nuevoNombre,
        nuevoApellido,
        nuevoDni,
        nuevoTelefono,
        JSON.stringify(nuevosDias),
        nuevoHorario,
        nuevoPago,
        id
      ]
    );

    res.json({ message: 'Usuario actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
});




module.exports = router