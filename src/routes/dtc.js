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


const storage = multer.diskStorage({
  destination: path.join(__dirname, '../imagenesvendedoras'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });





router.get('/clasesdetaller/:id',  async (req, res) => {
  id= req.params.id
  console.log(id)
  const clases = await pool.query('select fecha,id_tallerista, count(fecha) from dtc_asistencia where id_tallerista=? group by fecha,id_tallerista',[id])
 
  const resultadosConvertidos = clases.map(resultado => ({
    fecha: resultado.fecha,
    count: Number(resultado['count(fecha)']) // Convertir BigInt a Number
  }));
  
  console.log(resultadosConvertidos)

  res.json(resultadosConvertidos)
})


router.get('/listachiques/',  async (req, res) => {

    const chiques = await pool.query('select * from dtc_chicos order by apellido')
    res.json([chiques])
})

router.get('/datosdechique/:id',  async (req, res) => {
const id = req.params.id
  const chiques = await pool.query('select * from dtc_chicos where id =?',[id])
  try {
    console.log(chiques[0]['foto'])
    if( chiques[0]['foto']  === null){
      imagenBase64=null
     
    }else{
      rutaImagen = path.join(__dirname, '../imagenesvendedoras', chiques[0]['foto']);
      imagenBuffer = fs.readFileSync(rutaImagen);
      imagenBase64 = imagenBuffer.toString('base64');
    }
  
    res.json([chiques,imagenBase64])
  } catch (error) {
    res.json([])
  }

})



router.get('/traerasistencia/:id', async (req, res) => {
  const id = req.params.id
  const asis =  await pool.query('select count(usuario),usuario,idu from dtc_asistencia join(select id as idu, usuario from usuarios) as sel on dtc_asistencia.id_tallerista=sel.idu where id_usuario =? group by usuario,idu',[id])

  const resultadosConvertidos = asis.map(resultado => ({
    
    count: Number(resultado['count(usuario)']),
    taller: resultado.usuario,// Convertir BigInt a Number
    id_tallerista:resultado.idu
  }));
  
  console.log(resultadosConvertidos)

  res.json([resultadosConvertidos])

})
router.get('/traerfoto/:id', async (req, res) => {
  const id = req.params.id
  const productosdeunapersona =  await pool.query('select * from dtc_legajos where id =?',[id])
  rutaImagen = path.join(__dirname, '../imagenesvendedoras', productosdeunapersona[0]['ubicacion']);
  imagenBase64=""
  console.log(productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-3] +productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-2]+productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-1])
 if(productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-3] +productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-2]+productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-1] ==="pdf"){
  console.log('pdf')
  imagenBase64=rutaImagen
  res.sendFile(rutaImagen)


 }else{
  console.log('otro')
  imagenBuffer = fs.readFileSync(rutaImagen);
  imagenBase64 = imagenBuffer.toString('base64');
  res.json([imagenBase64,productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-3] +productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-2]+productosdeunapersona[0]['ubicacion'][productosdeunapersona[0]['ubicacion'].length-1]])

 }
 

})
  router.get('/listadelegajos/:id', async (req, res) => {
    const id = req.params.id

    const productosdeunapersona =  await pool.query('select * from dtc_legajos where id_usuario =?',[id])
    enviar=[]
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
      const traerfoto= await pool.query('select * from dtc_chicos where id = ? ',[id])
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
      await pool.query('update dtc_chicos  set foto=? where id=?', [fileName,id])
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
    await pool.query('insert into dtc_legajos set nombre=?, id_usuario=?,descripcion=?,ubicacion=?', [nombre, id, descripcion,fileName])
    res.json(`Realizado`)
  } catch (error) {
    console.log(error)
    res.json('No escribiste nadaaa')
  }


})


router.post("/modificarusuario", async (req, res) => {
  let { id,nombre, apellido, fecha_nacimiento, observaciones,primer_contacto,primer_ingreso,admision,dni,domicilio,telefono,autorizacion_imagen,fotoc_dni,fotoc_responsable,tel_responsable,visita_social,egreso,aut_retirar,dato_escolar,hora_merienda} = req.body

console.log( id,nombre, apellido, fecha_nacimiento, observaciones,primer_contacto,primer_ingreso,admision,dni,domicilio,telefono,autorizacion_imagen,fotoc_dni,fotoc_responsable,tel_responsable,visita_social,egreso,aut_retirar,dato_escolar,hora_merienda)
  try {
if (observaciones ==undefined){
  observaciones="Sin observaciones"
}
if (fecha_nacimiento ==undefined){
  fecha_nacimiento="Sin asignar"
}

    await pool.query('update dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=? where id=?', [nombre, apellido, fecha_nacimiento, observaciones,primer_contacto,primer_ingreso,admision,dni,domicilio,telefono,autorizacion_imagen,fotoc_dni,fotoc_responsable,tel_responsable,visita_social,egreso,aut_retirar,dato_escolar,hora_merienda,id])

    res.json('Modificado')
  } catch (error) {
    console.log(error)
    res.json('No modificado')
  }

})



