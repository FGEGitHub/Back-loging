const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const { parse, startOfWeek, format } = require('date-fns');
const { es } = require('date-fns/locale');
const multer = require('multer')
const path = require('path')
const fse = require('fs').promises;
const fs = require('fs');
const moment = require('moment-timezone');
const xlsx = require('xlsx');
const xml2js = require('xml2js');
const cron = require('node-cron');
const kmlFilePath = path.join(__dirname, '../maps/mapadtc.kml');
const kmlFilePath2 = path.join(__dirname, '../maps/entregas.kml');


 ////////////whatapweb
 const qrcode = require('qrcode-terminal');
 const { Client, LocalAuth } = require('whatsapp-web.js');
 const puppeteer = require('puppeteer-core');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Agregar estos argumentos
    },
    // Si necesitas especificar la ruta del navegador, puedes agregar la opción executablePath:
    // executablePath: '/path/to/your/chrome',
});
 // Crear el cliente con LocalAuth para guardar la sesión

 
 client.on('qr', (qr) => {
     qrcode.generate(qr, { small: true });
     console.log('Escanea el código QR con tu aplicación de WhatsApp.');
 });
 
 client.on('ready', () => {
     console.log('¡Cliente de WhatsApp listo y sesión guardada!');
 });
 
 client.on('authenticated', () => {
     console.log('Sesión autenticada.');
 });
 
 client.on('auth_failure', (message) => {
     console.error('Fallo de autenticación: ', message);
 });
 
 client.on('disconnected', (reason) => {
     console.log('Cliente desconectado:', reason);
 });
 
 //
 //client.initialize();
    ////////////whatapweb
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../imagenesvendedoras'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


// Función para convertir un número serial de Excel en una fecha legible
function convertirFechaExcel(fechaExcel) {
  const fechaBase = new Date(1900, 0, 1);
  return new Date(fechaBase.getTime() + (fechaExcel - 1) * 24 * 60 * 60 * 1000);
}

// Función para convertir fechas en formato texto (dd-mm-aaaa)
function convertirFechaTexto(fechaTexto) {
  const [dia, mes, año] = fechaTexto.split('-');
  const fecha = new Date(`${año}-${mes}-${dia}`);
  return isNaN(fecha.getTime()) ? null : fecha; // Verificar si la fecha es válida
}



router.get('/cargar-excel', async (req, res) => {

  rutaImagen = path.join(__dirname, './leer.xlsx');
  const workbook = xlsx.readFile(rutaImagen);
  const sheet_name = workbook.SheetNames[0]; // Leer la primera hoja
  const worksheet = workbook.Sheets[sheet_name];

  // Convertir la hoja en un formato JSON
  const sheetData = xlsx.utils.sheet_to_json(worksheet);

  // Procesar cada fila
  sheetData.forEach((row) => {
    const apellidoNombre = row['APELLIDO Y NOMBRE'] || ''; // Columna APELLIDO Y NOMBRE
    let fechaNac = row['FECHA NAC'] || ''; // Columna FECHA NACIMIENTO
    let fechaEsperaEval = row['TURNO ASIGNADO'] || ''; // Columna FECHA ESPERA EVALUACION
    console.log(row['TURNO ASIGNADO'])
    console.log(row['fecha_espera_evaluacion'])
    let fechaEsperadesde = row['fecha_espera_evaluacion'] || ''; // Columna FECHA ESPERA EVALUACION
    const dni = row['DNI'] || 'sin datos'; // Columna DNI
    const telefono =row['TELEFONO'] || 'sin datos';
    // Separar la primera palabra (apellido) y el resto (nombre)
    const [apellido, ...nombreArray] = apellidoNombre.split(' ');
    const nombre = nombreArray.join(' ') || 'sin datos';

    // Verificar si la fecha de nacimiento está vacía
    if (fechaNac === '') {
      fechaNac = 'sin datos';
    } else {
      // Verificar si la fecha es un número serial de Excel o texto
      if (typeof fechaNac === 'number') {
        fechaNac = convertirFechaExcel(fechaNac).toISOString().split('T')[0]; // Formato 'aaaa-mm-dd'
      } else if (typeof fechaNac === 'string') {
        const fechaConvertida = convertirFechaTexto(fechaNac);
        fechaNac = fechaConvertida ? fechaConvertida.toISOString().split('T')[0] : 'sin datos';
      }
    }

    // Verificar si la fecha de espera evaluación está vacía
    // Verificar si la fecha de espera evaluación está vacía
/*     if (fechaEsperaEval === '') {
      fechaEsperaEval = 'sin datos';
    } else {
      // Verificar si la fecha es un número serial de Excel o texto
      if (typeof fechaEsperaEval === 'number') {
        fechaEsperaEval = convertirFechaExcel(fechaEsperaEval).toISOString().split('T')[0]; // Formato 'aaaa-mm-dd'
      } else if (typeof fechaEsperaEval === 'string') {
        const fechaConvertida = convertirFechaTexto(fechaEsperaEval);
        fechaEsperaEval = fechaConvertida ? fechaConvertida.toISOString().split('T')[0] : 'sin datos';
      }
    }
     */
    if (fechaEsperadesde === '') {
      fechaEsperadesde = 'sin datos';
    } else {
      // Verificar si la fecha es un número serial de Excel o texto
      if (typeof fechaEsperadesde === 'number') {
        fechaEsperadesde = convertirFechaExcel(fechaEsperadesde).toISOString().split('T')[0]; // Formato 'aaaa-mm-dd'
      } else if (typeof fechaEsperadesde === 'string') {
        const fechaConvertida = convertirFechaTexto(fechaEsperadesde);
        fechaEsperadesde = fechaConvertida ? fechaConvertida.toISOString().split('T')[0] : 'sin datos';
      }
    }
    // Mostrar en consola los resultados
    console.log('Apellido:', apellido || 'sin datos');
    console.log('Nombre:', nombre || 'sin datos');
    console.log('Fecha de Nacimiento:', fechaNac);
    console.log('Fecha de Espera Evaluación:', fechaEsperaEval);
    console.log('Fecha turno:', fechaEsperaEval);
    console.log('DNI:', dni);
    console.log('telefono:', telefono);
    
    // Insertar en la base de datos
    const query = `
      INSERT INTO cadia_chicos (apellido, nombre, fecha_nacimiento, fecha_espera_evaluacion, dni, telefono,fecha_evaluacion)
      VALUES (?, ?, ?, ?, ?, ?,?)
    `;

    const values = [
      apellido || 'sin datos',
      nombre || 'sin datos',
      fechaNac,
      fechaEsperadesde,
      dni,
      telefono,
      fechaEsperaEval
    ];

    pool.query(query, values, (error, results) => {
      if (error) {
        console.error('Error al insertar en la base de datos:', error);
      } else {
        console.log('Fila insertada correctamente:', results);
      }
    });
  });

  res.send('Los datos del archivo Excel han sido procesados correctamente e insertados en la base de datos.');
});



