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

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../imagenesvendedoras'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });



router.get('/traerclasestaller/:id', async (req, res) => {
  id = req.params.id
try {
 const clas= await pool.query(' select * from  dtc_clases_taller  where id_tallerista=?', [ id])
 console.log(clas)
res.json(clas)
} catch (error) {
  console.log(error)
  res.json('Error')
}


})


router.get('/sumar1/:id', async (req, res) => {
  id = req.params.id
try {
  await pool.query(' UPDATE dtc_asistencia SET racion = racion + 1 where id=?', [ id])
 

} catch (error) {
  console.log(error)

}

res.json('')
})

router.get('/sumar1p/:id', async (req, res) => {
  id = req.params.id
try {
  await pool.query(' UPDATE dtc_asistencia SET premerienda = premerienda + 1 where id=?', [ id])
 

} catch (error) {
  console.log(error)

}

res.json('')
})



router.get('/restar1/:id', async (req, res) => {
  id = req.params.id
try {
  await pool.query(' UPDATE dtc_asistencia SET racion = racion - 1 where id=?', [ id])
 


} catch (error) {
  console.log(error)
}
res.json('')

})
router.get('/restar1p/:id', async (req, res) => {
  id = req.params.id
try {
  await pool.query(' UPDATE dtc_asistencia SET premerienda = premerienda - 1 where id=?', [ id])
 


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




router.get('/listadepersonaspsiq/', async (req, res) => {

  const chiques = await pool.query('select * from dtc_personas_psicologa order by apellido')

  env={
    total:chiques.length,
    kid1:5,
    kid2:5,
    kid3:5,
    sind:5
  }
  res.json([chiques,env])
})


router.get('/listachiques/', async (req, res) => {

  const chiques = await pool.query('select * from dtc_chicos order by apellido')
  const kid1 = await pool.query('select * from dtc_chicos where kid="kid1" ')
  const kid2 = await pool.query('select * from dtc_chicos where kid="kid2"')
  const kid3 = await pool.query('select * from dtc_chicos where kid="kid3"')
  const sind = await pool.query('select * from dtc_chicos where kid not in("kid1","kid2","kid3")')
  env={
    total:chiques.length,
    kid1:kid1.length,
    kid2:kid2.length,
    kid3:kid3.length,
    sind:sind.length
  }
  res.json([chiques,env])
})

router.get('/datosdechique/:id', async (req, res) => {
  const id = req.params.id
  const chiques = await pool.query('select * from dtc_chicos where id =?', [id])
  try {
    console.log(chiques[0]['foto'])
    if (chiques[0]['foto'] === null) {
      imagenBase64 = null

    } else {
      rutaImagen = path.join(__dirname, '../imagenesvendedoras', chiques[0]['foto']);
      imagenBuffer = fs.readFileSync(rutaImagen);
      imagenBase64 = imagenBuffer.toString('base64');
    }
const vinculos = await pool.query('select * from dtc_vinculo join (select id as idc, nombre, apellido from dtc_chicos ) as sel on dtc_vinculo.id_vinculo=sel.idc where id_usuario=?',[id])
    res.json([chiques, imagenBase64,vinculos])
  } catch (error) {
    console.log(error)
    res.json([])
  }

})


router.get('/datosdepersonapsi/:id', async (req, res) => {
  const id = req.params.id
  const chiques = await pool.query('select * from dtc_personas_psicologa where id =?', [id])
  

  try{
    res.json([chiques])
  } catch (error) {
    res.json([])
  }

})
router.get('/traerasistencia/:id', async (req, res) => {
  const id = req.params.id
  const asis = await pool.query('select count(usuario),usuario,idu from dtc_asistencia join(select id as idu, usuario from usuarios) as sel on dtc_asistencia.id_tallerista=sel.idu where id_usuario =? group by usuario,idu', [id])

  const resultadosConvertidos = asis.map(resultado => ({

    count: Number(resultado['count(usuario)']),
    taller: resultado.usuario,// Convertir BigInt a Number
    id_tallerista: resultado.idu
  }));

  console.log(resultadosConvertidos)

  res.json([resultadosConvertidos])

})
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


router.post("/modificarusuariopsiq", async (req, res) => {
  let { id, nombre, apellido, kid,fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda } = req.body

  console.log(id, nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda)
  try {
    if (observaciones == undefined) {
      observaciones = "Sin observaciones"
    }
    if (fecha_nacimiento == undefined) {
      fecha_nacimiento = "Sin asignar"
    }

    await pool.query('update dtc_personas_psicologa  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=? where id=?', [nombre, apellido, fecha_nacimiento, observaciones,  primer_ingreso, admision, dni, domicilio, telefono, id])

    res.json('Modificado')
  } catch (error) {
    console.log(error)
    res.json('No modificado')
  }

})

router.post("/modificarusuario", async (req, res) => {
  let {talle, id, nombre, apellido, kid,fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, escuela,grado,fines} = req.body

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
    await pool.query('update dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=?,kid=?,escuela=?,grado=?,fines=?,talle=? where id=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda,kid,escuela,grado,fines,talle, id])

    res.json('Modificado')
  } catch (error) {
    console.log(error)
    res.json('No modificado')
  }

})

router.post("/borrarturno", async (req, res) => {
  let { id} = req.body

  try {
 

    await pool.query('delete from dtc_turnos  where id=?', [id])

    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('No Borrado')
  }

})

router.post("/traerasistenciasdetaller", async (req, res) => {
  let { id_tallerista, id_usuario } = req.body
  const resp = await pool.query('select * from dtc_asistencia where id_tallerista=? and id_usuario=?', [id_tallerista, id_usuario])
  res.json([resp])
})

router.post("/nuevochique", async (req, res) => {
  let { nombre, apellido, fecha_nacimiento, kid,observaciones, talle, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda, escuela, grado, fines } = req.body

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
  await pool.query('insert dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=?,escuela=?,grado=?,fines=?,kid=?,talle=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda,escuela,grado,fines,kid,talle])

  res.json('Agregado')
    }else{
      const yahay =  await pool.query('select * from dtc_chicos where dni=?',[dni])
      if(yahay.length>0){
        res.json('Error, dni ya tegistrado')
      }else{
        await pool.query('insert dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=?,escuela=?,grado=?,fines=?,talle=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_contacto, primer_ingreso, admision, dni, domicilio, telefono, autorizacion_imagen, fotoc_dni, fotoc_responsable, tel_responsable, visita_social, egreso, aut_retirar, dato_escolar, hora_merienda,escuela,grado,fines,talle])
  
        res.json('Agregado')
      }

    }


  } catch (error) {
    console.log(error)
    res.json('No agregado')
  }

})



router.post("/nuevaclasetaller", async (req, res) => {
  let { id_tallerista,fecha,titulo} = req.body
console.log( id_tallerista,fecha,titulo)
try {
  await pool.query('insert dtc_clases_taller  set id_tallerista=?, fecha=?,titulo=?', [id_tallerista,fecha,titulo])

  res.json("realizado")
} catch (error) {
  console.log(error)
  res.json('no realizado')
}

})
router.post("/nuevapersonapsiq", async (req, res) => {
  let { nombre, apellido, fecha_nacimiento, observaciones,  primer_ingreso,  dni, domicilio, telefono } = req.body
console.log(nombre, apellido, fecha_nacimiento, observaciones,  primer_ingreso,  dni, domicilio, telefono)

  try {
    if (observaciones == undefined) {
      observaciones = "Sin observaciones"
    }
    if (fecha_nacimiento == undefined) {
      fecha_nacimiento = "Sin asignar"
    }


    await pool.query('insert dtc_personas_psicologa  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_ingreso=?,dni=?,domicilio=?,telefono=?', [nombre, apellido, fecha_nacimiento, observaciones, primer_ingreso, dni, domicilio, telefono])

    res.json('Agregado')
  } catch (error) {
    console.log(error)
    res.json('No agregado')
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
  const { id_usuario } = req.body
  try {
    const existe = await pool.query('select * from dtc_actividades_chicos join (select id as idu, nombre from usuarios) as sel on dtc_actividades_chicos.id_tallerista=sel.idu where id_usuario =? order by id desc', [id_usuario])
    res.json(existe)
  } catch (error) {
    console.log(error)
    res.json([])
  }
})


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
  const { detalle, id_usuario, titulo, id_tallerista, fecha } = req.body

  console.log(detalle, id_usuario, fecha, id_tallerista)
  await pool.query('insert into dtc_actividades_chicos set id_usuario=?, id_tallerista=?,titulo=?,detalle=?,fecha=?', [id_usuario, id_tallerista, titulo, detalle, fecha])

  res.json('Realizado')


})



router.get('/traerpresentesdeclase/:id', async (req, res) => {
  const id = req.params.id
    const existe = await pool.query('select * from dtc_asistencia_clase join (select id as idc,nombre from dtc_chicos) as sel on dtc_asistencia_clase.id_usuario=sel.idc  where id_clase=?',[id])//presentes
   console.log(existe)
    usuarios = await pool.query("select * from dtc_chicos left join (select id as ida  from dtc_asistencia_clase where id=? ) as sel on dtc_chicos.id=sel.ida ", [id])
//todos
    res.json([existe,usuarios])
  
  
  })
  

router.get('/traeretapacocina/:id', async (req, res) => {
const id = req.params.id
  const existe = await pool.query('select * from dtc_etapa where id_usuario=?',[id])

  res.json([existe])


})



router.get('/traertalleres/', async (req, res) => {

  const existe = await pool.query('select * from usuarios where nivel=21 ')

  res.json([existe])


})

router.get('/descargar/:id', async (req, res) => {
  const id = req.params.id;
  const nomb = await pool.query('select * from dtc_legajos where id=?', [id])
  filePath = path.join(__dirname, '../imagenesvendedoras', nomb[0]['ubicacion']);
  console.log(filePath)
  // const filePath = __dirname + '/uploads/' + nomb[0]['ubicacion'];

  res.download(filePath);
});



router.post("/consultarasitencias", async (req, res) => {
  let { fecha_inicio, fecha_fin } = req.body
  ///presentes mensuales 
  console.log(fecha_inicio, fecha_fin )

  const query = `
    SELECT *
    FROM dtc_asistencia
    WHERE STR_TO_DATE(fecha, '%d-%m-%Y') BETWEEN ? AND ?
  `;
   console.log(query)
  pool.query(query, [fecha_inicio, fecha_fin], (error, results) => {
    if (error) console.log(error);
    console.log(results);
  });

})

router.post("/traerestadisticas", async (req, res) => {
  let { fecha } = req.body
  ///presentes mensuales 
  fecha = fecha.fecha
  console.log(fecha)
  // Divide la fecha usando el guión ('-') como separador
  let [dia, mes, año] = fecha.split('-');
if (dia.length==1){
  diacumple="0"+dia
}else{diacumple=dia}
if (mes.length==1){
  mescumple="0"+mes
}else{mescumple=mes}
console.log("'_%"+mescumple+"-"+diacumple+"'")
const cumple = await pool.query('select * from dtc_chicos where fecha_nacimiento like ?',["%"+mescumple+"-"+diacumple])
console.log("cumple",cumple)
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
    semanapasada:semanapasada,
    cumple:cumple

  }
  console.log(estad)
  res.json([estad])
})


router.post("/nuevaetapa", async (req, res) => {
  let { fecha, descripcion, expediente,id_usuario,titulo} = req.body
  console.log(fecha, descripcion, expediente,id_usuario,titulo)
  if (titulo == undefined){
    titulo="Sin completar"
  }

if (descripcion == undefined){
  descripcion="Sin completar"
}

if (expediente == undefined){
  expediente="Sin completar"
}

try {
 await pool.query('insert into dtc_etapa set  fecha=?,descripcion=?,expediente=?, id_usuario=?,titulo=?', [fecha, descripcion, expediente,id_usuario,titulo])
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
if (dia.length==1){
  diacumple="0"+dia
}else{diacumple=dia}
if (mes.length==1){
  mescumple="0"+mes
}else{mescumple=mes}
console.log("'_%"+mescumple+"-"+diacumple+"'")
const cumple = await pool.query('select * from dtc_chicos where fecha_nacimiento like ?',["%"+mescumple+"-"+diacumple])
const estemes = await pool.query('select * from dtc_chicos where fecha_nacimiento like ?',["%"+"-"+mescumple+"-"+"%"])

res.json([cumple,estemes])
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

router.post("/determinarvinculo", async (req, res) => {
  const { id_usuario, id_vinculo,vinculoo} = req.body
  try {
    await pool.query('insert into dtc_vinculo set id_usuario=?,id_vinculo=?,vinculoo=?', [id_usuario, id_vinculo,vinculoo])

    res.json('realizado')
  } catch (error) {
   // console.log(error)
    res.json('error, algo sucedio')
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
  const { fecha, horario,id_psic} = req.body
  console.log(fecha, horario,id_psic )
  try {
    await pool.query('insert into dtc_turnos set fecha=?, detalle=?,id_psico=?, estado="Disponible"', [fecha, horario,id_psic])
res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }

})



router.post("/agendarturno", async (req, res) => {
  let {  id, id_persona } = req.body

  try {
    const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');
    console.log( id, id_persona)
    await pool.query('update dtc_turnos set id_persona=?,estado="Agendado",hora=? where id=?', [id_persona,horaBuenosAires+'-'+(new Date(Date.now())).toLocaleDateString(), id])
res.json('agendado')  
  } catch (error) {
   console.log(error)
   res.json('no agendado')   
  }


})

router.post("/sacarturno", async (req, res) => {
  let {  id } = req.body
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
    await pool.query('insert into dtc_asistencia set fecha=?, id_usuario=?,id_tallerista=?,hora=?', [fecha, id, id_tallerista,horaBuenosAires])
    era = "puesto Presente"
   
  }

  res.json(era)


})

router.post("/ponerpresenteclase", async (req, res) => {
  let { id_clase, id_usuario } = req.body
  const horaBuenosAires = moment().tz('America/Argentina/Buenos_Aires').format('HH:mm:ss');

  console.log("La hora actual en Buenos Aires es:", horaBuenosAires);



  const existe = await pool.query('select * from dtc_asistencia_clase where id_clase=? and id_usuario =? ', [id_clase, id_usuario])
  let era
  if (existe.length > 0) {
    await pool.query('delete  from  dtc_asistencia_clase where id = ?', [existe[0]['id']])
    era = "puesto Ausente"


  } else {
    await pool.query('insert into dtc_asistencia_clase set id_clase=?, id_usuario=?,fecha=?', [id_clase, id_usuario,horaBuenosAires])
    era = "puesto Presente"
   
  }

  res.json(era)


})


router.post("/ponerausenteclase", async (req, res) => {
  const { id} = req.body
  try {
    await pool.query('delete  from  dtc_asistencia_clase where id = ?', [id])
    res.json('Puesto ausente')


  } catch (error) {
    console.log(error)
    res.json('Error')
  }
})
router.post("/traertodoslosturnosfecha", async (req, res) => {
  const { fecha, } = req.body
  try {
    const tunr = await pool.query('select * from dtc_turnos left join(select id as idp, nombre, apellido, dni from dtc_personas_psicologa) as sel on dtc_turnos.id_persona=sel.idp left join(select id as idu, nombre as nombrepsiq from usuarios) as sel2 on dtc_turnos.id_psico=sel2.idu where fecha=?',[fecha])
    const pendientes =await pool.query('select * from dtc_turnos  where estado="pendiente"')
    usuarios = await pool.query("select * from dtc_personas_psicologa left join (select fecha, id_persona  from dtc_turnos  where fecha=?) as sel on dtc_personas_psicologa.id=sel.id_persona ", [fecha])

    console.log(tunr)
    res.json([tunr,usuarios])
  } catch (error) {
    console.log(error)
    res.json(['Error','error'])
  }
})
router.get("/traertodoslosturnosaprobac", async (req, res) => {
 

  try {
    const tunr = await pool.query('select * from dtc_turnos join(select id as idp, nombre, apellido, dni from dtc_personas_psicologa) as sel on dtc_turnos.id_persona=sel.idp')
    const pendientes =await pool.query('select * from dtc_turnos  where estado="pendiente"')
    console.log(tunr)
    res.json([tunr,pendientes.length])
  } catch (error) {
    console.log(error)
    res.json(['Error','error'])
  }
})

router.get("/nivelar", async (req, res) => {
 

  const hoy = await pool.query('select * from dtc_asistencia where fecha="25-4-2024"')
  for (is in hoy ){
    yaesta =await pool.query('select * from dtc_asistencia where fecha="25-4-2024" and id_tallerista=238 and id_usuario=? ', [hoy[is]['id_usuario']])
   if(yaesta.length>0){
    console.log('esta')
   }else{
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

  res.json([prod, usuarios,{}])


})


router.post("/traerpresentes", async (req, res) => {
  const { fecha, id } = req.body
console.log(id)
  const usua = await pool.query('select * from usuarios where id=?', [id])
  console.log('uaua',usua)
  let prod=[]
  let usuarios=[]
  if ((usua[0].nivel == 20) || (usua[0].nivel == 22)|| (usua[0].id == 262)) {
    prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  order by apellido", [fecha])
    usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=?) as sel on dtc_chicos.id=sel.id_usuario ", [fecha])
  } else {

    if(id==246){
      prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  and kid='kid1' order by apellido", [fecha])
      usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=? ) as sel on dtc_chicos.id=sel.id_usuario where kid='kid1' ", [fecha])
    
    }else{
      if(id==244){
        prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  and kid='kid2' order by apellido", [fecha])
        usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=? ) as sel on dtc_chicos.id=sel.id_usuario where kid='kid2' ", [fecha])
      
      }else{
      
        if(id==245){
          prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and kid='kid3' order by apellido", [fecha])
          usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=? ) as sel on dtc_chicos.id=sel.id_usuario where kid='kid3' ", [fecha])
        
      
      }else{  
        if(id==238){
          prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?  order by apellido", [fecha])
          usuarios = await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=?) as sel on dtc_chicos.id=sel.id_usuario ", [fecha])

      }


      
    }
  }
}
   
  
  
  }
  raciones = await pool.query("select sum(racion) from dtc_asistencia  where fecha=? and id_tallerista=238", [fecha])
console.log(raciones)
  prod1 = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? and sel.kid='kid1' order by apellido", [fecha, 238])
  prod2 = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? and sel.kid='kid2'order by apellido", [fecha, 238])
  prod3 = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni,kid from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? and sel.kid='kid3'order by apellido", [fecha, 238])

ext = await pool.query('select * from dtc_chicos where dato_escolar="Horario extendido"')

  res.json([prod, usuarios,{kid1:prod1.length,kid2:prod2.length,kid3:prod3.length,horario:ext.length},raciones[0]['sum(racion)']])


})



router.post("/establecerretiro", async (req, res) => {
  const { id, retiro} = req.body
try {
  await pool.query('update dtc_asistencia set retiro=? where id=?', [retiro, id])
res.json("Retiro establecido")
} catch (error) {
  console.log(error)
  res.json('error')
}

})
router.post("/establecerregreso", async (req, res) => {
  const { id, retorno} = req.body
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
module.exports = router