router.post("/traerasistenciasdetaller", async (req, res) => {
  let {id_tallerista,id_usuario} = req.body
const resp = await pool.query('select * from dtc_asistencia where id_tallerista=? and id_usuario=?',[id_tallerista,id_usuario])
res.json([resp])
})

router.post("/nuevochique", async (req, res) => {
    let { nombre, apellido, fecha_nacimiento, observaciones,primer_contacto,primer_ingreso,admision,dni,domicilio,telefono,autorizacion_imagen,fotoc_dni,fotoc_responsable,tel_responsable,visita_social,egreso,aut_retirar,dato_escolar,hora_merienda} = req.body
  
  
    try {
  if (observaciones ==undefined){
    observaciones="Sin observaciones"
  }
  if (fecha_nacimiento ==undefined){
    fecha_nacimiento="Sin asignar"
  }
 
  
      await pool.query('insert dtc_chicos  set nombre=?,apellido=?,fecha_nacimiento=?,observaciones=?,primer_contacto=?,primer_ingreso=?,admision=?,dni=?,domicilio=?,telefono=?,autorizacion_imagen=?,fotoc_dni=?,fotoc_responsable=?,tel_responsable=?,visita_social=?,egreso=?,aut_retirar=?,dato_escolar=?,hora_merienda=?', [nombre, apellido, fecha_nacimiento, observaciones,primer_contacto,primer_ingreso,admision,dni,domicilio,telefono,autorizacion_imagen,fotoc_dni,fotoc_responsable,tel_responsable,visita_social,egreso,aut_retirar,dato_escolar,hora_merienda])

      res.json('Agregado')
    } catch (error) {
      console.log(error)
      res.json('No agregado')
    }
  
  })
  

  router.post("/borraractividadchico",  async (req, res) => {
    const {id} = req.body
    
    try {
      await pool.query('delete  from  dtc_actividades_chicos where id = ?', [id])
      res.json('Realizado')

    } catch (error) {
      console.log(error)
      res.json('No realizado')
    }


  })
  
  router.post("/borraractividad",  async (req, res) => {
    const {id} = req.body
    
    try {
      await pool.query('delete  from  dtc_actividades where id = ?', [id])
      res.json('Realizado')

    } catch (error) {
      console.log(error)
      res.json('No realizado')
    }


  })
  
  
  
  router.post("/traertodaslasactividades",  async (req, res) => {
    const {fecha} = req.body
    try {
      console.log(fecha)
      const existe = await pool.query('select * from dtc_actividades join (select id as idu, nombre from usuarios) as sel on dtc_actividades.acargo=sel.idu where  fecha =?',[fecha])
      console.log(existe)
   res.json(existe)
    } catch (error) {
      console.log(error)
      res.json([])
    }
    })



    

 router.post("/traeractividadeschico",  async (req, res) => {
  const {id_usuario} = req.body
  try {
    const existe = await pool.query('select * from dtc_actividades_chicos join (select id as idu, nombre from usuarios) as sel on dtc_actividades_chicos.id_tallerista=sel.idu where id_usuario =? order by id desc',[id_usuario])
 res.json(existe)
  } catch (error) {
    console.log(error)
    res.json([])
  }
  })

  
  router.post("/traeractividades",  async (req, res) => {
  const {fecha, id_usuario} = req.body
  try {
    const existe = await pool.query('select * from dtc_actividades where acargo=? ',[id_usuario])
 res.json(existe)
  } catch (error) {
    console.log(error)
    res.json([])
  }
  })

  


  
  router.post("/nuevaactividad",  async (req, res) => {
    const {detalle, id_tallerista, fecha,titulo} = req.body

  console.log(detalle, id_tallerista, fecha, titulo)
   await pool.query('insert into dtc_actividades set fecha=?, acargo=?,titulo=?,detalle=?', [fecha, id_tallerista,titulo,detalle])

    res.json('Realizado')
  
  
  })
  router.post("/nuevaactividadchico",  async (req, res) => {
    const {detalle, id_usuario, titulo,id_tallerista,fecha} = req.body

  console.log(detalle, id_usuario, fecha, id_tallerista)
 await pool.query('insert into dtc_actividades_chicos set id_usuario=?, id_tallerista=?,titulo=?,detalle=?,fecha=?', [id_usuario, id_tallerista,titulo,detalle,fecha])

    res.json('Realizado')
  
  
  })
  


  


  router.get('/traertalleres/',async (req, res) => {

    const existe = await pool.query('select * from usuarios where nivel=21 ')

    res.json([existe])


  })

  router.get('/descargar/:id',async (req, res) => {
    const id = req.params.id;
    const nomb = await pool.query('select * from dtc_legajos where id=?',[id])
    filePath = path.join(__dirname, '../imagenesvendedoras', nomb[0]['ubicacion']);
console.log(filePath)
   // const filePath = __dirname + '/uploads/' + nomb[0]['ubicacion'];
  
    res.download(filePath);
  });

  

  router.post("/traerestadisticas",  async (req, res) => {
    const {fecha} = req.body
    ///presentes mensuales 
    // Divide la fecha usando el guión ('-') como separador
const [dia, mes, año] = fecha.split('-');

// Imprime los valores separados
console.log('Día:', dia);
console.log('Mes:', mes);
console.log('Año:', año);
console.log('Mes pasado:', mes-1);
if (mes==1){
  mesanterior=12
  anioanterior=año-1
}else{mesanterior=mes-1
anioanterior=año}

const presentes_totales = await pool.query('SELECT * FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238',[mes,año])
    const presentes_totales_reales = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238',[mes,año])
    presentes_totales_reales_mespasado= await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238',[mesanterior,anioanterior])
   
    const date = parse(fecha, 'dd-MM-yyyy', new Date());
    console.log("date:",date)
   // const fecha2=  parse(date, 'dd-MM-yyyy', new Date());

//console.log("lunes:", startOfWeek(date, { weekStartsOn: 1 }) )
const fechaFormateada = format(startOfWeek(date, { weekStartsOn: 1 }), 'd-M-yyyy', { locale: es });
 console.log("lunesformato",fechaFormateada)
 const [dias, mess, años] = fecha.split('-');
// const presentes_totales_semana = await pool.query('SELECT * FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238',[mess,años])
 //const presentes_totales_reales_semana = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE MONTH(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? AND YEAR(STR_TO_DATE(fecha, "%d-%m-%Y")) = ? and id_tallerista=238',[mess,años])
 console.log(format(parse(fecha, 'd-M-yyyy', new Date()), 'yyyy-MM-dd'),format(parse(fechaFormateada, 'd-M-yyyy', new Date()), 'yyyy-MM-dd'))
const pres_Semanal = await pool.query('SELECT * FROM dtc_asistencia WHERE STR_TO_DATE(fecha, "%d-%m-%Y") >= STR_TO_DATE(?, "%d-%m-%Y") AND STR_TO_DATE(fecha, "%d-%m-%Y") <= STR_TO_DATE(?, "%d-%m-%Y") and id_tallerista=238 ',[fechaFormateada,fecha]);
const pres_Semanal_real = await pool.query('SELECT distinct(id_usuario) FROM dtc_asistencia WHERE STR_TO_DATE(fecha, "%d-%m-%Y") >= STR_TO_DATE(?, "%d-%m-%Y") AND STR_TO_DATE(fecha, "%d-%m-%Y") <= STR_TO_DATE(?, "%d-%m-%Y") and id_tallerista=238 ',[fechaFormateada,fecha]);
 const estad ={
  presentes_totales:presentes_totales.length,
  presentes_totales_reales:presentes_totales_reales.length,
  presentes_totales_reales_mespasado:presentes_totales_reales_mespasado.length,
  presentes_totales_semana:pres_Semanal.length,
  presentes_totales_reales_semana:pres_Semanal_real.length,
  
 }
 console.log(estad)
    res.json([estad])
  })


  router.post("/ponerpresente",  async (req, res) => {
    const {fecha, id, id_tallerista} = req.body
    const existe = await pool.query('select * from dtc_asistencia where id_usuario=? and fecha =? and id_tallerista=?',[id,fecha,id_tallerista])
   let era
    if (existe.length>0){
      await pool.query('delete  from  dtc_asistencia where id = ?', [existe[0]['id']])
      era="puesto Ausente"
    }else{
      await pool.query('insert into dtc_asistencia set fecha=?, id_usuario=?,id_tallerista=?', [fecha, id,id_tallerista])
      era="puesto Presente"
    }

    res.json(era)
  
  
  })
  router.post("/traerpresentes",  async (req, res) => {
    const {fecha,id} = req.body

    const usua = await pool.query('select * from usuarios where id=?',[id])

    let prod
let usuarios
    if((usua[0].nivel==20) || (usua[0].nivel==22) ){
        prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? order by apellido",[fecha,238])
         usuarios =  await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=?and id_tallerista=?) as sel on dtc_chicos.id=sel.id_usuario ",[fecha,238])
    }else{
        prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=? and id_tallerista=? order by apellido",[fecha,id])
         usuarios =  await pool.query("select * from dtc_chicos left join (select fecha, id_usuario, id_tallerista from dtc_asistencia  where fecha=? and id_tallerista=?) as sel on dtc_chicos.id=sel.id_usuario ",[fecha,id])
    }
  
   
    res.json([prod,usuarios])
  
  
  })


  router.post("/borrarlegajo",  async (req, res) => {
    const {id} = req.body
    console.log(id)
    try {
      const  prod = await pool.query("select * from dtc_legajos where id=?",[id])
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