router.get('/act-excel', async (req, res) => {

  rutaImagen = path.join(__dirname, './leer.xlsx');
  const workbook = xlsx.readFile(rutaImagen);
  const sheet_name = workbook.SheetNames[0]; // Leer la primera hoja
  const worksheet = workbook.Sheets[sheet_name];

  // Convertir la hoja en un formato JSON
  const sheetData = xlsx.utils.sheet_to_json(worksheet);

  // Procesar cada fila
  sheetData.forEach((row) => {
    const apellidoNombre = row['APELLIDO Y NOMBRE'] || ''; // Columna APELLIDO Y NOMBRE
    let fechaNac = row['FECHA NAC'] || ''; // Columna FECHA NACIMIENTO
    let fechaEsperaEval = row['fecha_espera_evaluacion'] || ''; // Columna FECHA ESPERA EVALUACION
    const dni = row['DNI'] || 'sin datos'; // Columna DNI
    const telefono =row['TELEFONO'] || 'sin datos';
    // Separar la primera palabra (apellido) y el resto (nombre)
    const [apellido, ...nombreArray] = apellidoNombre.split(' ');
    const nombre = nombreArray.join(' ') || 'sin datos';

    // Verificar si la fecha de nacimiento está vacía
    if (fechaNac === '') {
      fechaNac = 'sin datos';
    } else {
      // Verificar si la fecha es un número serial de Excel o texto
      if (typeof fechaNac === 'number') {
        fechaNac = convertirFechaExcel(fechaNac).toISOString().split('T')[0]; // Formato 'aaaa-mm-dd'
      } else if (typeof fechaNac === 'string') {
        const fechaConvertida = convertirFechaTexto(fechaNac);
        fechaNac = fechaConvertida ? fechaConvertida.toISOString().split('T')[0] : 'sin datos';
      }
    }

    // Verificar si la fecha de espera evaluación está vacía
    if (fechaEsperaEval === '') {
      fechaEsperaEval = 'sin datos';
    } else {
      // Verificar si la fecha es un número serial de Excel o texto
      if (typeof fechaEsperaEval === 'number') {
        fechaEsperaEval = convertirFechaExcel(fechaEsperaEval).toISOString().split('T')[0]; // Formato 'aaaa-mm-dd'
      } else if (typeof fechaEsperaEval === 'string') {
        const fechaConvertida = convertirFechaTexto(fechaEsperaEval);
        fechaEsperaEval = fechaConvertida ? fechaConvertida.toISOString().split('T')[0] : 'sin datos';
      }
    }

    // Mostrar en consola los resultados
    console.log('Apellido:', apellido || 'sin datos');
    console.log('Nombre:', nombre || 'sin datos');
    console.log('Fecha de Nacimiento:', fechaNac);
    console.log('Fecha de Espera Evaluación:', fechaEsperaEval);
    console.log('DNI:', dni);
    console.log('telefono:', telefono);
    
    // Insertar en la base de datos
    const query = `
      INSERT INTO cadia_chicos (apellido, nombre, fecha_nacimiento, fecha_espera_evaluacion, dni, telefono)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      apellido || 'sin datos',
      nombre || 'sin datos',
      fechaNac,
      fechaEsperaEval,
      dni,
      telefono
    ];

    pool.query(query, values, (error, results) => {
      if (error) {
        console.error('Error al insertar en la base de datos:', error);
      } else {
        console.log('Fila insertada correctamente:', results);
      }
    });
  });

  res.send('Los datos del archivo Excel han sido procesados correctamente e insertados en la base de datos.');
});





router.get('/tablaprestacionesa/:id', async (req, res) => {
  let id = req.params.id
  try {
    const clas = await pool.query(' select * from  dtc_prestacion_inventario join(select id as ida, nombre, detalle as detallee from dtc_inventario) as sel on dtc_prestacion_inventario.id_inventario=sel.ida where id_inventario=? ', [id])
    res.json([clas])
  } catch (error) {
    console.log(error)
    res.json('Error')
  }


})

router.get('/traerclasesprof/:id', async (req, res) => {
  let id = req.params.id
  try {
    const clas = await pool.query(' select * from  cadia_clases_prof  where idtallerista=? ORDER BY id_clase DESC', [id])
    env = []
    for (iii in clas){
      can = await pool.query('select * from dtc_asistencia_clase where id_clase=?',[clas[iii]['id_clase']])
      nuev={
        id:clas[iii]['id_clase'],
        fecha:clas[iii]['fecha'],
        titulo:clas[iii]['titulo'],
        descripcion:clas[iii]['descripcion'],
        id_tallerista:clas[iii]['id_tallerista'],
        cantidad:can.length
      }
      env.push(nuev)
    }

    console.log(env)
    res.json(env)
  } catch (error) {
    console.log(error)
    res.json('Error')
  }


})


router.get('/traerclasestallercadia/:id', async (req, res) => {
  let id = req.params.id
  try {
    const clas = await pool.query(' select * from  cadia_clases_prof  where idtallerista=? ORDER BY id_clase DESC', [id])
    env = []
    for (iii in clas){
      can = await pool.query('select * from cadia_asitencia_clases where id_clase=?',[clas[iii]['id_clase']])
      nuev={
        id:clas[iii]['id_clase'],
        fecha:clas[iii]['fecha'],
        titulo:clas[iii]['titulo'],
        descripcion:clas[iii]['descripcion'],
        id_tallerista:clas[iii]['idtallerista'],
        cantidad:can.length
      }
      env.push(nuev)
    }


    res.json(env)
  } catch (error) {
    console.log(error)
    res.json('Error')
  }


})




router.get('/traerclasestaller/:id', async (req, res) => {
  let id = req.params.id
  try {
    const clas = await pool.query(' select * from  dtc_clases_taller  where id_tallerista=? ORDER BY id DESC', [id])
    env = []
    for (iii in clas){
      can = await pool.query('select * from dtc_asistencia_clase where id_clase=?',[clas[iii]['id']])
      nuev={
        id:clas[iii]['id'],
        fecha:clas[iii]['fecha'],
        titulo:clas[iii]['titulo'],
        dia:clas[iii]['dia'],
        hora:clas[iii]['hora'],
        descripcion:clas[iii]['descripcion'],
        id_tallerista:clas[iii]['id_tallerista'],
        cantidad:can.length
      }
      env.push(nuev)
    }

    
    res.json(env)
  } catch (error) {
    console.log(error)
    res.json('Error')
  }


})

router.post('/clasificarturno/', async (req, res) => {
  let {id , estado} = req.body
  console.log(id , estado)
   try {
     await pool.query(' UPDATE dtc_turnos SET presente=? where id=?', [estado,id])
 
 
   } catch (error) {
     console.log(error)
     res.json('no realizado')
   }
 
   res.json('realizado')
 })
 router.post('/clasificarturnocadia/', async (req, res) => {
  let {id , estado} = req.body
  console.log(id , estado)
   try {
     await pool.query(' UPDATE cadia_turnos SET presente=? where id=?', [estado,id])
 
 
   } catch (error) {
     console.log(error)
     res.json('no realizado')
   }
 
   res.json('realizado')
 })
router.get('/sumar1/:id', async (req, res) => {
 let id = req.params.id
  try {
    await pool.query(' UPDATE dtc_asistencia SET racion = racion + 1 where id=?', [id])


  } catch (error) {
    console.log(error)

  }

  res.json('')
})

router.get('/sumar1p/:id', async (req, res) => {
  id = req.params.id
  try {
    await pool.query(' UPDATE dtc_asistencia SET premerienda = premerienda + 1 where id=?', [id])


  } catch (error) {
    console.log(error)

  }

  res.json('')
})



router.get('/restar1/:id', async (req, res) => {
  id = req.params.id
  try {
    await pool.query(' UPDATE dtc_asistencia SET racion = racion - 1 where id=?', [id])



  } catch (error) {
    console.log(error)
  }
  res.json('')

})
router.get('/restar1p/:id', async (req, res) => {
  id = req.params.id
  try {
    await pool.query(' UPDATE dtc_asistencia SET premerienda = premerienda - 1 where id=?', [id])



  } catch (error) {
    console.log(error)
  }
  res.json('')

})
router.get('/clasesdetaller/:id', async (req, res) => {
  id = req.params.id
  console.log(id)
  const clases = await pool.query('select fecha,id_tallerista, count(fecha) from dtc_asistencia where id_tallerista=? group by fecha,id_tallerista', [id])

  const resultadosConvertidos = clases.map(resultado => ({
    fecha: resultado.fecha,
    count: Number(resultado['count(fecha)']) // Convertir BigInt a Number
  }));

  console.log(resultadosConvertidos)

  res.json(resultadosConvertidos)
})




router.get('/listaexpedientes/', async (req, res) => {

  const chiques = await pool.query('select * from dtc_expedientes ')

  res.json([chiques, 0])
})

router.get('/listadepersonaspsiq/', async (req, res) => {
  try {
    const chiques = await pool.query(`
      SELECT 
        dtc_personas_psicologa.*, 
        COALESCE(sel.cantidadturnos, 0) AS cantidadturnos 
      FROM 
        dtc_personas_psicologa 
      LEFT JOIN (
        SELECT 
          id_persona, 
          COUNT(id_persona) AS cantidadturnos 
        FROM 
          dtc_turnos 
        GROUP BY 
          id_persona
      ) AS sel 
      ON dtc_personas_psicologa.id = sel.id_persona 
      ORDER BY 
        cantidadturnos desc, apellido 
    `);

    // Convierte BigInt a número o cadena
    const chiquesFormatted = chiques.map(row => {
      return {
        ...row,
        cantidadturnos: typeof row.cantidadturnos === 'bigint' ? Number(row.cantidadturnos) : row.cantidadturnos
      };
    });

    const env = {
      total: chiques.length,
      kid1: 5,
      kid2: 5,
      kid3: 5,
      sind: 5
    };

    res.json([chiquesFormatted, env]);
  } catch (error) {
    console.error('Error en la consulta:', error);
    res.status(500).json({ error: 'Error en la consulta a la base de datos' });
  }
});

router.get('/listadepersonasgim/', async (req, res) => {

  const chiques = await pool.query('select * from dtc_usuario_gimnasio order by apellido')

  env = {
    total: chiques.length,
    kid1: 5,
    kid2: 5,
    kid3: 5,
    sind: 5
  }
  res.json([chiques, env])
})


router.get('/listachicoscadiaespera/', async (req, res) => {
  try {
    const chiques = await pool.query(`
      SELECT 
      id,
        CONCAT(apellido, ' ', nombre) AS apellido_nombre, 
        fecha_nacimiento, 
        fecha_espera_evaluacion, 
        dni, 
        telefono
      FROM cadia_chicos
      WHERE fecha_espera_evaluacion <> "No"
      ORDER BY fecha_espera_evaluacion, apellido
    `);

    const env = {
      total: chiques.length,
    };

    res.json([chiques, env]);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).send('Error al obtener los datos.');
  }
});



router.get('/listachicoscadia/', async (req, res) => {

  const chiques = await pool.query('select * from cadia_chicos order by fecha_espera,apellido')

  env = {
    total: chiques.length,
  
  }
  res.json([chiques, env])
})




router.get('/listainventario/', async (req, res) => {
  try {
    // Obtener todos los datos de la tabla 'dtc_chicos'
    const chiques = await pool.query('SELECT * FROM dtc_inventario  ');
   /// recorrer todo  y poner por cada uno prestaicon_inventario esado activo
   let enviar=[]
     for (aux in chiques){
        let prestaciones = await pool.query('select * from dtc_prestacion_inventario where id_inventario=?',[chiques[aux]['id']])
      nuevo={
        id:chiques[aux]['id'],
        detalle:chiques[aux]['detalle'],
        nombre:chiques[aux]['nombre'],
        stock:chiques[aux]['stock'],
        prestadas:prestaciones.length


      }
enviar.push(nuevo)
     }
    res.json([enviar,
      {
        total: chiques.length,
        kid1:2,
        kid2:3,
        kid3:4,
        
      }
    ]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la lista de chiques' });
  }
});

router.get('/listachiques/', async (req, res) => {
  try {
    // Obtener todos los datos de la tabla 'dtc_chicos'
    const chiques = await pool.query('SELECT * FROM dtc_chicos ORDER BY apellido');

    // Mapear los resultados para agregar el campo 'falta' y calcular la edad
    const chiquesConFalta = chiques.map(chique => {
      // Calcular la edad
      const calcularEdad = (fechaNacimiento) => {
        const hoy = new Date();
        const [anio, mes, dia] = fechaNacimiento.split('-');
        let edad = hoy.getFullYear() - anio;
        const mesActual = hoy.getMonth() + 1; // Los meses en JavaScript son 0-11
        const diaActual = hoy.getDate();

        if (mesActual < mes || (mesActual === mes && diaActual < dia)) {
          edad--;
        }
        return edad;
      };

      const edad = calcularEdad(chique.fecha_nacimiento);

      // Lista de campos requeridos
      const requiredFields = {
        dni: 'DNI',
        tel_responsable: 'Teléfono Responsable',
        escuela: 'Escuela',
        grado: 'Grado',
        dato_escolar: 'Dato Escolar',
        fecha_nacimiento: 'Fecha de Nacimiento',
        domicilio: 'Domicilio'
      };

      // Verificar los campos que faltan
      const faltantes = Object.keys(requiredFields).filter(field => !chique[field] || chique[field].trim() === '');

      // Crear el campo 'falta' con la lista de campos faltantes o "Completo"
      const falta = faltantes.length > 0 ? faltantes.map(field => requiredFields[field]).join(', ') : 'Completo';

      return { ...chique, falta, edad };
    });

    // Obtener el conteo de cada grupo específico (si es necesario)
    const kid1 = chiques.filter(chique => chique.kid === 'kid1').length;
    const kid2 = chiques.filter(chique => chique.kid === 'kid2').length;
    const kid3 = chiques.filter(chique => chique.kid === 'kid3').length;
    const sind = chiques.filter(chique => !['kid1', 'kid2', 'kid3'].includes(chique.kid)).length;

    // Enviar la respuesta con la lista modificada y los datos adicionales
  
    res.json([chiquesConFalta,
      {
        total: chiques.length,
        kid1,
        kid2,
        kid3,
        sind
      }
    ]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la lista de chiques' });
  }
});






router.get('/listachiquesparainscribir/', async (req, res) => {
  try {
    const chiques = await pool.query(`
      SELECT 
        c.id, 
        c.nombre, 
        c.apellido, 
        c.fecha_nacimiento,
        c.dni,
    
   
        CASE 
          WHEN cu.id_chico IS NOT NULL THEN TRUE 
          ELSE FALSE 
        END AS yaincripto
      FROM dtc_chicos AS c
      LEFT JOIN dtc_cursado AS cu ON c.id = cu.id_chico
      GROUP BY c.id
      ORDER BY c.apellido
    `);
console.log(chiques)
    res.json([chiques]);
  } catch (error) {
    console.error("Error al obtener la lista de chiques:", error);
    res.status(500).json({ error: "Error al obtener la lista de chiques" });
  }
});




router.get('/listachiquesmomentaneo/', async (req, res) => {
  try {
    const calcularEdad = (fechaNacimiento) => {
      const hoy = new Date();
      const [anio, mes, dia] = fechaNacimiento.split('-');
      let edad = hoy.getFullYear() - anio;
      const mesActual = hoy.getMonth() + 1;
      const diaActual = hoy.getDate();

      if (mesActual < mes || (mesActual === mes && diaActual < dia)) {
        edad--;
      }
      return edad;
    };

    // Lista de campos requeridos (sin duplicados)
    const requiredFields = {
      dni: 'DNI',
      tel_responsable: 'Teléfono Responsable',
      escuela: 'Escuela',
      grado: 'Grado',
      domicilio: 'Domicilio',
      dato_escolar: 'Dato Escolar',
      fecha_nacimiento: 'Fecha de Nacimiento'
    };

    // Obtener datos de la tabla principal
    const chiques = await pool.query('SELECT * FROM dtc_chicos ORDER BY apellido');

    // Calcular campo 'falta' y 'edad' para cada chico
    const chiquesConFalta = chiques.map(chique => {
      const faltantes = Object.keys(requiredFields).filter(field => {
        const value = chique[field];
        return !value || value.trim() === '' || value.trim().toLowerCase() === 'sin determinar';
      });

      const falta = faltantes.length > 0 
        ? faltantes.map(field => requiredFields[field]).join(', ') 
        : 'Completo';
      
      const edad = calcularEdad(chique.fecha_nacimiento);

      return { ...chique, falta, edad };
    });

    // Obtener datos de asistencia
    const fechasUnicas = await pool.query('SELECT DISTINCT fecha FROM dtc_asistencia ORDER BY fecha');
    const convertirFecha = (fecha) => {
      const [dia, mes, anio] = fecha.split('-').map(Number);
      return new Date(anio, mes - 1, dia);
    };

    const fechasClasesUnicas = fechasUnicas.map(row => convertirFecha(row.fecha)).sort((a, b) => a - b);

    const chiquesMomentaneo = [];
    for (const chico of chiquesConFalta) {
      const asistenciasChico = await pool.query(
        'SELECT fecha FROM dtc_asistencia WHERE id_usuario = ? ORDER BY fecha',
        [chico.id]
      );

      const fechasAsistencias = asistenciasChico.map(row => convertirFecha(row.fecha));
      fechasAsistencias.sort((a, b) => a - b);

      const primeraAsistencia = fechasAsistencias[0]
        ? `${fechasAsistencias[0].getDate()}-${fechasAsistencias[0].getMonth() + 1}-${fechasAsistencias[0].getFullYear()}`
        : null;

      const fechasDesdePrimeraAsistencia = fechasClasesUnicas.filter(fecha => 
        fechasAsistencias[0] ? fecha >= fechasAsistencias[0] : false
      );

      const cantAsistencias = fechasAsistencias.length;
      const totalDiasDesdePrimeraAsistencia = fechasDesdePrimeraAsistencia.length;
      const porcentajeAsistencia = totalDiasDesdePrimeraAsistencia
        ? ((cantAsistencias / totalDiasDesdePrimeraAsistencia) * 100).toFixed(2)
        : 0;

      chiquesMomentaneo.push({
        ...chico,
        primer_asis: primeraAsistencia,
        cant_asist: cantAsistencias,
        total_asis: totalDiasDesdePrimeraAsistencia,
        porcentajeasis: `${porcentajeAsistencia}%`
      });
    }

    // Generar estadísticas
    const estadisticas = {};
    let total = 0;
    for (const chico of chiquesConFalta) {
      const key = chico.kid === 'Sin definir' ? 'sin_definir' : chico.kid;
      estadisticas[key] = (estadisticas[key] || 0) + 1;
      total++;
    }
    estadisticas.total = total;

    // Responder con los datos fusionados
    res.json([chiquesMomentaneo, estadisticas]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al procesar los datos definitivos' });
  }
});



router.get('/traermapa', (req, res) => {
  const kmlFilePath = path.join(__dirname, '../maps/mapadtc.kml');

  fs.readFile(kmlFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al leer el archivo KML.' });
    }
    res.type('application/vnd.google-earth.kml+xml'); // Especificar el tipo MIME de KML
    res.send(data);
  });
});

router.post('/actualizarmapa', async (req, res) => {
  const { updatedKml } = req.body;

  if (!updatedKml) {
    return res.status(400).json({ error: 'No se proporcionó contenido para el archivo KML.' });
  }

  try {
    // Leer el archivo KML actual
    const currentKml = await fs.promises.readFile(kmlFilePath, 'utf8');
    
    // Parsear el contenido KML existente
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();

    const currentKmlObject = await parser.parseStringPromise(currentKml);
    const newKmlObject = await parser.parseStringPromise(updatedKml);

    // Insertar el nuevo marcador en el archivo existente
    if (!currentKmlObject.kml.Document[0].Placemark) {
      currentKmlObject.kml.Document[0].Placemark = [];
    }
    currentKmlObject.kml.Document[0].Placemark.push(newKmlObject.kml.Document[0].Placemark[0]);

    // Convertir el KML actualizado a cadena
    const updatedKmlContent = builder.buildObject(currentKmlObject);

    // Guardar el archivo actualizado
    await fs.promises.writeFile(kmlFilePath, updatedKmlContent, 'utf8');

    res.status(200).json({ message: 'Archivo KML actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar el archivo KML:', error);
    res.status(500).json({ error: 'Error al actualizar el archivo KML.' });
  }
});


router.post('/borrarpuntoenmapa',async (req, res) => {
  const { lat, lng } = req.body;
  console.log(req.body)

  // Leer el archivo KML
  fs.readFile(kmlFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Error al leer el archivo KML' });
    }

    // Parsear el contenido del archivo KML a un objeto JS
    xml2js.parseString(data, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al parsear el archivo KML' });
      }

      // Acceder a los puntos en el archivo KML
      const placemarks = result.kml.Document[0].Placemark;
      let puntoEliminado = false;

      // Buscar y eliminar el punto por latitud y longitud
      for (let i = 0; i < placemarks.length; i++) {
        const point = placemarks[i].Point[0].coordinates[0].split(',');
        const pointLat = parseFloat(point[1].trim());
        const pointLng = parseFloat(point[0].trim());

        if (pointLat === lat && pointLng === lng) {
          // Eliminar el punto
          placemarks.splice(i, 1);
          puntoEliminado = true;
          break;
        }
      }

      if (!puntoEliminado) {
        return res.status(404).json({ message: 'Punto no encontrado' });
      }

      // Volver a convertir el objeto JS a KML
      const builder = new xml2js.Builder();
      const updatedKml = builder.buildObject(result);

      // Escribir el archivo KML actualizado
      fs.writeFile(kmlFilePath, updatedKml, 'utf8', (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error al escribir el archivo KML' });
        }
        res.status(200).json({ message: 'Punto eliminado exitosamente' });
      });
    });
  });
});

/////////////////////////////entregas


router.get('/traermapaentregas', (req, res) => {
  const kmlFilePath2 = path.join(__dirname, '../maps/mapadtc.kml');

  fs.readFile(kmlFilePath2, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al leer el archivo KML.' });
    }
    res.type('application/vnd.google-earth.kml+xml'); // Especificar el tipo MIME de KML
    res.send(data);
  });
});

router.post('/actualizarmapaentregas', async (req, res) => {
  const { updatedKml } = req.body;

  if (!updatedKml) {
    return res.status(400).json({ error: 'No se proporcionó contenido para el archivo KML.' });
  }

  try {
    // Leer el archivo KML actual
    const currentKml = await fs.promises.readFile(kmlFilePath2, 'utf8');
    
    // Parsear el contenido KML existente
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();

    const currentKmlObject = await parser.parseStringPromise(currentKml);
    const newKmlObject = await parser.parseStringPromise(updatedKml);

    // Insertar el nuevo marcador en el archivo existente
    if (!currentKmlObject.kml.Document[0].Placemark) {
      currentKmlObject.kml.Document[0].Placemark = [];
    }
    currentKmlObject.kml.Document[0].Placemark.push(newKmlObject.kml.Document[0].Placemark[0]);

    // Convertir el KML actualizado a cadena
    const updatedKmlContent = builder.buildObject(currentKmlObject);

    // Guardar el archivo actualizado
    await fs.promises.writeFile(kmlFilePath2, updatedKmlContent, 'utf8');

    res.status(200).json({ message: 'Archivo KML actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar el archivo KML:', error);
    res.status(500).json({ error: 'Error al actualizar el archivo KML.' });
  }
});



router.post('/borrarpuntoenmapentregas', async (req, res) => {
  const { lat, lng } = req.body;
  console.log('Coordenadas recibidas:', lat, lng);

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitud y longitud son requeridas' });
  }

  try {
    // Leer el archivo KML
    const data = fs.readFileSync(kmlFilePath2, 'utf8');
    console.log('Archivo KML leído con éxito.');

    // Parsear el contenido del archivo KML a un objeto JS
    const result = await xml2js.parseStringPromise(data);
    console.log('Archivo KML parseado exitosamente.');

    // Acceder a los puntos en el archivo KML
    const placemarks = result.kml.Document[0].Placemark || [];
    console.log(`Placemarks antes de la eliminación: ${placemarks.length}`);

    let puntoEliminado = false;

    // Buscar y eliminar el punto por latitud y longitud
    for (let i = placemarks.length - 1; i >= 0; i--) { // Iterar al revés para evitar problemas al eliminar
      const point = placemarks[i].Point[0].coordinates[0].split(',');
      const pointLat = parseFloat(point[1].trim());
      const pointLng = parseFloat(point[0].trim());

      if (pointLat === parseFloat(lat) && pointLng === parseFloat(lng)) {
        console.log('Eliminando Placemark:', JSON.stringify(placemarks[i], null, 2));
        placemarks.splice(i, 1); // Elimina el `Placemark` completo
        puntoEliminado = true;
      }
    }

    if (!puntoEliminado) {
      return res.status(404).json({ message: 'Punto no encontrado' });
    }

    console.log(`Placemarks después de la eliminación: ${placemarks.length}`);

    // Volver a convertir el objeto JS a KML
    const builder = new xml2js.Builder();
    const updatedKml = builder.buildObject(result);

    // Escribir el archivo KML actualizado
    fs.writeFileSync(kmlFilePath2, updatedKml, 'utf8');
    console.log('Archivo KML actualizado y guardado con éxito.');

    return res.status(200).json({ message: 'Punto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al procesar el archivo KML:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

///////////////////finamapas entrgas

router.get('/datosdechiquecadia/:id', async (req, res) => {
  const id = req.params.id
  const chiques = await pool.query('select * from cadia_chicos where id =?', [id])
  try {
    
    res.json([chiques, "imagenBase64", ["vincuos"]])
  } catch (error) {
    console.log(error)
    res.json([])
  }

})
/* 
cursado de solo inscriptos
router.get('/obtenerinfodecursos/:id', async (req, res) => {
  id = req.params.id
  const chiques = await pool.query('SELECT dia, hora, COUNT(sel.kid) AS cantidad_kids, GROUP_CONCAT(CONCAT(sel.kid, " - ", sel.nombre, " ", sel.apellido) SEPARATOR ", ") AS nombres_kids FROM dtc_cursado JOIN (SELECT kid, nombre, apellido, id AS idc FROM dtc_chicos) AS sel ON dtc_cursado.id_chico = sel.idc WHERE id_curso = ? GROUP BY dia, hora ORDER BY FIELD(dia, "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"), hora', [id]);


  res.json(chiques.map(row => ({ 
    ...row,
    cantidad_kids: Number(row.cantidad_kids), // Convertir BigInt a número
    nombres_kids: String(row.nombres_kids) // Asegurarte de que es una cadena
  })));
}) */
  router.get('/obtenerinfodecursos/:id', async (req, res) => {
    const id = req.params.id;

    // Verificar que el ID sea válido
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de curso inválido" });
    }

    // Definir días y horarios en base al ID del curso
    const dias = ["lunes", "martes", "miércoles", "jueves", "viernes"];
    const dias307 = ["martes", "jueves", "viernes"];
    const horariosEstandar = ["14:00", "15:00", "16:00"];
    const horariosEspeciales = ["14:30", "15:30", "16:30"];
    const horario309 = ["17:00"];

    let horarios = horariosEstandar;
    let diasFiltrados = dias;

    if (id === "304") {
        horarios = horariosEspeciales;
    } else if (id === "309") {
        horarios = horario309;
    } else if (id === "307") {
        diasFiltrados = dias307;
    }

    try {
        // Obtener información del curso solicitado
        const curso = await pool.query(
            `SELECT id AS id_curso, mail AS nombre_curso, materia 
             FROM usuarios 
             WHERE id = ?`, 
            [id]
        );

        if (curso.length === 0) {
            return res.status(404).json({ error: "Curso no encontrado" });
        }

        // Generar combinaciones de días y horarios para este curso
        const combinaciones = diasFiltrados.flatMap(dia =>
            horarios.map(hora => ({
                id_curso: curso[0].id_curso,
                nombre_curso: curso[0].nombre_curso,
                dia,
                hora,
                cantidad_kids: 0,
                nombres_kids: null,
                materia: curso[0].materia
            }))
        );

        // Obtener los inscriptos del curso específico
        const chiques = await pool.query(
            `SELECT c.dia, c.hora, COUNT(sel.kid) AS cantidad_kids, 
                    GROUP_CONCAT(CONCAT(sel.kid, " - ", sel.nombre, " ", sel.apellido, " (", TIMESTAMPDIFF(YEAR, sel.fecha_nacimiento, CURDATE()), " años)") SEPARATOR ", ") AS nombres_kids 
             FROM dtc_cursado AS c
             JOIN (SELECT kid, nombre, apellido, id AS idc, fecha_nacimiento 
                   FROM dtc_chicos) AS sel 
             ON c.id_chico = sel.idc
             WHERE c.id_curso = ?
             GROUP BY c.dia, c.hora
             ORDER BY FIELD(c.dia, "lunes", "martes", "miércoles", "jueves", "viernes"), c.hora`,
            [id]
        );

        // Mapear los datos reales para fusionarlos con las combinaciones
        const datosReales = new Map(
            chiques.map(row => [`${row.dia}-${row.hora}`, row])
        );

        // Combinar datos reales con combinaciones predefinidas
        const resultados = combinaciones.map(combinacion => {
            const key = `${combinacion.dia}-${combinacion.hora}`;
            const datoReal = datosReales.get(key);

            return {
                id_curso: combinacion.id_curso,
                nombre_curso: combinacion.nombre_curso,
                dia: combinacion.dia,
                hora: combinacion.hora,
                cantidad_kids: datoReal ? Number(datoReal.cantidad_kids) : 0,
                nombres_kids: datoReal ? String(datoReal.nombres_kids) : null,
                materia: combinacion.materia
            };
        });

        res.json(resultados);
    } catch (error) {
        console.error("Error al obtener los datos de la base de datos:", error);
        res.status(500).json({ error: "Error al obtener los datos de la base de datos" });
    }
});



  
  

  router.get('/obtenerinfodecursostodos', async (req, res) => {
    const dias = ["lunes", "martes", "miércoles", "jueves", "viernes"];
    const dias307 = ["martes", "jueves", "viernes"];
    const horariosEstandar = ["14:00", "15:00", "16:00"];
    const horariosEspeciales = ["14:30", "15:30", "16:30"];
    const horario309 = ["17:00"];
  
    try {
      const cursos = await pool.query(
        `SELECT DISTINCT id AS id_curso, mail AS nombre_curso, materia 
         FROM usuarios 
         WHERE id IN (266,240, 304, 306, 265, 307, 308, 309)`
      );
  
      const combinaciones = cursos.flatMap(curso => {
        let horarios = horariosEstandar;
        let diasFiltrados = dias;
  
        if (curso.id_curso === 304) {
          horarios = horariosEspeciales;
        } else if (curso.id_curso === 309) {
          horarios = horario309;
        } else if (curso.id_curso === 307) {
          diasFiltrados = dias307;
        }
  
        return diasFiltrados.flatMap(dia =>
          horarios.map(hora => ({
            id_curso: curso.id_curso,
            nombre_curso: curso.nombre_curso,
            dia,
            hora,
            cantidad_kids: 0,
            nombres_kids: null,
            materia: curso.materia
          }))
        );
      });
  
      const chiques = await pool.query(
        `SELECT c.dia, c.hora, COUNT(sel.kid) AS cantidad_kids, 
                GROUP_CONCAT(CONCAT(sel.kid, " - ", sel.nombre, " ", sel.apellido, " (", TIMESTAMPDIFF(YEAR, sel.fecha_nacimiento, CURDATE()), " años)") SEPARATOR ", ") AS nombres_kids, 
                u.mail AS nombre_curso, u.id AS id_curso, u.materia
         FROM dtc_cursado AS c
         JOIN (SELECT kid, nombre, apellido, id AS idc, fecha_nacimiento 
               FROM dtc_chicos) AS sel 
         ON c.id_chico = sel.idc
         JOIN usuarios AS u
         ON c.id_curso = u.id
         WHERE u.id IN (266,240, 304, 306, 265, 307, 308, 309)
         GROUP BY c.dia, c.hora, u.mail, u.id, u.materia
         ORDER BY u.mail, FIELD(c.dia, "lunes", "martes", "miércoles", "jueves", "viernes"), c.hora`
      );
  
      const datosReales = new Map(
        chiques.map(row => [`${row.id_curso}-${row.dia}-${row.hora}`, row])
      );
  
      const resultados = combinaciones.map(combinacion => {
        const key = `${combinacion.id_curso}-${combinacion.dia}-${combinacion.hora}`;
        const datoReal = datosReales.get(key);
  
        return {
          id_curso: combinacion.id_curso,
          nombre_curso: combinacion.nombre_curso,
          dia: combinacion.dia,
          hora: combinacion.hora,
          cantidad_kids: datoReal ? Number(datoReal.cantidad_kids) : 0,
          nombres_kids: datoReal ? String(datoReal.nombres_kids) : null,
          materia: combinacion.materia
        };
      });
  console.log(resultados)
      res.json(resultados);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener los datos de la base de datos" });
    }
  });
  
  
  router.get('/informaciondeinscriptos', async (req, res) => {
    try {
      // Obtener la cantidad total de registros en dtc_cursado
      const totalCursado = await pool.query('SELECT COUNT(*) AS total FROM dtc_cursado');
      
      // Obtener la cantidad de chicos distintos en dtc_cursado
      const distinctChicos = await pool.query('SELECT COUNT(DISTINCT id_chico) AS total_distinct FROM dtc_cursado');
  
      // Listado de chicos con al menos una inscripción
      const chicos = await pool.query(`
        SELECT DISTINCT c.id, c.nombre, c.apellido 
        FROM dtc_chicos c
        JOIN dtc_cursado d ON c.id = d.id_chico
      `);
  
      res.json({
        total_cursado: Number(totalCursado[0].total),  // Convertimos BigInt a Number
        total_distinct_chicos: Number(distinctChicos[0].total_distinct),  // Convertimos BigInt a Number
        listado_chicos: chicos.map(chico => ({
          id: Number(chico.id),  // Convertimos BigInt a Number
          nombre: chico.nombre,
          apellido: chico.apellido
        }))
      });
    } catch (error) {
      console.error('Error al obtener información:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });
/*

router.get('/obtenerinfodecursostodos', async (req, res) => {
  // Define los días y horarios predeterminados
  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes"];
  const dias307 = ["martes", "jueves", "viernes"]; // Días específicos para el curso 307
  const horariosEstandar = ["14:00", "15:00", "16:00"];
  const horariosEspeciales = ["14:30", "15:30", "16:30"];
  const horario309 = ["17:00"]; // Horario exclusivo para el curso 309

  try {
    // Consulta los cursos filtrados por los IDs especificados
    const cursos = await pool.query(
      `SELECT DISTINCT id AS id_curso, mail AS nombre_curso, materia 
       FROM usuarios 
       WHERE id IN (266,240, 304, 306, 265, 307, 308, 309)`
    );

    // Crear una estructura auxiliar con todas las combinaciones posibles para cada curso
    const combinaciones = cursos.flatMap(curso => {
      let horarios = horariosEstandar;
      let diasFiltrados = dias;

      if (curso.id_curso === 304) {
        horarios = horariosEspeciales; // 304 tiene horarios especiales
      } else if (curso.id_curso === 309) {
        horarios = horario309; // 309 solo tiene el horario 17:00
      } else if (curso.id_curso === 307) {
        diasFiltrados = dias307; // 307 solo martes, jueves y viernes
      }

      return diasFiltrados.flatMap(dia =>
        horarios.map(hora => ({
          id_curso: curso.id_curso,
          nombre_curso: curso.nombre_curso,
          dia,
          hora,
          cantidad_kids: 0,
          nombres_kids: null,
          materia: curso.materia
        }))
      );
    });

    // Consulta los datos reales desde la base de datos
    const chiques = await pool.query(
      `SELECT c.dia, c.hora, COUNT(sel.kid) AS cantidad_kids, 
              GROUP_CONCAT(CONCAT(sel.kid, " - ", sel.nombre, " ", sel.apellido) SEPARATOR ", ") AS nombres_kids, 
              u.mail AS nombre_curso, u.id AS id_curso, u.materia
       FROM dtc_cursado AS c
       JOIN (SELECT kid, nombre, apellido, id AS idc FROM dtc_chicos) AS sel 
       ON c.id_chico = sel.idc
       JOIN usuarios AS u
       ON c.id_curso = u.id
       WHERE u.id IN (266,240, 304, 306, 265, 307, 308, 309)
       GROUP BY c.dia, c.hora, u.mail, u.id, u.materia
       ORDER BY u.mail, FIELD(c.dia, "lunes", "martes", "miércoles", "jueves", "viernes"), c.hora`
    );

    // Convertir los datos reales en un mapa clave-valor para buscar fácilmente
    const datosReales = new Map(
      chiques.map(row => [`${row.id_curso}-${row.dia}-${row.hora}`, row])
    );

    // Combinar los datos reales con las combinaciones
    const resultados = combinaciones.map(combinacion => {
      const key = `${combinacion.id_curso}-${combinacion.dia}-${combinacion.hora}`;
      const datoReal = datosReales.get(key);

      return {
        id_curso: combinacion.id_curso,
        nombre_curso: combinacion.nombre_curso,
        dia: combinacion.dia,
        hora: combinacion.hora,
        cantidad_kids: datoReal ? Number(datoReal.cantidad_kids) : 0,
        nombres_kids: datoReal ? String(datoReal.nombres_kids) : null,
        materia: combinacion.materia
      };
    });

    console.log(resultados);
    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los datos de la base de datos" });
  }
});

*/ 



router.get('/datosdechique/:id', async (req, res) => {
  const id = req.params.id
  const chiques = await pool.query('select * from dtc_chicos where id =?', [id])
  try {
    console.log(chiques[0]['foto'])
    if (chiques[0]['foto'] === null) {
      imagenBase64 = null

    } else {
      rutaImagen = path.join(__dirname, '../imagenesvendedoras', chiques[0]['foto']);
      try {
        imagenBuffer = fs.readFileSync(rutaImagen);
        imagenBase64 = imagenBuffer.toString('base64');
      } catch (error) {
        imagenBase64=null
      }

    }
    const vinculos = await pool.query('select * from dtc_vinculo join (select id as idc, nombre, apellido from dtc_chicos ) as sel on dtc_vinculo.id_vinculo=sel.idc   join (select id as idcc, nombre as nombree, apellido as apellidoo from dtc_chicos ) as sel2  on dtc_vinculo.id_usuario=sel2.idcc where id_usuario=? or id_vinculo=?', [id,id])
    
    
    const clasesinscrip = await pool.query('select * from dtc_cursado join(select id as idu, mail from usuarios ) as sel on dtc_cursado.id_curso=sel.idu where id_chico =? order by mail , dia', [id])

    res.json([chiques, imagenBase64, vinculos,clasesinscrip])
  } catch (error) {
    console.log(error)
    res.json([])
  }

})


router.get('/datosdepersonapsi/:id', async (req, res) => {
  const id = req.params.id
  const chiques = await pool.query('select * from dtc_personas_psicologa where id =?', [id])


  try {
    res.json([chiques])
  } catch (error) {
    res.json([])
  }

})
router.get('/traerasistencia/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const asis = await pool.query(
      'SELECT COUNT(usuario) AS count, usuario, idu FROM dtc_asistencia JOIN (SELECT id AS idu, usuario FROM usuarios) AS sel ON dtc_asistencia.id_tallerista = sel.idu WHERE id_usuario = ? GROUP BY usuario, idu',
      [id]
    );

    const asistaller = await pool.query(
      'SELECT COUNT(usuario) AS count, usuario, idu FROM dtc_asistencia_clase JOIN (SELECT id AS idclase, id_tallerista FROM dtc_clases_taller) AS sel8 ON dtc_asistencia_clase.id_clase = sel8.idclase JOIN (SELECT id AS idu, usuario FROM usuarios) AS sel ON sel8.id_tallerista = sel.idu WHERE id_usuario = ? GROUP BY usuario, idu',
      [id]
    );

    // Combina ambos resultados y transforma los datos
    const resultados = [...asis, ...asistaller].map((resultado) => ({
      count: Number(resultado.count), // Asegúrate de que `count` sea un número
      taller: resultado.usuario,
      id_tallerista: resultado.idu,
    }));

    // Devuelve los resultados unidos
    res.json([resultados]);
  } catch (error) {
    console.error('Error al obtener asistencia:', error);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
});

router.get('/traerfoto/:id', async (req, res) => {
  const id = req.params.id
  const productosdeunapersona = await pool.query('select * from dtc_legajos where id =?', [id])
  rutaImagen = path.join(__dirname, '../imagenesvendedoras', productosdeunapersona[0]['ubicacion']);
  imagenBase64 = ""
  console.log(productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 3] + productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 2] + productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 1])
  if (productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 3] + productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 2] + productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 1] === "pdf") {
    console.log('pdf')
    imagenBase64 = rutaImagen
    res.sendFile(rutaImagen)


  } else {
    console.log('otro')
    imagenBuffer = fs.readFileSync(rutaImagen);
    imagenBase64 = imagenBuffer.toString('base64');
    res.json([imagenBase64, productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 3] + productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 2] + productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length - 1]])

  }


})
router.get('/listadelegajos/:id', async (req, res) => {
  const id = req.params.id

  const productosdeunapersona = await pool.query('select * from dtc_legajos where id_usuario =?', [id])
  enviar = []
  //  tareas = await pool.query('select * from producto_venta where id_usuario=? ',[id])
  let rutaImagen
  /*  for (i in productosdeunapersona) {

     imagenBase64 = 'undef'
     try {
       //const workbook = XLSX.readFile(path.join(__dirname, '../Excel/' + nombre))
       rutaImagen = path.join(__dirname, '../imagenesvendedoras', productosdeunapersona[i]['ubicacion']);
       imagenBuffer = fs.readFileSync(rutaImagen);
       imagenBase64 = imagenBuffer.toString('base64');
     } catch (error) {
       console.log(error)
     }
 
     nuevo = {
       id: productosdeunapersona[i]['id'],
       id_usuario: productosdeunapersona[i]['id_usuario'],
       nombre: productosdeunapersona[i]['nombre'],
       descripcion: productosdeunapersona[i]['descripcion'],
       imagenBase64
     }
     console.log(nuevo)
 enviar.push(nuevo)
   } */
  console.log(enviar)
  res.json(productosdeunapersona);


  //  res.json(tareas)

})



router.post("/subirfotoperfil", upload.single('imagen'), async (req, res) => {

  const id = req.body.id;


  const fileName = req.file.filename;
  //// borrar del storage

  try {
    const id = req.body.id;


    const fileName = req.file.filename;
    console.log(id)
    const traerfoto = await pool.query('select * from dtc_chicos where id = ? ', [id])
    console.log(traerfoto)
    rutaImagen = path.join(__dirname, '../imagenesvendedoras', traerfoto[0]['foto']);
    console.log('rutaImagen')
    console.log(rutaImagen)
    await fse.unlink(rutaImagen);
  } catch (error) {
    console.log('error1')
    console.log(error)
  }
  /////
  try {
    await pool.query('update dtc_chicos  set foto=? where id=?', [fileName, id])
    res.json(`Realizado`)
  } catch (error) {
    console.log('error2')
    console.log(error)
    res.json('No escribiste nadaaa')
  }


})




router.post("/subirlegajo", upload.single('imagen'), async (req, res) => {

  const id = req.body.id;
  const nombre = req.body.nombre;
  const descripcion = req.body.descripcion;

  const fileName = req.file.filename;

  try {
    await pool.query('insert into dtc_legajos set nombre=?, id_usuario=?,descripcion=?,ubicacion=?', [nombre, id, descripcion, fileName])
    res.json(`Realizado`)
  } catch (error) {
    console.log(error)
    res.json('No escribiste nadaaa')
  }


})


router.post("/modificarusuariocadia", async (req, res) => {
  let { id, nombre, apellido, fecha_ingreso, fecha_nacimiento, observaciones, fecha_fin,  dni, direccion} = req.body

  try {
    if (observaciones == undefined) {
      observaciones = "Sin observaciones"
    }
    if (fecha_nacimiento == undefined) {
      fecha_nacimiento = "Sin asignar"
    }

    await pool.query('update cadia_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,dni=?,fecha_ingreso=?,fecha_fin=?,direccion=? where id=?', [nombre, apellido, fecha_nacimiento, dni,fecha_ingreso,fecha_fin,direccion, id])

    res.json('Modificado')
  } catch (error) {
    console.log(error)
    res.json('No modificado')
  }

})

router.post('/inscribiracurso', async (req, res) => {
  let { id, option, days, number } = req.body; // Obtener datos del cuerpo de la solicitud
console.log(id, option, days, number)
  try {
    if (!id || !option || !days || !number) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Mapear los días y realizar la inserción para cada uno
    const insertPromises = days.map(async (day) => {
      return await pool.query(
        'INSERT INTO dtc_cursado (id_chico, dia, hora, id_curso) VALUES (?, ?, ?, ?)',
        [id, day, number, option]
      );
    });

    await Promise.all(insertPromises); // Ejecutar todas las inserciones en paralelo

    res.json({ message: 'Inscripción realizada con éxito' });
  } catch (error) {
    console.error('Error al inscribir al curso:', error);
    res.status(500).json({ message: 'Error al inscribir al curso' });
  }
});





router.post("/modificarusuariopsiq", async (req, res) => {
  try {
    const {
      id,
      nombre,
      apellido,
      fecha_nacimiento,
      observaciones,
      primer_contacto,
      primer_ingreso,
   
      dni,
      domicilio,
      telefono,

    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "El ID es obligatorio" });
    }

    // Crear un objeto con los valores recibidos
    const datos = {
      nombre,
      apellido,
      fecha_nacimiento: fecha_nacimiento || "Sin asignar",
      observaciones: observaciones || "Sin observaciones",
      primer_contacto,
      primer_ingreso: primer_ingreso || "Sin asignar",
    
      dni: dni || "Sin asignar",
      domicilio,
      telefono: telefono || "Sin asignar",

    };

    // Filtrar los datos que no son undefined
    const columnas = Object.keys(datos).filter((key) => datos[key] !== undefined);
    const valores = columnas.map((key) => datos[key]);

    // Construir la consulta dinámica
    const setQuery = columnas.map((key) => `${key} = ?`).join(", ");
    const query = `UPDATE dtc_personas_psicologa SET ${setQuery} WHERE id = ?`;

    valores.push(id); // Agregar el ID al final de los valores

    // Ejecutar la consulta
    await pool.query(query, valores);

    res.json("Modificado");
  } catch (error) {
    console.error(error);
    res.status(500).json("No modificado");
  }
});

router.post("/modificarusuario", async (req, res) => {
  let { talle, id, nombre, apellido, kid, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, escuela, grado, fines } = req.body

  console.log(id, nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda)
  try {
    if (observaciones == undefined) {
      observaciones = "Sin observaciones"
    }
    if (fecha_nacimiento == undefined) {
      fecha_nacimiento = "Sin asignar"
    }
    if (talle == undefined) {
      talle = "Sin asignar"
    }
    await pool.query('update dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=?,kid=?,escuela=?,grado=?,fines=?,talle=? where id=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, kid, escuela, grado, fines, talle, id])

    res.json('Modificado')
  } catch (error) {
    console.log(error)
    res.json('No modificado')
  }

})



router.post("/eliminarhorario", async (req, res) => {
  let { id } = req.body

  try {


    await pool.query('delete from dtc_cursado  where id=?', [id])

    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('No Borrado')
  }

})
router.post("/borrarturnocadia", async (req, res) => {
  let { id } = req.body

  try {


    await pool.query('delete from cadia_turnos  where id=?', [id])

    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('No Borrado')
  }

})
router.post("/borrarturno", async (req, res) => {
  let { id } = req.body

  try {


    await pool.query('delete from dtc_turnos  where id=?', [id])

    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('No Borrado')
  }

})
router.post("/modificarclase", async (req, res) => {
  let { id, titulo, descripcion, fecha } = req.body

  try {


    await pool.query('update dtc_clases_taller  set  titulo=?, descripcion=?, fecha=? where id=?', [titulo, descripcion, fecha , id])

    res.json('modificado')
  } catch (error) {
    console.log(error)
    res.json('No modificado')
  }

})

router.post("/borraretapa", async (req, res) => {
  let { id } = req.body

  try {


    await pool.query('delete from dtc_etapa  where id=?', [id])

    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('No Borrado')
  }

})
router.post("/traerasistenciasdetaller", async (req, res) => {
  let { id_tallerista, id_usuario } = req.body
  let resp = await pool.query('select * from dtc_asistencia where id_tallerista=? and id_usuario=?', [id_tallerista, id_usuario])
if(resp.length==0){
  resp = await pool.query('select id, id_clase, id_usuario,sel.fecha from dtc_asistencia_clase join (select id as idc, id_tallerista,fecha from dtc_clases_taller) as sel on dtc_asistencia_clase.id_clase=sel.idc  where id_tallerista=? and id_usuario=?', [id_tallerista, id_usuario])
}


  res.json([resp])
})



router.post("/nuevapersonagim", async (req, res) => {
  let { nombre, apellido, dni, tel, direccion } = req.body
  try {
    if( direccion == undefined){
      direccion="No"
    }
    if( tel == undefined){
      tel="No"
    }
    if( tel == undefined){
      tel="No"
    }
    await pool.query('insert dtc_usuario_gimnasio  set nombre=?, apellido=?, dni=?,tel=?, direccion=? ', [nombre, apellido, dni, tel, direccion  ])

    res.json("Realizado")
  } catch (error) {
    console.log(error)
    res.json("No realizado")
  }

  
})

router.post("/nuevaprestacioninv", async (req, res) => {
  let { detalle, persona, fecha_inicio, fecha_fin,id_inventario } = req.body
  try {
    if(fecha_fin== undefined){
      fecha_fin="sin fecha"
    }
   console.log( detalle, persona, fecha_inicio, fecha_fin,id_inventario)
    await pool.query('insert dtc_prestacion_inventario  set  detalle=?, persona=?, fecha_inicio=?, fecha_fin=?,id_inventario=? ', [ detalle, persona, fecha_inicio, fecha_fin,id_inventario])

    res.json("Realizado")
  } catch (error) {
    console.log(error)
    res.json("No realizado")
  }

  
})

router.post("/agregarconsumo", async (req, res) => {
  let { id_producto, cantidad, fecha } = req.body
  try {
    if(fecha== undefined){
      fecha="sin fecha"
    }
   
   console.log(id_producto, cantidad, fecha)
    await pool.query('insert dtc_consumo  set  id_producto=?, cantidad=?, fecha=? ', [ id_producto, cantidad, fecha])

    res.json("Realizado")
  } catch (error) {
    console.log(error)
    res.json("No realizado")
  }

  
})


router.post("/nuevoexpediente", async (req, res) => {
  let { titulo, inicio, cierre, detalle } = req.body
  try {
    if( cierre == undefined){
      cierre="No"
    }
    await pool.query('insert dtc_expedientes  set titulo=?, inicio=?, cierre=?, detalle=? ', [titulo, inicio, cierre, detalle ])

    res.json("Realizado")
  } catch (error) {
    console.log(error)
    res.json("No realizado")
  }

  
})

router.post("/nuevochiquecadia", async (req, res) => {
  let { fecha_espera,nombre, apellido, fecha_nacimiento, kid, observaciones, fecha_fin, primer_contacto, primer_ingreso, fecha_ingreso, dni, direccion, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, escuela, grado, fines } = req.body

  try {
    console.log(fecha_espera)
    if (observaciones == undefined) {
      observaciones = "Sin observaciones"
    }
    if (fecha_espera == undefined) {
      fecha_espera = "No"
    }
    if (fecha_nacimiento == undefined) {
      fecha_nacimiento = "Sin asignar"
    }
    if (fecha_ingreso == undefined) {
      fecha_ingreso = "Sin asignar"
    }
    if (direccion == undefined) {
      direccion = "Sin asignar"
    }
    if (fecha_fin == undefined) {
      fecha_fin = "Sin asignar"
    }
    if (dni == "Sin determinar") {
      await pool.query('insert cadia_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,dni=?,fecha_ingreso=?,fecha_fin=?,direccion=?,fecha_espera=?', [nombre, apellido,fecha_nacimiento, dni,fecha_ingreso,fecha_fin,direccion,fecha_espera])

      res.json('Agregado')
    } else {
      const yahay = await pool.query('select * from dtc_chicos where dni=?', [dni])
      if (yahay.length > 0) {
        res.json('Error, dni ya tegistrado')
      } else {
        await pool.query('insert cadia_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,dni=?,fecha_ingreso=?,fecha_fin=?,direccion=?,fecha_espera=?', [nombre, apellido, fecha_nacimiento, dni,fecha_ingreso,fecha_fin,direccion,fecha_espera])

        res.json('Agregado')
      }

    }


  } catch (error) {
    console.log(error)
    res.json('No agregado')
  }

})



router.post("/nuevochique", async (req, res) => {
  let { nombre, apellido, fecha_nacimiento, kid, observaciones, talle, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, escuela, grado, fines } = req.body

  try {
    if (observaciones == undefined) {
      observaciones = "Sin observaciones"
    }
    if (fecha_nacimiento == undefined) {
      fecha_nacimiento = "Sin asignar"
    }
    if (talle == undefined) {
      talle = "Sin asignar"
    }
    if (dni == "Sin determinar") {
      await pool.query('insert dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=?,escuela=?,grado=?,fines=?,kid=?,talle=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, escuela, grado, fines, kid, talle])

      res.json('Agregado')
    } else {
      const yahay = await pool.query('select * from dtc_chicos where dni=?', [dni])
      if (yahay.length > 0) {
        res.json('Error, dni ya tegistrado')
      } else {
        await pool.query('insert dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=?,escuela=?,grado=?,fines=?,talle=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, escuela, grado, fines, talle])

        res.json('Agregado')
      }

    }


  } catch (error) {
    console.log(error)
    res.json('No agregado')
  }

})



router.post("/nuevaclaseprof", async (req, res) => {
  let { id_tallerista, fecha, titulo } = req.body
  console.log(id_tallerista, fecha, titulo)
  try {
    await pool.query('insert cadia_clases_prof  set idtallerista=?, fecha=?,titulo=?', [id_tallerista, fecha, titulo])

    res.json("realizado")
  } catch (error) {
    console.log(error)
    res.json('no realizado')
  }

})

router.post("/nuevaclasetaller", async (req, res) => {
  let { id_tallerista, fecha, titulo } = req.body
  console.log(id_tallerista, fecha, titulo)
  try {
    await pool.query('insert dtc_clases_taller  set id_tallerista=?, fecha=?,titulo=?', [id_tallerista, fecha, titulo])

    res.json("realizado")
  } catch (error) {
    console.log(error)
    res.json('no realizado')
  }

})
router.post("/nuevapersonapsiq", async (req, res) => {
  let { nombre, apellido, fecha_nacimiento, observaciones, primer_ingreso, dni, domicilio, telefono } = req.body
  console.log(nombre, apellido, fecha_nacimiento, observaciones, primer_ingreso, dni, domicilio, telefono)

  try {
    if (observaciones == undefined) {
      observaciones = "Sin observaciones"
    }
    if (fecha_nacimiento == undefined) {
      fecha_nacimiento = "Sin asignar"
    }
    if (dni == undefined) {
      dni = "Sin asignar"
    }
    if (telefono == undefined) {
      telefono = "Sin asignar"
    }

    await pool.query('insert dtc_personas_psicologa  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_ingreso=?,dni=?,domicilio=?,telefono=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_ingreso, dni, domicilio, telefono])

    res.json('Agregado')
  } catch (error) {
    console.log(error)
    res.json('No agregado')
  }

})


router.post("/borraractividadchicocadia", async (req, res) => {
  const { id } = req.body

  try {
    await pool.query('delete  from  cadia_informes where id = ?', [id])
    res.json('Realizado')

  } catch (error) {
    console.log(error)
    res.json('No realizado')
  }


})


router.post("/borraractividadchico", async (req, res) => {
  const { id } = req.body

  try {
    await pool.query('delete  from  dtc_actividades_chicos where id = ?', [id])
    res.json('Realizado')

  } catch (error) {
    console.log(error)
    res.json('No realizado')
  }


})

router.post("/borraractividad", async (req, res) => {
  const { id } = req.body

  try {
    await pool.query('delete  from  dtc_actividades where id = ?', [id])
    res.json('Realizado')

  } catch (error) {
    console.log(error)
    res.json('No realizado')
  }


})


router.post("/borrarinformeps", async (req, res) => {
  const { id } = req.body;

  try {
    // Obtener la ubicación del archivo desde la base de datos
    const result = await pool.query('SELECT ubicacion FROM dtc_informes_psic WHERE id = ?', [id]);

    if (result.length > 0) {
      const archivoUbicacion = result[0].ubicacion;

      // Construir la ruta completa del archivo
      let filePath = ''

      try {
         filePath = path.join(__dirname, '../imagenesvendedoras', archivoUbicacion);

      } catch (error) {
        
      }

      // Intentar eliminar el archivo del sistema de archivos si existe
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Archivo eliminado:', filePath);
      } else {
        console.log('El archivo no existe:', filePath);
      }

      // Eliminar la entrada de la base de datos
      await pool.query('DELETE FROM dtc_informes_psic WHERE id = ?', [id]);

      res.json('Realizado');
    } else {
      res.json('No se encontró la entrada para el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al borrar la actividad social:', error);
    res.json('No realizado');
  }
});


router.post("/borrarcosa", async (req, res) => {
  const { id } = req.body;

  try {
    // Obtener la ubicación del archivo desde la base de datos
    const result = await pool.query('SELECT ubicacion FROM dtc_cosas_usuario WHERE id = ?', [id]);

    if (result.length > 0) {
      const archivoUbicacion = result[0].ubicacion;

      // Construir la ruta completa del archivo
      let filePath = ''

      try {
         filePath = path.join(__dirname, '../imagenesvendedoras', archivoUbicacion);

      } catch (error) {
        
      }

      // Intentar eliminar el archivo del sistema de archivos si existe
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Archivo eliminado:', filePath);
      } else {
        console.log('El archivo no existe:', filePath);
      }

      // Eliminar la entrada de la base de datos
      await pool.query('DELETE FROM dtc_cosas_usuario WHERE id = ?', [id]);

      res.json('Realizado');
    } else {
      res.json('No se encontró la entrada para el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al borrar la actividad social:', error);
    res.json('No realizado');
  }
});



router.get('/traerarcchivoo/:id',async (req, res) => {
  const id = req.params.id;
  console.log(`ID recibido: ${id}`); // Muestra el ID recibido en la consola

  // Consulta SQL para obtener la ruta del archivo en función del id
  const query = 'SELECT id, ubicacion FROM dtc_cosas_usuario WHERE id = ?';
  try {
    const query2 = await pool.query('SELECT id, ubicacion FROM dtc_cosas_usuario WHERE id = ?',[id])
    const filePath = path.join(__dirname, '../imagenesvendedoras', query2[0].ubicacion);
        console.log('Ruta del archivo:', filePath); // Muestra la ruta completa del archivo
        res.sendFile(filePath); // Enviar el archivo al cliente
  } catch (error) {
    console.log(error)
    res.json(èrror)
  }

 /* await pool.query(query, [id], (err, result) => {
    if (err) {
      console.log('Error en la consulta a la base de datos:', err);
      return res.status(500).json({ message: 'Error en la consulta a la base de datos' });
    }

    console.log('Resultado de la consulta:', result); // Muestra el resultado de la consulta

    if (result.length > 0) {
      const filePath = path.join(__dirname, '../imagenesvendedoras', result[0].ubicacion);
      console.log('Ruta del archivo:', filePath); // Muestra la ruta completa del archivo
      res.sendFile(filePath); // Enviar el archivo al cliente
    } else {
      console.log('Archivo no encontrado para el ID:', id); // Muestra que no se encontró un archivo
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  }); */
});






router.post("/borraractividadsocial", async (req, res) => {
  const { id } = req.body;

  try {
    // Obtener la ubicación del archivo desde la base de datos
    const result = await pool.query('SELECT ubicacion FROM dtc_asistencias_sociales WHERE id = ?', [id]);

    if (result.length > 0) {
      const archivoUbicacion = result[0].ubicacion;

      // Construir la ruta completa del archivo
      let filePath = ''

      try {
         filePath = path.join(__dirname, '../imagenesvendedoras', archivoUbicacion);

      } catch (error) {
        
      }

      // Intentar eliminar el archivo del sistema de archivos si existe
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Archivo eliminado:', filePath);
      } else {
        console.log('El archivo no existe:', filePath);
      }

      // Eliminar la entrada de la base de datos
      await pool.query('DELETE FROM dtc_asistencias_sociales WHERE id = ?', [id]);

      res.json('Realizado');
    } else {
      res.json('No se encontró la entrada para el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al borrar la actividad social:', error);
    res.json('No realizado');
  }
});


router.post("/traertodaslasactividades", async (req, res) => {
  const { fecha } = req.body
  try {
    console.log(fecha)
    const existe = await pool.query('select * from dtc_actividades join (select id as idu, nombre from usuarios) as sel on dtc_actividades.acargo=sel.idu where  fecha =?', [fecha])
    console.log(existe)
    res.json(existe)
  } catch (error) {
    console.log(error)
    res.json([])
  }
})



router.post("/traeractividadeschico", async (req, res) => {
  const { id_usuario } = req.body;

  try {
    const results = await pool.query('SELECT dtc_actividades_chicos.id,dtc_actividades_chicos.id_tallerista, dtc_actividades_chicos.fecha,dtc_actividades_chicos.fecha_act, dtc_actividades_chicos.detalle, dtc_actividades_chicos.titulo, usuarios.nombre, selec2.nombree,selec2.apellido, selec2.dni,selec2.fecha_nacimiento,selec2.escuela,selec2.grado  FROM dtc_actividades_chicos JOIN usuarios ON dtc_actividades_chicos.id_tallerista = usuarios.id  join (select id as idu, nombre as nombree,apellido, fecha_nacimiento, dni, grado, escuela from dtc_chicos) as selec2 on dtc_actividades_chicos.id_usuario=selec2.idu WHERE dtc_actividades_chicos.id_usuario = ? ORDER BY dtc_actividades_chicos.id DESC',[id_usuario]);

    const env = [];

    for (let i = 0; i < results.length; i++) {
      const nuevo = {
        id: results[i].id,
        fecha: results[i].fecha,
        grado: results[i].grado,
        escuela: results[i].escuela,
        fecha_act: results[i].fecha_act,
        detalle: results[i].detalle.replace(/\n/g, '<br>'),
        titulo: results[i].titulo,
        nombre: results[i].nombre,
        nombree: results[i].nombree,
        apellido: results[i].apellido,
        dni: results[i].dni,
        id_tallerista: results[i].id_tallerista, 
        fecha_nacimiento: results[i].fecha_nacimiento,
      };
      env.push(nuevo);
    }

    console.log(env);
    res.json(env);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});


router.post("/traeractividades", async (req, res) => {
  const { fecha, id_usuario } = req.body
  try {
    console.log('id_usuaro', id_usuario)
    const existeee = await pool.query('select * from dtc_actividades where acargo=? ', [id_usuario])
    console.log('existe')
    console.log(existeee)

    res.json(existeee)
  } catch (error) {
    console.log(error)
    res.json([])
  }
})





router.post("/nuevaactividad", async (req, res) => {
  const { detalle, id_tallerista, fecha, titulo } = req.body

  console.log(detalle, id_tallerista, fecha, titulo)
  await pool.query('insert into dtc_actividades set fecha=?, acargo=?,titulo=?,detalle=?', [fecha, id_tallerista, titulo, detalle])

  res.json('Realizado')


})
router.post("/nuevaactividadchico", async (req, res) => {
  let { detalle, id_usuario, titulo, id_tallerista, fecha, fecha_act } = req.body
if(fecha_act==undefined){
  fecha_act="04/07/2024"
}
  console.log(detalle, id_usuario, fecha, id_tallerista)
  await pool.query('insert into dtc_actividades_chicos set id_usuario=?, id_tallerista=?,titulo=?,detalle=?,fecha=?,fecha_act=?', [id_usuario, id_tallerista, titulo, detalle, fecha,fecha_act])

  res.json('Realizado')


})


router.post("/nuevoinformepsiqcadia", upload.single("archivo"), async (req, res) => {
  let { detalle, id_usuario, titulo, id_trabajador, fecha_referencia } = req.body;
  console.log(detalle, id_usuario, titulo, id_trabajador, fecha_referencia)
  let ubicacion = req.file ? path.basename(req.file.path) : "no"; // Asigna "no" si no hay archivo

  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toISOString().slice(0, 19).replace('T', ' ');

  try {
    await pool.query(
      'INSERT INTO cadia_informes (id_usuario, id_trabajador, titulo, detalle, fecha_carga, ubicacion,fecha_referencia) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_usuario, id_trabajador, titulo, detalle, fechaFormateada, ubicacion, fecha_referencia]
    );
    res.json({ message: "Intervención creada con éxito" });
  } catch (error) {
    console.error('Error al crear la intervención:', error);
    res.status(500).json({ error: 'Error al crear la intervención' });
  }
});
router.post("/nuevoinformepsiq", upload.single("archivo"), async (req, res) => {
  let { detalle, id_usuario, titulo, id_trabajador, fecha_referencia } = req.body;
  console.log(detalle, id_usuario, titulo, id_trabajador, fecha_referencia)
  let ubicacion = req.file ? path.basename(req.file.path) : "no"; // Asigna "no" si no hay archivo

  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toISOString().slice(0, 19).replace('T', ' ');

  try {
    await pool.query(
      'INSERT INTO dtc_informes_psic (id_usuario, id_trabajador, titulo, detalle, fecha_carga, ubicacion,fecha_referencia) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_usuario, id_trabajador, titulo, detalle, fechaFormateada, ubicacion, fecha_referencia]
    );
    res.json({ message: "Intervención creada con éxito" });
  } catch (error) {
    console.error('Error al crear la intervención:', error);
    res.status(500).json({ error: 'Error al crear la intervención' });
  }
});



router.post("/nuevaintervencion", upload.single("archivo"), async (req, res) => {
  let { detalle, id_usuario, titulo, id_trabajador, fecha_referencia } = req.body;
  let ubicacion = req.file ? path.basename(req.file.path) : "no"; // Asigna "no" si no hay archivo

  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toISOString().slice(0, 19).replace('T', ' ');

  try {
    await pool.query(
      'INSERT INTO dtc_asistencias_sociales (id_usuario, id_trabajador, titulo, detalle, fecha_carga, ubicacion,fecha_referencia) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_usuario, id_trabajador, titulo, detalle, fechaFormateada, ubicacion, fecha_referencia]
    );
    res.json({ message: "Intervención creada con éxito" });
  } catch (error) {
    console.error('Error al crear la intervención:', error);
    res.status(500).json({ error: 'Error al crear la intervención' });
  }
});

router.post("/nuevacosa", upload.single("archivo"), async (req, res) => {
  // Desestructuración de los datos del cuerpo, asignando valores por defecto si faltan
  let {
    detalle = "Sin detalle",  // Valor por defecto "Sin detalle" si no se proporciona
    id_usuario = null,        // Valor por defecto null
    titulo = "Sin título",    // Valor por defecto "Sin título"
    id_trabajador = null,     // Valor por defecto null
    fecha_referencia = null   // Valor por defecto null
  } = req.body;
console.log(titulo)
  // Asigna "no" si no hay archivo
  let ubicacion = req.file ? path.basename(req.file.path) : "no";

  // Fecha actual formateada
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toISOString().slice(0, 19).replace('T', ' ');

  try {
    // Inserción en la base de datos con valores predeterminados si faltan datos
    await pool.query(
      'INSERT INTO dtc_cosas_usuario (id_usuario, titulo, detalle, fecha_carga, ubicacion, fecha_referencia) VALUES ( ?, ?, ?, ?, ?, ?)',
      [id_trabajador, titulo, detalle, fechaFormateada, ubicacion, fecha_referencia]
    );
    res.json({ message: "Intervención creada con éxito" });
  } catch (error) {
    console.error('Error al crear la intervención:', error);
    res.status(500).json({ error: 'Error al crear la intervención' });
  }
});
router.get('/listaprofs/', async (req, res) => {
  const id = req.params.id

  const pendientes = await pool.query('select * from usuarios where nivel=41')
  

  
    res.json([pendientes])
})
  
router.get('/traerhorariosprofesionales/', async (req, res) => {
  const id = req.params.id

  const pendientes = await pool.query('select * from cadia_horario join (select id as idu, nombre,mail, usuario from usuarios) as sel on cadia_horario.id_usuario=sel.idu')
  

  
    res.json(pendientes)
  
  
  })

router.get('/traerhorariosprofesional/:id', async (req, res) => {
  const id = req.params.id

  const pendientes = await pool.query('select * from cadia_horario where id_usuario=?',[id])
  

  
    res.json(pendientes)
  
  
  })
  


  router.get('/traerhorarioschicos', async (req, res) => {
    const id = req.params.id
  
    const pendientes = await pool.query('select * from cadia_horarios_chicos  join (select id as idu, nombre, apellido from cadia_chicos) as sel on cadia_horarios_chicos.id_usuario=sel.idu ')
    
  
    
      res.json(pendientes)
    
    
    })
    

  router.get('/traerhorarioschico/:id', async (req, res) => {
    const id = req.params.id
  
    const pendientes = await pool.query('select * from cadia_horarios_chicos where id_usuario=?',[id])
    
  
    
      res.json(pendientes)
    
    
    })
    
    router.post('/agregarhorariochico', async (req, res) => {
      const { titulo, fecha_inicio, fecha_fin, categoria,id_usuario,daysOfWeek} = req.body;
      try {
        const result = await pool.query('INSERT INTO cadia_horarios_chicos set titulo=?, fecha_inicio=?, fecha_fin=?, categoria=?,id_usuario=?,dias=?', [titulo, fecha_inicio, fecha_fin, categoria,id_usuario,"["+daysOfWeek+"]"]);
        res.json("Realizado");
      } catch (error) {
        console.log(error)
        res.status(500).send(error);
      }
    });
  router.post('/agregarhorario', async (req, res) => {
    const { titulo, fecha_inicio, fecha_fin, categoria,id_usuario,daysOfWeek} = req.body;
    try {
      const result = await pool.query('INSERT INTO cadia_horario set titulo=?, fecha_inicio=?, fecha_fin=?, categoria=?,id_usuario=?,dias=?', [titulo, fecha_inicio, fecha_fin, categoria,id_usuario,"["+daysOfWeek+"]"]);
      res.json("Realizado");
    } catch (error) {
      console.log(error)
      res.status(500).send(error);
    }
  });



router.get('/traercitas/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const usua = await pool.query('select * from usuarios where id=?',[id])
  if (usua.nivel==40){
    const pendientes = await pool.query('select * from dtc_turnos where estado="Disponible"',[id])
    const confirm = await pool.query('select * from dtc_turnos where  estado="Agendado"',[id])
    console.log([pendientes, confirm])
    
      res.json([pendientes, confirm])
  }else{
    const pendientes = await pool.query('select * from dtc_turnos where id_psico=? and estado="Disponible"',[id])
    const confirm = await pool.query('select * from dtc_turnos where id_psico=?and estado="Agendado"',[id])
    console.log([pendientes, confirm])
    
    
      res.json([pendientes, confirm])
  }

})


router.get('/traercitascadia/:id', async (req, res) => {
  const id = req.params.id
console.log(id)
const usua = await pool.query('select * from usuarios where id=?',[id])
if (usua.nivel==40){
  const pendientes = await pool.query('select * from cadia_turnos where estado="Disponible"',[id])
  const confirm = await pool.query('select * from cadia_turnos where  estado="Agendado"',[id])

  
    res.json([pendientes, confirm])
}else{
  const pendientes = await pool.query('select * from cadia_turnos where id_psico=? and estado="Disponible"',[id])
  const confirm = await pool.query('select * from cadia_turnos where id_psico=?and estado="Agendado"',[id])
 
  
  
    res.json([pendientes, confirm])
}



})
router.get('/traercitastodos/', async (req, res) => {
  const id = req.params.id

const pendientes = await pool.query('select * from dtc_turnos where estado="Disponible"')
const confirm = await pool.query('select * from dtc_turnos where estado="Agendado"')



  res.json([pendientes, confirm])


})

router.get('/traercitastodoscadia/', async (req, res) => {
  const id = req.params.id

const pendientes = await pool.query('select * from cadia_turnos where estado="Disponible"')
const confirm = await pool.query('select * from cadia_turnos where estado="Agendado"')



  res.json([pendientes, confirm])


})


router.get('/traerpresentesdeclaseprof/:id', async (req, res) => {
  const id = req.params.id
  const id_profesional = await pool.query('select * from cadia_clases_prof  where id_clase=?',[id])

  const existe = await pool.query('select * from cadia_asitencia_clases join (select id as idc,nombre from cadia_chicos) as sel on cadia_asitencia_clases.id_usuario=sel.idc  where id_clase=?', [id])//presentes
  console.log(existe)
  usuarios = await pool.query("select * from cadia_chicos left join (select id_asistencia as ida  from cadia_asitencia_clases where id_asistencia=? ) as sel on cadia_chicos.id=sel.ida  join (select id_chico as idrelacion, id_profesional from cadia_chico_profesional) as sel2 on cadia_chicos.id=sel2.idrelacion where id_profesional=?", [id,id_profesional[0]['idtallerista']])
  //todos
  res.json([existe, usuarios])


})




router.get('/traercosassole/:id', async (req, res) => {
const id  = req.params.id
  const existe = await pool.query('select * from dtc_cosas_usuario where id_usuario=?',[id])//presentes
  //todos

  res.json(existe)


})
router.get('/traerasitenciasociales', async (req, res) => {

  const existe = await pool.query('select * from dtc_asistencias_sociales left join (select  id as idu, nombre from usuarios)as sel on dtc_asistencias_sociales.id_trabajador=sel.idu left join (select id as idch, nombre as nombree, apellido from dtc_chicos) as sel3 on dtc_asistencias_sociales.id_usuario=sel3.idch')//presentes
  //todos

  res.json(existe)


})
router.get('/traerinformes', async (req, res) => {

  const existe = await pool.query('select * from dtc_informes_psic left join (select  id as idu, nombre from usuarios)as sel on dtc_informes_psic.id_trabajador=sel.idu left join (select id as idch, nombre as nombree, apellido from dtc_personas_psicologa) as sel3 on dtc_informes_psic.id_usuario=sel3.idch')//presentes
  //todos

  res.json(existe)


})

router.get('/verarchivo/:id', async (req, res) => {
  const { id } = req.params;
  console.log('ID solicitado:', id);

  try {
    const trabajocos = await pool.query('SELECT * FROM dtc_asistencias_sociales WHERE id = ?', [id]);
    if (trabajocos.length === 0) {
      return res.status(404).send('Asistencia social no encontrada');
    }

    const ubicacion = trabajocos[0]['ubicacion'];
    const filePath = path.join(__dirname, '../imagenesvendedoras', ubicacion);

    console.log('Ruta del archivo:', filePath);
console.log(1456)
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error('Archivo no encontrado en la ruta:', filePath);
      return res.status(404).send('Archivo no encontrado');
    }

    // Enviar el archivo al cliente
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err);
        res.status(404).send('Archivo no encontrado');
      }
    });
  } catch (error) {
    console.error('Error al buscar la asistencia social:', error);
    res.status(500).send('Error del servidor');
  }
});


router.get('/verarchivopsiq/:id', async (req, res) => {
  const { id } = req.params;
  console.log('ID solicitado:', id);

  try {
    const trabajocos = await pool.query('SELECT * FROM dtc_informes_psic WHERE id = ?', [id]);
    if (trabajocos.length === 0) {
      return res.status(404).send('Asistencia social no encontrada');
    }

    const ubicacion = trabajocos[0]['ubicacion'];
    const filePath = path.join(__dirname, '../imagenesvendedoras', ubicacion);

    console.log('Ruta del archivo:', filePath);
console.log(1456)
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error('Archivo no encontrado en la ruta:', filePath);
      return res.status(404).send('Archivo no encontrado');
    }

    // Enviar el archivo al cliente
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err);
        res.status(404).send('Archivo no encontrado');
      }
    });
  } catch (error) {
    console.error('Error al buscar la asistencia social:', error);
    res.status(500).send('Error del servidor');
  }
});

router.post("/traerdatosdeclasehorausuario/", async (req, res) => {
  try {
    let { hora, id_taller } = req.body;

    console.log("Solicitud recibida con datos:", req.body);

    // Convertir "1430" -> "14:30"
    if (hora && hora.length === 4) {
      hora = `${hora.slice(0, 2)}:${hora.slice(2)}`;
    }

    console.log("Hora formateada:", hora);

    const fecha = new Date().toISOString().split("T")[0];
    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const dia = diasSemana[new Date().getDay()];

    console.log("Fecha actual:", fecha, "Día:", dia);

    // Buscar si la clase ya existe
    const result = await pool.query(
      "SELECT * FROM marketing.dtc_clases_taller WHERE dia = ? AND hora = ? AND id_tallerista = ? AND fecha = ?",
      [dia, hora, id_taller, fecha]
    );

    if (result.length === 0) {
      return res.json([[], []]); // Si no hay clase, devuelve arrays vacíos
    }

    const id_clase = result[0].id; // Obtener el ID de la clase encontrada

    console.log("ID de la clase encontrada:", id_clase);

    // Buscar en dtc_cursado y hacer LEFT JOIN con dtc_asistencia_clase
    const usuariosResult = await pool.query(
      `SELECT 
        sel.idc AS id_chico,
        sel.apellido, 
        sel.nombre, 
        CASE 
          WHEN dtc_asistencia_clase.id_usuario IS NOT NULL THEN 'Presente' 
          ELSE '0' 
        END AS presente 
      FROM marketing.dtc_cursado 
      JOIN (SELECT id AS idc, nombre, apellido FROM dtc_chicos) AS sel 
        ON dtc_cursado.id_chico = sel.idc 
      LEFT JOIN dtc_asistencia_clase 
        ON dtc_cursado.id_chico = dtc_asistencia_clase.id_usuario 
        AND dtc_asistencia_clase.id_clase = ? 
      WHERE dtc_cursado.dia = ? 
        AND dtc_cursado.hora = ? 
        AND dtc_cursado.id_curso = ?`,
      [id_clase, dia, hora, id_taller]
    );

    console.log(usuariosResult);
    res.json([result, usuariosResult]);
  } catch (error) {
    console.error("Error en la API:", error);
    res.status(500).json({ error: "Error al obtener los datos." });
  }
});





/* router.get('/traerpresentesdeclase/:id', async (req, res) => {
  const id = req.params.id
  const clase =await pool.query('select * from dtc_clases_taller where id=?',[id])
  const cursado =await pool.query('select * from dtc_cursado where id_curso=? and dia=? and hora=?',[clase[0]['id_tallerista'],clase[0]['dia'],clase[0]['hora']])
  const existe = await pool.query('select * from dtc_asistencia_clase join (select id as idc,nombre from dtc_chicos) as sel on dtc_asistencia_clase.id_usuario=sel.idc  where id_clase=?', [id])//presentes
  console.log(existe)
 //// funcion para traer todos los usuarios con su presente en el taller 
 usuarios = await pool.query("select * from dtc_chicos left join (select id as ida  from dtc_asistencia_clase where id=? ) as sel on dtc_chicos.id=sel.ida ", [id])
  //nueva consulta para solo los incriptosdias etc
//usuarios = await pool.query("select * from dtc_chicos left join (select id as ida  from dtc_asistencia_clase where id=? ) as sel on dtc_chicos.id=sel.ida join(select id as idcursado,id_chico from dtc_cursado where id=?) as sel2 on dtc_chicos.id=sel2.id_chico ", [id,cursado[0]['id']])
  res.json([existe, usuarios])


}) */

router.get('/traeretapacocinacadia/', async (req, res) => {
  const existe = await pool.query('SELECT * FROM dtc_etapa_cadia  ORDER BY id DESC');


  res.json([existe])


})

router.get('/traerparasumar/', async (req, res) => {
  const existe = await pool.query('SELECT * FROM dtc_etapa_cadia  ORDER BY id DESC');
  const existe2 = await pool.query('SELECT * FROM dtc_stock  ORDER BY id DESC');

  res.json([existe,existe2])


})


router.get('/traeretapacocina/:id', async (req, res) => {
  const id = req.params.id
  const existe = await pool.query('SELECT * FROM dtc_etapa WHERE id_usuario=? ORDER BY id DESC', [id]);


  res.json([existe])


})



router.get('/traerstock', async (req, res) => {
  try {
    const existe = await pool.query(`
      SELECT 
        s.*, 
        COALESCE(recepcion.total_recepcion, 0) AS total_recepcion,
        COALESCE(consumo.total_consumo, 0) AS total_consumo
      FROM dtc_stock s
      LEFT JOIN (
          SELECT id_producto, SUM(cantidad) AS total_recepcion 
          FROM dtc_recepcion_stock 
          GROUP BY id_producto
      ) AS recepcion ON s.id = recepcion.id_producto
      LEFT JOIN (
          SELECT id_producto, SUM(cantidad) AS total_consumo 
          FROM dtc_consumo 
          GROUP BY id_producto
      ) AS consumo ON s.id = consumo.id_producto
      ORDER BY s.id DESC;
    `);


    res.json([existe]);
  } catch (error) {
    console.error('Error al traer stock:', error);
    res.status(500).json({ message: 'Error al obtener el stock' });
  }
});



router.get('/traerintervenciones/', async (req, res) => {
  let can = await pool.query(`
    SELECT 
      dtc_actividades_chicos.*, 
      sel.nombretallerista, 
      SUBSTRING(dtc_actividades_chicos.fecha_act, 6, 2) AS mes, 
      SUBSTRING(dtc_actividades_chicos.fecha_act, 1, 4) AS año
    FROM 
      dtc_actividades_chicos 
    JOIN 
      (SELECT id AS idu, nombre AS nombretallerista FROM usuarios) AS sel 
    ON 
      dtc_actividades_chicos.id_tallerista = sel.idu 
    ORDER BY 
      dtc_actividades_chicos.id DESC
  `);
  ;  res.json([can])

})



router.get('/obtenerdetalle/:id', async (req, res) => {
  const id = req.params.id
  let can = await pool.query('select * from dtc_actividades_chicos where id=?',[id])
  res.json(can)

})

router.get('/traerprofesionales/', async (req, res) => {
  try {
    // Obtiene todos los usuarios con nivel 26
    const existe = await pool.query('SELECT * FROM usuarios WHERE nivel = 41');
    enviar = [];

    // Obtiene la fecha actual
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1; // Los meses en JavaScript son de 0 a 11
    const añoActual = fechaActual.getFullYear();
    const diaActual = fechaActual.getDate();

    // Formatea el primer y último día del mes actual
    const primerDiaMes = `${añoActual}-${mesActual.toString().padStart(2, '0')}-01`;
    const ultimoDiaMes = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;

    // Formatea el día actual
    const fechaHoy = `${añoActual}-${mesActual.toString().padStart(2, '0')}-${diaActual.toString().padStart(2, '0')}`;

    for (const usuario of existe) {
      // Cuenta todas las clases del tallerista
      const totalClases = await pool.query('SELECT * FROM dtc_clases_taller WHERE id_tallerista = ?', [usuario.id]);

      // Cuenta las clases del tallerista en el mes actual
      const clasesMesActual = await pool.query(
        'SELECT * FROM dtc_clases_taller WHERE id_tallerista = ? AND fecha BETWEEN ? AND ?',
        [usuario.id, primerDiaMes, ultimoDiaMes]
      );

      // Cuenta las clases del tallerista hoy
      const clasesHoy = await pool.query(
        'SELECT * FROM dtc_clases_taller WHERE id_tallerista = ? AND fecha = ?',
        [usuario.id, fechaHoy]
      );

      const nue = {
        id: usuario.id,
        nombre: usuario.nombre,
        nivel: usuario.nivel,
        mail: usuario.mail,
        cantidad: totalClases.length,
        cantidadMes: clasesMesActual.length,
        cantidadHoy: clasesHoy.length,
        usuario: usuario.usuario,
      };

      enviar.push(nue);
    }

    res.json([enviar]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los talleres' });
  }
});


router.get('/traerhorariosdisponiblescadia/:id', async (req, res) => {
const id = req.params.id
    // Obtiene todos los usuarios con nivel 26
    const existe = await pool.query('SELECT * FROM cadia_turnos join (select id as idu, nombre as nombreu,mail as prof  from usuarios) as sel on cadia_turnos.id_psico=sel.idu WHERE estado = "Disponible" or id_persona=? ',[id]);


    res.json(existe);
})

router.get('/traeractividadesprofcadia/:id', async (req, res) => {
  const id = req.params.id
      // Obtiene todos los usuarios con nivel 26
      const existe = await pool.query('SELECT * FROM cadia_informes join (select id as idu, nombre as nombreu,mail as prof  from usuarios) as sel on cadia_informes.id_trabajador=sel.idu  left join (select nombre,apellido,id as idc from cadia_chicos) as sel2 on cadia_informes.id_usuario=sel2.idc WHERE id_trabajador=? ',[id]);
  
  console.log(existe)
      res.json(existe);
  })
  
  router.get('/traeractividadesprofcadiaadmin/', async (req, res) => {
        // Obtiene todos los usuarios con nivel 26
        const existe = await pool.query('SELECT * FROM cadia_informes join (select id as idu, nombre as nombreu,mail as prof  from usuarios) as sel on cadia_informes.id_trabajador=sel.idu  left join (select nombre,apellido,id as idc from cadia_chicos) as sel2 on cadia_informes.id_usuario=sel2.idc ');
    
    console.log(existe)
        res.json(existe);
    })


router.post("/enviarhorariosdlchico", async (req, res) => {
  const { id_persona, horariosSeleccionados } = req.body; // No necesitamos id_turno ni id_cursado aquí.
console.log( id_persona, horariosSeleccionados)
  try {
    for (let idHorario of horariosSeleccionados) {
      // Actualizamos el turno con el id_persona y cambiamos el estado a "Agendado"
      await pool.query('UPDATE cadia_turnos SET id_persona = ?, estado = "Agendado" WHERE id = ?', [id_persona, idHorario]);
    }
    res.json('Horarios almacenados correctamente');
  } catch (error) {
    console.log(error);
    res.status(500).json('Error al almacenar los horarios');
  }
});


router.get('/traerpsicologos/', async (req, res) => {
  try {
    // Obtiene todos los usuarios con nivel 26
    const existe = await pool.query('SELECT * FROM usuarios WHERE nivel = 24');
   

    res.json([existe]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los talleres' });
  }
});
router.get('/traertalleres/', async (req, res) => {
  try {
    // Obtiene todos los usuarios con nivel 26
    const existe = await pool.query('SELECT * FROM usuarios WHERE nivel = 26');
    enviar = [];

    // Obtiene la fecha actual
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1; // Los meses en JavaScript son de 0 a 11
    const añoActual = fechaActual.getFullYear();
    const diaActual = fechaActual.getDate();

    // Formatea el primer y último día del mes actual
    const primerDiaMes = `${añoActual}-${mesActual.toString().padStart(2, '0')}-01`;
    const ultimoDiaMes = `${añoActual}-${mesActual.toString().padStart(2, '0')}-31`;

    // Formatea el día actual
    const fechaHoy = `${añoActual}-${mesActual.toString().padStart(2, '0')}-${diaActual.toString().padStart(2, '0')}`;

    for (const usuario of existe) {
      // Cuenta todas las clases del tallerista
      const totalClases = await pool.query('SELECT * FROM dtc_clases_taller WHERE id_tallerista = ?', [usuario.id]);

      // Cuenta las clases del tallerista en el mes actual
      const clasesMesActual = await pool.query(
        'SELECT * FROM dtc_clases_taller WHERE id_tallerista = ? AND fecha BETWEEN ? AND ?',
        [usuario.id, primerDiaMes, ultimoDiaMes]
      );

      // Cuenta las clases del tallerista hoy
      const clasesHoy = await pool.query(
        'SELECT * FROM dtc_clases_taller WHERE id_tallerista = ? AND fecha = ?',
        [usuario.id, fechaHoy]
      );

      const nue = {
        id: usuario.id,
        nombre: usuario.nombre,
        cantidad: totalClases.length,
        cantidadMes: clasesMesActual.length,
        cantidadHoy: clasesHoy.length,
        usuario: usuario.usuario,
      };

      enviar.push(nue);
    }

    res.json([enviar]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los talleres' });
  }
});


router.get('/descargar/:id', async (req, res) => {
  const id = req.params.id;
  const nomb = await pool.query('select * from dtc_legajos where id=?', [id])
  filePath = path.join(__dirname, '../imagenesvendedoras', nomb[0]['ubicacion']);
  console.log(filePath)
  // const filePath = __dirname + '/uploads/' + nomb[0]['ubicacion'];

  res.download(filePath);
});





router.post("/borrarclasee", async (req, res) => {
  let { id } = req.body
  ///presentes mensuales 
  try {
    await pool.query('delete  from  dtc_clases_taller where id = ?', [id])

    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('No realizado')


  }


})
router.post("/consultarasitencias", async (req, res) => {
  let { fecha_inicio, fecha_fin } = req.body
  ///presentes mensuales 
  console.log(fecha_inicio, fecha_fin)
  try {


    function transformarFecha(fecha) {
      // Dividir la fecha en partes [YYYY, MM, DD]
      const [year, month, day] = fecha.split('-');

      // Convertir a números y eliminar ceros a la izquierda si existen
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);

      // Formatear la fecha como D-M-YYYY
      const fechaTransformada = `${dayNum}-${monthNum}-${year}`;

      return fechaTransformada;
    }
    fecha_inicio = transformarFecha(fecha_inicio);
    fecha_fin = transformarFecha(fecha_fin);
    console.log(fecha_inicio, fecha_fin)
    const resultados = await pool.query('SELECT fecha, count(fecha) as cantidad FROM dtc_asistencia WHERE STR_TO_DATE(fecha, "%d-%m-%Y") BETWEEN STR_TO_DATE(?, "%d-%m-%Y") AND STR_TO_DATE(?, "%d-%m-%Y") group by fecha', [fecha_inicio, fecha_fin]);
    const resultadosConvertidos = resultados.map(row => ({
      fecha: row.fecha,
      cantidad: Number(row.cantidad)
    }));
    console.log(resultadosConvertidos)
    res.json(resultadosConvertidos)
  } catch (error) {
    console.log(error)
    res.json([{ fecha: "Error", cantidad: "Error" }])
  }
})

router.post("/traerestadisticas", async (req, res) => {
  let { fecha } = req.body
  ///presentes mensuales 
  fecha = fecha.fecha
 
  // Divide la fecha usando el guión ('-') como separador
  let [dia, mes, año] = fecha.split('-');
  if (dia.length == 1) {
    diacumple = "0" + dia
  } else { diacumple = dia }
  if (mes.length == 1) {
    mescumple = "0" + mes
  } else { mescumple = mes }
  console.log("'_%" + mescumple + "-" + diacumple + "'")
  const cumple = await pool.query('select * from dtc_chicos where fecha_nacimiento like ?', ["%" + mescumple + "-" + diacumple])
  console.log("cumple", cumple)
  if (mes == 1) {
    mesanterior = 12
    anioanterior = año - 1
  } else {
    mesanterior = mes - 1
    anioanterior = año
  }

  const presentes_totales = await pool.query('SELECT * FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238', [mes, año])
  const presentes_totales_reales = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238', [mes, año])
  presentes_totales_reales_mespasado = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238', [mesanterior, anioanterior])

  const date = parse(fecha, 'dd-MM-yyyy', new Date());

  // const fecha2=  parse(date, 'dd-MM-yyyy', new Date());

  //console.log("lunes:", startOfWeek(date, { weekStartsOn: 1 }) )
  const fechaFormateada = format(startOfWeek(date, { weekStartsOn: 1 }), 'd-M-yyyy', { locale: es });
  console.log('fechalnes', fechaFormateada)
  ///cantidad de presentes al lunes
  let cantp = await pool.query('select * from dtc_asistencia where fecha =?', fechaFormateada)
  let estasemana = [cantp.length]
  let fechaaux = fechaFormateada

  while (fechaaux !== fecha) {

    [diaStr, mesStr, anioStr] = fechaaux.split('-');
    dia = parseInt(diaStr);
    mes = parseInt(mesStr) - 1; // Los meses en JavaScript son de 0 a 11
    anio = parseInt(anioStr);

    // Crear un objeto Date con la fecha parseada
    fechaw = new Date(anio, mes, dia);

    // Sumar un día
    fechaw.setDate(fechaw.getDate() + 1);

    // Obtener los valores de la nueva fecha
    nuevoDia = fechaw.getDate();
    nuevoMes = fechaw.getMonth() + 1; // Los meses en JavaScript son de 0 a 11, por lo que sumamos 1
    nuevoAnio = fechaw.getFullYear();
    // Formatear la nueva fecha a d-m-yyyy
    fechaaux = `${nuevoDia}-${nuevoMes}-${nuevoAnio}`;

    let cantp = await pool.query('select * from dtc_asistencia where fecha =?', fechaaux)
    estasemana.push(cantp.length)
    // Código a ejecutar repetidamente mientras la condición sea verdadera
  }

  ///////// ARRANCA TRANSFORMACION FECHA PSADA
  const fechaconvertidora = new Date(date);

  fechaconvertidora.setDate(fechaconvertidora.getDate() - 7);
  //console.log(fechaconvertidora) //bien
  let fechaHaceUnaSemana = fechaconvertidora.toISOString().split('T')[0];

  // Convertir la fecha a formato deseado: YYYY-M-D
  const fechaconvertidoraaux = new Date(fechaHaceUnaSemana);



  const lunespasado = format(startOfWeek(fechaHaceUnaSemana, { weekStartsOn: 1 }), 'd-M-yyyy', { locale: es });

  const [añoo, messs, diaa] = fechaHaceUnaSemana.split('-');
  let diaaa = diaa
  let messss = messs
  if (diaa[0] == 0) {
    diaaa = diaa[1]
  }
  if (messs[0] == 0) {
    messss = messs[1]
  }
  fechaHaceUnaSemana = diaaa + '-' + messss + '-' + añoo

  // const presentes_totales_semana = await pool.query('SELECT * FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238',[mess,años])
  //const presentes_totales_reales_semana = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238',[mess,años])
  const pres_Semanal = await pool.query('SELECT * FROM dtc_asistencia WHERE STR_TO_DATE(fecha, "%d-%m-%Y") >= STR_TO_DATE(?, "%d-%m-%Y") AND STR_TO_DATE(fecha, "%d-%m-%Y") <= STR_TO_DATE(?, "%d-%m-%Y") and id_tallerista=238 ', [fechaFormateada, fecha]);
  const pres_Semanal_real = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE STR_TO_DATE(fecha, "%d-%m-%Y") >= STR_TO_DATE(?, "%d-%m-%Y") AND STR_TO_DATE(fecha, "%d-%m-%Y") <= STR_TO_DATE(?, "%d-%m-%Y") and id_tallerista=238 ', [fechaFormateada, fecha]);

  const pres_Semanapasada = await pool.query('SELECT * FROM dtc_asistencia WHERE STR_TO_DATE(fecha, "%d-%m-%Y") >= STR_TO_DATE(?, "%d-%m-%Y") AND STR_TO_DATE(fecha, "%d-%m-%Y") <= STR_TO_DATE(?, "%d-%m-%Y") and id_tallerista=238 ', [lunespasado, fechaHaceUnaSemana]);
  const pres_Semanal_real_semanapasada = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE STR_TO_DATE(fecha, "%d-%m-%Y") >= STR_TO_DATE(?, "%d-%m-%Y") AND STR_TO_DATE(fecha, "%d-%m-%Y") <= STR_TO_DATE(?, "%d-%m-%Y") and id_tallerista=238 ', [lunespasado, fechaHaceUnaSemana]);

  cantp = await pool.query('select * from dtc_asistencia where fecha =?', lunespasado)
  semanapasada = [cantp.length]
  fechaaux = lunespasado
  while (fechaaux !== fechaHaceUnaSemana) {

    [diaStr, mesStr, anioStr] = fechaaux.split('-');
    dia = parseInt(diaStr);
    mes = parseInt(mesStr) - 1; // Los meses en JavaScript son de 0 a 11
    anio = parseInt(anioStr);

    // Crear un objeto Date con la fecha parseada
    fechaw = new Date(anio, mes, dia);

    // Sumar un día
    fechaw.setDate(fechaw.getDate() + 1);

    // Obtener los valores de la nueva fecha
    nuevoDia = fechaw.getDate();
    nuevoMes = fechaw.getMonth() + 1; // Los meses en JavaScript son de 0 a 11, por lo que sumamos 1
    nuevoAnio = fechaw.getFullYear();
    // Formatear la nueva fecha a d-m-yyyy
    fechaaux = `${nuevoDia}-${nuevoMes}-${nuevoAnio}`;
    let cantp = await pool.query('select * from dtc_asistencia where fecha =?', fechaaux)
    semanapasada.push(cantp.length)
    // Código a ejecutar repetidamente mientras la condición sea verdadera
  }
  const estad = {
    presentes_totales: presentes_totales.length,
    presentes_totales_reales: presentes_totales_reales.length,
    presentes_totales_reales_mespasado: presentes_totales_reales_mespasado.length,
    presentes_totales_semana: pres_Semanal.length,
    presentes_totales_reales_semana: pres_Semanal_real.length,
    pres_Semanapasada: pres_Semanapasada.length,
    pres_Semanal_real_semanapasada: pres_Semanal_real_semanapasada.length,
    semana: estasemana,
    semanapasada: semanapasada,
    cumple: cumple

  }

  res.json([estad])
})


router.post("/nuevaetapacadia", async (req, res) => {
  let { fecha, descripcion, expediente, id_usuario, titulo, etapa, proyecto } = req.body
  console.log(fecha, descripcion, expediente, id_usuario, titulo,etapa, proyecto )
  if (titulo == undefined) {
    titulo = "Sin completar"
  }

  if (descripcion == undefined) {
    descripcion = "Sin completar"
  }

  if (expediente == undefined) {
    expediente = "Sin completar"
  }

  try {
    await pool.query('insert into dtc_etapa_cadia set  fecha=?,descripcion=?,expediente=?, titulo=?, etapa=?, proyecto=?', [fecha, descripcion, expediente,  titulo,etapa, proyecto ])
    res.json("Realizado")
  } catch (error) {
    console.log(error)
    res.json("No realizado")
  }


})
router.post("/nuevaetapa", async (req, res) => {
  let { fecha, descripcion, expediente, id_usuario, titulo, etapa, proyecto } = req.body
  console.log(fecha, descripcion, expediente, id_usuario, titulo)
  if (titulo == undefined) {
    titulo = "Sin completar"
  }

  if (descripcion == undefined) {
    descripcion = "Sin completar"
  }

  if (expediente == undefined) {
    expediente = "Sin completar"
  }

  try {
    await pool.query('insert into dtc_etapa set  fecha=?,descripcion=?,expediente=?, id_usuario=?,titulo=?, etapa=?, proyecto=?', [fecha, descripcion, expediente, id_usuario, titulo,etapa, proyecto ])
    res.json("Realizado")
  } catch (error) {
    console.log(error)
    res.json("No realizado")
  }


})

router.post("/traercumples", async (req, res) => {
  let { fecha } = req.body
  ///presentes mensuales 
  fecha = fecha
  console.log(fecha)
  // Divide la fecha usando el guión ('-') como separador
  let [dia, mes, año] = fecha.split('-');
  if (dia.length == 1) {
    diacumple = "0" + dia
  } else { diacumple = dia }
  if (mes.length == 1) {
    mescumple = "0" + mes
  } else { mescumple = mes }
  console.log("'_%" + mescumple + "-" + diacumple + "'")
  const cumple = await pool.query('select * from dtc_chicos where fecha_nacimiento like ?', ["%" + mescumple + "-" + diacumple])
  const estemes = await pool.query('select * from dtc_chicos where fecha_nacimiento like ?', ["%" + "-" + mescumple + "-" + "%"])

  res.json([cumple, estemes])
})


router.post("/traerracionesmes", async (req, res) => {
  let { fecha } = req.body;
  fecha = fecha;

  let [dia, mes, año] = fecha.split('-');
  cantidadmes = 0;
  enviar = [];

  for (let inde = 1; inde < 32; inde++) {
    console.log(inde);
    try {
      let estemes = await pool.query('select sum(racion) from dtc_asistencia where fecha like ?', [inde + "-" + mes + "-2024" + "%"]);

      if (estemes[0]['sum(racion)'] != null) {
        enviar.push({ fecha: inde + "-" + mes + "-" + "2024", cantidad: estemes[0]['sum(racion)'] });
        cantidadmes += estemes[0]['sum(racion)'];
      }
    } catch (error) {
      console.error("Error al ejecutar la consulta:", error);
    }
  }
  console.log(enviar);
  res.json([enviar, { kid1: 1, kid2: 2, kid3: 3, cantidadmes: cantidadmes }]);
});



router.post("/modificarinformeps", async (req, res) => {
  const { id, titulo, detalle, fecha_referencia  } = req.body

  try {
    await pool.query('update dtc_informes_psic  set titulo=?, detalle=?, fecha_referencia=? where id=?', [titulo, detalle, fecha_referencia, id])
    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('No realizado')
  }


})

router.post("/modificarinterv", async (req, res) => {
  const { id, titulo, detalle, fecha_referencia  } = req.body
console.log(id, titulo, detalle, fecha_referencia  )
  try {
    await pool.query('update dtc_actividades_chicos  set titulo=?, detalle=? where id=?', [titulo, detalle,  id])
    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('No realizado')
  }


})




router.post("/modificarasist", async (req, res) => {
  const { id, titulo, detalle, fecha_referencia  } = req.body
console.log(id, titulo, detalle, fecha_referencia  )
  try {
    await pool.query('update dtc_asistencias_sociales  set titulo=?, detalle=?, fecha_referencia=? where id=?', [titulo, detalle, fecha_referencia, id])
    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('No realizado')
  }


})
router.post('/modificaretapa', async (req, res) => {
  const { id, titulo, fecha, estado, descripcion, fecha_fin,proyectar } = req.body;
console.log( id, titulo, fecha, estado, descripcion, fecha_fin,proyectar )
  if (!id) {
    return res.status(400).json({ message: 'El ID es obligatorio' });
  }

  try {
    const existingData = await pool.query('SELECT * FROM dtc_etapa_cadia WHERE id = ?', [id]);

    if (existingData.length === 0) {
      return res.status(404).json({ message: 'Elemento no encontrado' });
    }

    const updatedFields = {
      titulo: titulo || existingData[0].titulo,
      fecha: fecha || existingData[0].fecha,
      proyectar: proyectar || existingData[0].proyectar,
      estado: estado || existingData[0].estado,
      descripcion: descripcion || existingData[0].descripcion,
      fecha_fin: fecha_fin || existingData[0].fecha_fin,
    };

    await pool.query(
      'UPDATE dtc_etapa_cadia SET titulo=?, fecha=?, estado=?, descripcion=?, fecha_fin=?, proyectar=? WHERE id=?',
      [
        updatedFields.titulo,
        updatedFields.fecha,
        updatedFields.estado,
        updatedFields.descripcion,
        updatedFields.fecha_fin,
        updatedFields.proyectar,
        id,
      ]
    );

    res.json({ message: 'Elemento modificado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al modificar el elemento' });
  }
});


router.post("/modificarkid", async (req, res) => {
  const { id, kid } = req.body

  try {
    await pool.query('update dtc_chicos  set kid=? where id=?', [kid, id])
    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('No realizado')
  }


})


router.post("/determinaprofesional", async (req, res) => {
  const { id_chico, id_profesional } = req.body
  try {
    console.log( id_chico, id_profesional)
    await pool.query('insert into cadia_chico_profesional set id_chico=?,id_profesional=?', [id_chico, id_profesional])

    res.json('realizado')
  } catch (error) {
   console.log(error)
    res.json('error, algo sucedio')
  }

})

router.post("/nuevoproducto", async (req, res) => {
  const { nombre, descripcion } = req.body
  try {
  
    await pool.query('insert into dtc_stock set nombre=?,descripcion=?', [nombre, descripcion])

    res.json('realizado')
  } catch (error) {
   console.log(error)
    res.json('error, algo sucedio')
  }

})

router.post("/sumarstock", async (req, res) => {
  const { fecha,id_producto,id_exp,cantidad } = req.body
  try {
if(fecha==undefined){
  await pool.query('insert into dtc_recepcion_stock set id_producto=?, id_exp=?,cantidad=?', [ id_producto,id_exp,cantidad])

}else{
  await pool.query('insert into dtc_recepcion_stock set fecha=? ,id_producto=?, id_exp=?,cantidad=?', [ fecha,id_producto,id_exp,cantidad])

}

    res.json('realizado')
  } catch (error) {
   console.log(error)
    res.json('error, algo sucedio')
  }

})



router.post("/determinarvinculo", async (req, res) => {
  const { id_usuario, id_vinculo, vinculoo } = req.body
  try {
    await pool.query('insert into dtc_vinculo set id_usuario=?,id_vinculo=?,vinculoo=?', [id_usuario, id_vinculo, vinculoo])

    res.json('realizado')
  } catch (error) {
    // console.log(error)
    res.json('error, algo sucedio')
  }

})



router.post("/borrarusuariocadia", async (req, res) => {
  const { id } = req.body

  try {
    await pool.query('delete  from  cadia_chicos where id = ?', [id])
    res.json('Usuario borrado')
  } catch (error) {
    console.log(error)
    res.json('UsuarNooio borrado, algo sucedio')
  }

})



router.post("/borrarusuariodtc", async (req, res) => {
  const { id } = req.body

  try {
    await pool.query('delete  from  dtc_chicos where id = ?', [id])
    res.json('Usuario borrado')
  } catch (error) {
    console.log(error)
    res.json('UsuarNooio borrado, algo sucedio')
  }

})


router.post("/borrarusuariodtcpsiq", async (req, res) => {
  const { id } = req.body

  try {
    await pool.query('delete  from  dtc_personas_psicologa where id = ?', [id])
    res.json('Usuario borrado')
  } catch (error) {
    console.log(error)
    res.json('UsuarNooio borrado, algo sucedio')
  }

})

router.post("/ponerpresenteactividad", async (req, res) => {
  const { fecha, id, id_tallerista } = req.body
  console.log(id)
  const existe = await pool.query('select * from dtc_asistencia where id_actividad=?', [id])
  let era
  if (existe.length > 0) {
    await pool.query('delete  from  dtc_asistencia where id = ?', [existe[0]['id']])
    era = "puesto Ausente"
  } else {
    await pool.query('insert into dtc_asistencia set id_actividad=?', [fecha, id, id_tallerista])
    era = "puesto Presente"
  }

  res.json(era)


})




router.post("/agregarturno", async (req, res) => {
  let { fecha, horario, id_psic,profesional} = req.body
  console.log(fecha, horario, id_psic,profesional)
  if(profesional != undefined){
    id_psic=profesional
    fecha=fecha.fecha
  }
  console.log(fecha)
  try {
    await pool.query('insert into dtc_turnos set fecha=?, detalle=?,id_psico=?, estado="Disponible"', [fecha, horario, id_psic])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }

})


router.post("/agregarturnocadia", async (req, res) => {
  let { fecha, horario, id_psic,profesional} = req.body
  console.log(fecha, horario, id_psic,profesional)
  if(profesional != undefined){
    id_psic=profesional
    fecha=fecha.fecha
  }
  try {
    await pool.query('insert into cadia_turnos set fecha=?, detalle=?,id_psico=?, estado="Disponible"', [fecha, horario, id_psic])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }

})
/* router.post("/agendarturno", async (req, res) => {
  let { id, id_persona } = req.body

  try {
    const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');
    console.log(id, id_persona)
    await pool.query('update dtc_turnos set id_persona=?,estado="Agendado",hora=? where id=?', [id_persona, horaBuenosAires + '-' + (new Date(Date.now())).toLocaleDateString(), id])
    res.json('agendado')
  } catch (error) {
    console.log(error)
    res.json('no agendado')
  }


}) */
  router.post("/agendarturno", async (req, res) => {
    let { id, id_persona} = req.body;

    try {
        const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');
        const fecha = (new Date(Date.now())).toLocaleDateString();

        console.log(id, id_persona);
        const profesionall = await pool.query('select * from dtc_turnos join (select id as idu, telefono, nombre  from usuarios)as sel on dtc_turnos.id_psico=sel.idu  where id=?',[id])
        const personapsiq = await pool.query('select * from dtc_personas_psicologa where id =?',[id_persona])
        telefono= profesionall[0]['telefono']+'@c.us'
        // Actualizar el turno en la base de datos
        await pool.query(
            'UPDATE dtc_turnos SET id_persona=?, estado="Agendado", hora=? WHERE id=?',
            [id_persona, `${horaBuenosAires}-${fecha}`, id]
        );

        // Enviar mensaje de WhatsApp
        const mensaje = `Hola ${profesionall[0]['nombre']}, tenes un nuevo turno para el dia ${profesionall[0]['fecha']} a las ${profesionall[0]['detalle']} del paciente ${personapsiq[0]['nombre']} ${personapsiq[0]['apellido']}Un saludo DTC.`;
console.log(mensaje)
try {
  await  client.sendMessage(telefono, mensaje); // Enviar mensaje
} catch (error) {
  console.log(error)
}


        res.json('agendado');
    } catch (error) {
        console.error(error);
        res.json('no agendado');
    }
});


router.post("/agendarturnocadia", async (req, res) => {
  let { id, id_persona } = req.body

  try {
    const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');
    console.log(id, id_persona)
    await pool.query('update cadia_turnos set id_persona=?,estado="Agendado",hora=? where id=?', [id_persona, horaBuenosAires + '-' + (new Date(Date.now())).toLocaleDateString(), id])
    res.json('agendado')
  } catch (error) {
    console.log(error)
    res.json('no agendado')
  }


})
router.post("/sacarturno", async (req, res) => {
  let { id } = req.body
  try {
    await pool.query('delete  from  dtc_turnos where id = ?', [id])
    res.json('quitado')
  } catch (error) {
    console.log(error)
    res.json('Error')
  }


})
router.post("/ponerpresente", async (req, res) => {
  let { fecha, id, id_tallerista } = req.body
  const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');

  console.log("La hora actual en Buenos Aires es:", horaBuenosAires);

  id_tallerista = 238

  const existe = await pool.query('select * from dtc_asistencia where id_usuario=? and fecha =? and id_tallerista=?', [id, fecha, id_tallerista])
  let era
  if (existe.length > 0) {
    await pool.query('delete  from  dtc_asistencia where id = ?', [existe[0]['id']])
    era = "puesto Ausente"


  } else {
    await pool.query('insert into dtc_asistencia set fecha=?, id_usuario=?,id_tallerista=?,hora=?', [fecha, id, id_tallerista, horaBuenosAires])
    era = "puesto Presente"

  }

  res.json(era)


})


router.post("/ponerpresenteclaseprofs", async (req, res) => {
  let { id_clase, id_usuario } = req.body
  const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');

  console.log("La hora actual en Buenos Aires es:", horaBuenosAires);



  let existe = await pool.query('select * from cadia_asitencia_clases where id_clase=? and id_usuario =? ', [id_clase, id_usuario])
  let era
  if (existe.length > 0) {
    await pool.query('delete  from  cadia_asitencia_clases where id = ?', [existe[0]['id_asistencia']])
    era = "puesto Ausente"


  } else {
    await pool.query('insert into cadia_asitencia_clases set id_clase=?, id_usuario=?,fecha=?', [id_clase, id_usuario, horaBuenosAires])
    era = "puesto Presente"

  }/* 
 const clase = await pool.query('select * from dtc_clases_taller where id=?',[id_clase])
 const [year, month, day] = clase[0]['fecha'].split('-');

 // Convertir a números y eliminar ceros a la izquierda si existen
 const dayNum = parseInt(day, 10);
 const monthNum = parseInt(month, 10);

 // Formatear la fecha como D-M-YYYY
 const fechaTransformada = `${dayNum}-${monthNum}-${year}`;
 console.log(fechaTransformada)
 existe = await pool.query('select * from dtc_asistencia where id_usuario=? and fecha =? and id_tallerista=238', [id_usuario, fechaTransformada])
console.log(existe)
  if (existe.length == 0) {
    await pool.query('insert into dtc_asistencia set fecha=?, id_usuario=?,id_tallerista=238,hora=?', [fechaTransformada, id_usuario, horaBuenosAires])

  } ASITENCIA GENERAL DESACTIVADO */
  res.json(era)


})
router.post("/ponerpresenteclase", async (req, res) => {
  let { id_clase, id_usuario } = req.body
  console.log( id_clase, id_usuario)
  const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');

  console.log("La hora actual en Buenos Aires es:", horaBuenosAires);



  let existe = await pool.query('select * from dtc_asistencia_clase where id_clase=? and id_usuario =? ', [id_clase, id_usuario])
  let era
  if (existe.length > 0) {
    await pool.query('delete  from  dtc_asistencia_clase where id = ?', [existe[0]['id']])
    era = "puesto Ausente"


  } else {
    await pool.query('insert into dtc_asistencia_clase set id_clase=?, id_usuario=?,fecha=?', [id_clase, id_usuario, horaBuenosAires])
    era = "puesto Presente"

  }
 const clase = await pool.query('select * from dtc_clases_taller where id=?',[id_clase])
 const [year, month, day] = clase[0]['fecha'].split('-');

 // Convertir a números y eliminar ceros a la izquierda si existen
 const dayNum = parseInt(day, 10);
 const monthNum = parseInt(month, 10);

 // Formatear la fecha como D-M-YYYY
 const fechaTransformada = `${dayNum}-${monthNum}-${year}`;
 console.log(fechaTransformada)
 existe = await pool.query('select * from dtc_asistencia where id_usuario=? and fecha =? and id_tallerista=238', [id_usuario, fechaTransformada])
console.log(existe)
  if (existe.length == 0) {
    await pool.query('insert into dtc_asistencia set fecha=?, id_usuario=?,id_tallerista=238,hora=?', [fechaTransformada, id_usuario, horaBuenosAires])

  }
  res.json(era)


})


router.post("/ponerausenteclase", async (req, res) => {
  const { id } = req.body
  try {
    await pool.query('delete  from  dtc_asistencia_clase where id = ?', [id])
    res.json('Puesto ausente')


  } catch (error) {
    console.log(error)
    res.json('Error')
  }
})
router.post("/traertodoslosturnosfecha", async (req, res) => {
  const { fecha } = req.body
  try {
    console.log(fecha)
    const tunr = await pool.query('select * from dtc_turnos left join(select id as idp, nombre, apellido, dni from dtc_personas_psicologa) as sel on dtc_turnos.id_persona=sel.idp left join(select id as idu, nombre as nombrepsiq from usuarios) as sel2 on dtc_turnos.id_psico=sel2.idu where fecha=?', [fecha])
    const pendientes = await pool.query('select * from dtc_turnos  where estado="pendiente"')
    usuarios = await pool.query("select * from dtc_personas_psicologa left join (select fecha, id_persona  from dtc_turnos  where fecha=?) as sel on dtc_personas_psicologa.id=sel.id_persona ", [fecha])

    console.log(tunr)
    res.json([tunr, usuarios])
  } catch (error) {
    console.log(error)
    res.json(['Error', 'error'])
  }
})

router.post('/agregarvariasfechas', async (req, res) => {
  const { startDate, endDate, weekDays, schedules, profesional } = req.body;
console.log(startDate, endDate, weekDays, schedules, profesional)
  // Convertir las fechas desde string a objetos Date
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Mapear días de la semana a sus correspondientes valores numéricos
  const daysOfWeekMap = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6,
  };

  let current = start;
  const query = 'INSERT INTO cadia_turnos (fecha, detalle, id_psico,estado) VALUES (?, ?, ?, ?)';

  try {
    while (current <= end) {
      // Obtener el día de la semana en formato string y convertirlo a su valor numérico
      const currentDayOfWeek = current.getDay();
      const dayName = Object.keys(daysOfWeekMap).find(day => daysOfWeekMap[day] === currentDayOfWeek);
 

      // Verificar si el día actual está en la lista de días seleccionados
      if (weekDays.includes(dayName)) {
        for (const schedule of schedules) {
         
          // Ejecutar la consulta para cada horario en el día seleccionado
          await pool.query(query, [current.toISOString().split('T')[0], schedule, profesional.profesional,"Disponible"]);
        }
      }
      // Avanzar al siguiente día
      current.setDate(current.getDate() + 1);
    }
    res.status(200).send('Agregados correctamente');
  } catch (error) {
    console.error('Error saving to the database:', error);
    res.status(500).send('Internal server error');
  }
});


////////////////

router.post('/agregarvariasfechasdtc', async (req, res) => {
  const { startDate, endDate, weekDays, schedules, profesional } = req.body;
console.log(startDate, endDate, weekDays, schedules, profesional)
  // Convertir las fechas desde string a objetos Date
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Mapear días de la semana a sus correspondientes valores numéricos
  const daysOfWeekMap = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6,
  };

  let current = start;
  const query = 'INSERT INTO dtc_turnos (fecha, detalle, id_psico,estado) VALUES (?, ?, ?, ?)';

  try {console.log(start)
    console.log(end)
    while (current <= end) {
      console.log(current)
      // Obtener el día de la semana en formato string y convertirlo a su valor numérico
      const currentDayOfWeek = current.getDay();
      const dayName = Object.keys(daysOfWeekMap).find(day => daysOfWeekMap[day] === currentDayOfWeek);
 

      // Verificar si el día actual está en la lista de días seleccionados
      if (weekDays.includes(dayName)) {
        for (const schedule of schedules) {
         
          // Ejecutar la consulta para cada horario en el día seleccionado
          await pool.query(query, [current.toISOString().split('T')[0], schedule, profesional.profesional,"Disponible"]);
        }
      }
      // Avanzar al siguiente día
      current.setDate(current.getDate() + 1);
    }
    res.status(200).send('Agregados correctamente');
  } catch (error) {
    console.error('Error saving to the database:', error);
    res.status(500).send('Internal server error');
  }
});
///////////
router.post("/traertodoslosturnosfechacadia", async (req, res) => {
  const { fecha,id } = req.body
  try {
    console.log(fecha)
    let turn
    tunr = await pool.query('select * from cadia_turnos left join(select id as idp, nombre, apellido, dni from cadia_chicos) as sel on cadia_turnos.id_persona=sel.idp left join(select id as idu, nombre as nombrepsiq from usuarios) as sel2 on cadia_turnos.id_psico=sel2.idu where fecha=? ', [fecha])

    usuarios = await pool.query("select * from cadia_chicos left join (select fecha, id as idc  from cadia_turnos  where fecha=?) as sel on cadia_chicos.id=sel.idc ", [fecha])

    console.log(tunr)
    res.json([tunr, usuarios])
  } catch (error) {
    console.log(error)
    res.json(['Error', 'error'])
  }
})
router.get("/traertodoslosturnosaprobac", async (req, res) => {


  try {
    const tunr = await pool.query('select * from dtc_turnos join(select id as idp, nombre, apellido, dni from dtc_personas_psicologa) as sel on dtc_turnos.id_persona=sel.idp')
    const pendientes = await pool.query('select * from dtc_turnos  where estado="pendiente"')
    console.log(tunr)
    console.log('traertodoslosturnosaprobac')
    
    res.json([tunr, pendientes.length])
  } catch (error) {
    console.log(error)
    res.json(['Error', 'error'])
  }
})

router.get("/nivelar", async (req, res) => {


  const hoy = await pool.query('select * from dtc_asistencia where fecha="25-4-2024"')
  for (is in hoy) {
    yaesta = await pool.query('select * from dtc_asistencia where fecha="25-4-2024" and id_tallerista=238 and id_usuario=? ', [hoy[is]['id_usuario']])
    if (yaesta.length > 0) {
      console.log('esta')
    } else {
      await pool.query('insert into dtc_asistencia set  fecha="25-4-2024",id_tallerista=238, id_usuario=?', [hoy[is]['id_usuario']])

    }
  }
  res.json('era')


})






router.post("/traercumples", async (req, res) => {
  const { fecha, id } = req.body
  console.log(id)
  let prod
  let usuarios

  usuarios = await pool.query("select * from dtc_chicos where ", [id])

  console.log(usuarios)

  res.json([prod, usuarios])


})

router.post("/traerpresentesdeactividad", async (req, res) => {
  const { fecha, id } = req.body
  console.log(id)
  let prod
  let usuarios

  prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where id_actividad=? order by apellido", [id])
  usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where id_actividad=?) as sel on dtc_chicos.id=sel.id_usuario ", [id])



  res.json([prod, usuarios])


})






router.post("/traerparaturnos", async (req, res) => {
  const { fecha, id } = req.body
  console.log(fecha)

  prod = await pool.query("select * from dtc_turnos join (select id as idc, nombre, apellido,dni from dtc_personas_psicologa ) as sel on dtc_turnos.id_persona=sel.idc where fecha=?  order by apellido", [fecha])
  usuarios = await pool.query("select * from dtc_personas_psicologa left join (select fecha, id_persona  from dtc_turnos  where fecha=?) as sel on dtc_personas_psicologa.id=sel.id_persona ", [fecha])

  res.json([prod, usuarios, {}])


})

router.post("/traerparaturnoscadia", async (req, res) => {
  const { fecha, id } = req.body
  console.log(fecha)

  prod = await pool.query("select * from cadia_turnos join (select id as idc, nombre, apellido,dni from cadia_chicos ) as sel on cadia_turnos.id_persona=sel.idc where fecha=?  order by apellido", [fecha])
  usuarios = await pool.query("select * from cadia_chicos left join (select fecha, id_persona  from cadia_turnos  where fecha=?) as sel on cadia_chicos.id=sel.id_persona ", [fecha])

  res.json([prod, usuarios, {}])


})
router.post("/traerpresentes", async (req, res) => {
  const { fecha, id } = req.body

  const usua = await pool.query('select * from usuarios where id=?', [id])

  let prod = []
  let usuarios = []
  if ((usua[0].nivel == 20) || (usua[0].nivel == 22) || (usua[0].id == 262)) {
    prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  order by apellido", [fecha])
    usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=?) as sel on dtc_chicos.id=sel.id_usuario ", [fecha])
  } else {

    if (id == 246) {
      prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  and kid='kid1' order by apellido", [fecha])
      usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=? ) as sel on dtc_chicos.id=sel.id_usuario where kid='kid1' ", [fecha])

    } else {
      if (id == 244) {
        prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  and kid='kid2' order by apellido", [fecha])
        usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=? ) as sel on dtc_chicos.id=sel.id_usuario where kid='kid2' ", [fecha])

      } else {

        if (id == 245) {
          prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and kid='kid3' order by apellido", [fecha])
          usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=? ) as sel on dtc_chicos.id=sel.id_usuario where kid='kid3' ", [fecha])


        } else {
          if (id == 238) {
            prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  order by apellido", [fecha])
            usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=?) as sel on dtc_chicos.id=sel.id_usuario ", [fecha])

          }



        }
      }
    }



  }
  raciones = await pool.query("select sum(racion) from dtc_asistencia  where fecha=? and id_tallerista=238", [fecha])
  premerienda = await pool.query("select sum(premerienda) from dtc_asistencia  where fecha=? and id_tallerista=238", [fecha])
 
  prod1 = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? and sel.kid='kid1' order by apellido", [fecha, 238])
  prod2 = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? and sel.kid='kid2'order by apellido", [fecha, 238])
  prod3 = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? and sel.kid='kid3'order by apellido", [fecha, 238])

  ext = await pool.query('select * from dtc_chicos where dato_escolar="Horario extendido"')

  res.json([prod, usuarios, { kid1: prod1.length, kid2: prod2.length, kid3: prod3.length, horario: ext.length }, raciones[0]['sum(racion)'],premerienda[0]['sum(premerienda)']])


})



router.post("/establecerretiro", async (req, res) => {
  const { id, retiro } = req.body
  try {
    await pool.query('update dtc_asistencia set retiro=? where id=?', [retiro, id])
    res.json("Retiro establecido")
  } catch (error) {
    console.log(error)
    res.json('error')
  }

})
router.post("/establecerregreso", async (req, res) => {
  const { id, retorno } = req.body
  try {
    await pool.query('update dtc_asistencia set retorno=? where id=?', [retorno, id])
    res.json("Regreso establecido")
  } catch (error) {
    console.log(error)
    res.json('error')
  }

})

router.post("/borrarlegajo", async (req, res) => {
  const { id } = req.body
  console.log(id)
  try {
    const prod = await pool.query("select * from dtc_legajos where id=?", [id])
    console.log(prod[0]['ubicacion'])
    rutaImagen = path.join(__dirname, '../imagenesvendedoras', prod[0]['ubicacion']);
    console.log('rutaImagen')
    console.log(rutaImagen)
    try {
      await fse.unlink(rutaImagen);
    } catch (error) {
      console.log(error)
    }
    try {
      await pool.query('delete  from  dtc_legajos where id = ?', [id])

    } catch (error) {
      console.log(error)
    }

    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('No Borrado')
  }

})

////cron.schedule('0 9 * * 1-5'
 cron.schedule('45 12 * * 1-5', async () => {
  console.log('El sistema esta creando los cursos automaticamente');

  async function obtenerDiaDeLaSemana() {
    try {
      // Obtener la fecha actual en formato YYYY-MM-DD
      const fecha = new Date();
      const fechaa = fecha.toISOString().split("T")[0]; // Formato 2025-02-03
  
      console.log("Fecha actual:", fechaa);
  
      // Obtener el número del día de la semana (0 = Domingo, ..., 6 = Sábado)
      const dia = fecha.getDay();
  
      // Array de días de la semana
      const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  
      console.log("Hoy es:", diasSemana[dia]);
  
      // Lista de IDs de cursos
      const id_curso = [240, 265, 304, 306, 307, 308, 309];
  
      // Recorrer los cursos usando for...of para usar await correctamente
      for (const idcurso of id_curso) {
        let horarios = [];
  
        if (idcurso === 307) {
          // Si es curso 307, solo martes (2), jueves (4) y viernes (5)
          if (dia === 2 || dia === 4 || dia === 5) {
            horarios = ["14:00", "15:00", "16:00"];
          }
        } else if (idcurso === 304) {
          // Si es curso 304, usar horarios específicos
          if (dia >= 1 && dia <= 5) {
            horarios = ["14:30", "15:30", "16:30"];
          }
        } else if (idcurso === 309) {
          // Si es curso 309, solo un horario a las 17:00
          if (dia >= 1 && dia <= 5) {
            horarios = ["17:00"];
          }
        } else {
          // Para los demás cursos, de lunes a viernes (1-5)
          if (dia >= 1 && dia <= 5) {
            horarios = ["14:00", "15:00", "16:00"];
          }
        }
  
        // Insertar horarios en la base de datos
        if (horarios.length > 0) {
          await Promise.all(
            horarios.map((hora) =>
              pool.query(
                "INSERT INTO dtc_clases_taller (fecha, id_tallerista, titulo, dia, hora) VALUES (?, ?, ?, ?, ?)",
                [fechaa, idcurso, "Clase del día " + diasSemana[dia], diasSemana[dia], hora]
              )
            )
          );
          console.log(`Horarios insertados para id_curso ${idcurso}:`, horarios);
        }
      }
    } catch (error) {
      console.error("Error al insertar horarios:", error);
    }
  }
  
  
  
  
  // Llamar a la función
 obtenerDiaDeLaSemana();
});
 


module.exports = router

