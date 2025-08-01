const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database4')
const multer = require('multer')
const path = require('path')
const fse = require('fs').promises;
const fs = require('fs');

////solicitado== se suma al partido
////convocado,= s enevia a un juagdor la invitacion
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

router.get('/traerligas', async (req, res) => {
 

  const productosdeunapersona = await pool.query('select * from ligas order by nombre')
 
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
    const existe = await pool.query(
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


/////postularse a un equipo
router.post("/convocarajugador", async (req, res) => {
  const {
    jugador_id,
    convocador_id,
    fecha,
    hora,
    mensaje,
    pagar,
    gratis,
    cancha,
    nueva_cancha_info
  } = req.body;

  try {
    let cancha_id = cancha;

    if (
      nueva_cancha_info &&
      nueva_cancha_info.nombre &&
      nueva_cancha_info.barrio &&
      nueva_cancha_info.ciudad
    ) {
      const insertCancha = await pool.query(
        "INSERT INTO canchas (nombre, barrio, ciudad) VALUES (?, ?, ?)",
        [
          nueva_cancha_info.nombre,
          nueva_cancha_info.barrio,
          nueva_cancha_info.ciudad
        ]
      );
      cancha_id = insertCancha.insertId;
    }

   

    const id_partido = insertPartido.insertId;

    // INSERT en sumadas
    await pool.query(
      `INSERT INTO sumadas 
      (id_partido, id_solicitante, estado, fecha_solicitud) 
      VALUES (?, ?, ?, NOW())`,
      [
        id_partido,
        jugador_id,
        'convocado'
      ]
    );

    console.log("Datos registrados:", {
      id_partido,
      jugador_id,
      convocador_id,
      fecha,
      hora,
      mensaje,
      pagar,
      gratis,
      cancha_id,
      nueva_cancha_info
    });

    res.json({ status: "ok", id_partido });

  } catch (error) {
    console.error("Error al convocar jugador:", error);
    res.status(500).json({ error: "Error interno" });
  }
});



router.post("/convocarajugadordirecto", async (req, res) => {
  const {
    jugador_id,
    convocador_id,
    fecha,
    hora,
    mensaje,
    pagar,
    gratis,
    cancha,
    nueva_cancha_info
  } = req.body;

  try {
        console.log('convocado')
    let cancha_id = cancha;
    console.log('a')
    // Si envían nueva cancha => insertarla
    if (
      nueva_cancha_info &&
      nueva_cancha_info.nombre &&
      nueva_cancha_info.barrio &&
      nueva_cancha_info.ciudad
    ) {
      const insertCancha = await pool.query(
        "INSERT INTO canchas (nombre, barrio, ciudad) VALUES (?, ?, ?)",
        [
          nueva_cancha_info.nombre,
          nueva_cancha_info.barrio,
          nueva_cancha_info.ciudad
        ]
      );
      cancha_id = insertCancha.insertId;
    }

    // Insertar convocatoria directa

    await pool.query(
      `INSERT INTO convocatoria_directa 
      (estado, jugador_id, convocador_id, mensaje, fecha, hora, fecha_solicitud) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        'convocado', // valor para columna 'convocatoria_directacol'
        jugador_id,
        convocador_id,
        mensaje || '',
        fecha || '',
        hora || ''
      ]
    );

    console.log("Datos registrados en convocatoria_directa:", {
      jugador_id,
      convocador_id,
      fecha,
      hora,
      mensaje,
      pagar,
      gratis,
      cancha_id,
      nueva_cancha_info
    });

    res.json({ status: "ok" });

  } catch (error) {
    console.error("Error al registrar convocatoria directa:", error);
    res.status(500).json({ error: "Error interno" });
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

const directas = await pool.query(
      "SELECT * FROM convocatoria_directa  join (select id as idp, nombre, apodo from usuarios) as sel on convocatoria_directa.convocador_id=sel.idp WHERE jugador_id = ? AND estado = ?",
      [id, "convocado"]
    );
  
    res.status(200).json([existe,directas]);
  } catch (error) {
    console.error("Error al insertar en sumadas:", error);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});




router.post("/responderconvocatoriadirecta", async (req, res) => {
  const { id, respuesta } = req.body;

  // Validar la respuesta
  const nuevoEstado = respuesta === 'aceptar' ? 'Aceptado' :
                      respuesta === 'rechazar' ? 'Rechazado' :
                      null;

  if (!nuevoEstado) {
    return res.status(400).json({ error: "Respuesta inválida" });
  }

  try {
    await pool.query(
      "UPDATE convocatoria_directa SET estado = ? WHERE id = ?",
      [nuevoEstado, id]
    );

    res.json({ mensaje: `Convocatoria actualizada como ${nuevoEstado}` });
  } catch (error) {
    console.error('Error al actualizar convocatoria directa:', error);
    res.status(500).json({ error: "Error al actualizar convocatoria directa" });
  }
});


router.post("/traersolicitudes", async (req, res) => {
  const { id} = req.body;

  try {
  

    // Verificar si ya existe
  const existe = await pool.query(
      "SELECT * FROM sumadas  join ( select id as idp, id_creador  from partidos) as sel on sumadas.id_partido=idp join (select id as idu, nombre as nombresol, posicion, apodo, fecha_nacimiento, no_pago_cancha,me_sumo_disponible,es_pago  from usuarios )as sel2 on sumadas.id_solicitante=sel2.idu WHERE id_creador = ? ",
      [id]

      
    );

const existedirectas = await pool.query(
      "SELECT * FROM convocatoria_directa join (select id as idconcovado, nombre as nombreconvocado, apodo from usuarios)as sel on convocatoria_directa.jugador_id=sel.idconcovado WHERE jugador_id = ? or convocador_id = ? ",[id,id]

      
    );
  
    res.status(200).json([existe,existedirectas]);
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

////
router.post("/cancelarconvocatoria", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM convocatoria_directa WHERE id = ?", [id]);
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error al cancelar convocatoria:", error);
    res.status(500).json({ error: "Error al cancelar convocatoria" });
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
    apodo,
    telefono,
    dias_disponibles,
    horarios_disponibles,
    es_pago,
    no_pago_cancha,
    me_sumo_disponible,
    monto_a_cobrar // ✅ nuevo campo
  } = req.body;

  console.log("ID del jugador:", id);

  const toSiNo = (valor, actual) => {
    if (valor === undefined) return actual;
    return valor === true || valor === "true" ? "Si" : "No";
  };

  try {
    const usuarioActual = await pool.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (!usuarioActual.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = usuarioActual[0];

    const nuevoNombre = nombre ?? usuario.nombre;
    const nuevoApodo = apodo ?? usuario.apodo;
    const nuevoTelefono = telefono ?? usuario.telefono;
    const nuevosDias = dias_disponibles ?? usuario.dias_disponibles;
    const nuevoHorario = horarios_disponibles ?? usuario.horarios_disponibles;

    const nuevoPago = toSiNo(es_pago, usuario.es_pago);
    const nuevoNoPagoCancha = toSiNo(no_pago_cancha, usuario.no_pago_cancha);
    const nuevoMeSumoDisponible = toSiNo(me_sumo_disponible, usuario.me_sumo_disponible);

    const nuevoMontoACobrar = monto_a_cobrar !== undefined
      ? monto_a_cobrar
      : usuario.monto_a_cobrar;

    const diasParaGuardar = Array.isArray(nuevosDias)
      ? JSON.stringify(nuevosDias)
      : JSON.stringify([]);

    await pool.query(
      `UPDATE usuarios 
       SET nombre = ?, apodo = ?, telefono = ?, dias_disponibles = ?, horarios_disponibles = ?, 
           es_pago = ?, no_pago_cancha = ?, me_sumo_disponible = ?, monto_a_cobrar = ?
       WHERE id = ?`,
      [
        nuevoNombre,
        nuevoApodo,
        nuevoTelefono,
        diasParaGuardar,
        nuevoHorario,
        nuevoPago,
        nuevoNoPagoCancha,
        nuevoMeSumoDisponible,
        nuevoMontoACobrar,
        id
      ]
    );

    res.json({ message: 'Usuario actualizado correctamente', id });

  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
});






module.exports = router