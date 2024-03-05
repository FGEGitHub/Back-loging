const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database')

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






router.get('/listachiques/',  async (req, res) => {

    const chiques = await pool.query('select * from dtc_chicos order by apellido')
    res.json([chiques])
})

router.get('/datosdechique/:id',  async (req, res) => {
const id = req.params.id
  const chiques = await pool.query('select * from dtc_chicos where id =?',[id])
  res.json([chiques])
})



  router.get('/listadelegajos/:id', async (req, res) => {
    const id = req.params.id

    const productosdeunapersona =  await pool.query('select * from dtc_legajos where id_usuario =?',[id])
    enviar=[]
    //  tareas = await pool.query('select * from producto_venta where id_usuario=? ',[id])
    let rutaImagen
    for (i in productosdeunapersona) {
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
  enviar.push(nuevo)
    }

    res.json(enviar);
  
  
    //  res.json(tareas)
  
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
    const existe = await pool.query('select * from dtc_actividades where acargo=? and fecha =?',[id_usuario,fecha])
 res.json(existe)
  } catch (error) {
    console.log(error)
    res.json([])
  }
  })

  


  
  router.post("/nuevaactividad",  async (req, res) => {
    const {detalle, id_usuario, fecha,nombre} = req.body

  console.log(detalle, id_usuario, fecha, nombre)
   await pool.query('insert into dtc_actividades set fecha=?, acargo=?,titulo=?,detalle=?', [fecha, id_usuario,nombre,detalle])

    res.json('Realizado')
  
  
  })
  router.post("/nuevaactividadchico",  async (req, res) => {
    const {detalle, id_usuario, titulo,id_tallerista,fecha} = req.body

  console.log(detalle, id_usuario, fecha, id_tallerista)
 await pool.query('insert into dtc_actividades_chicos set id_usuario=?, id_tallerista=?,titulo=?,detalle=?,fecha=?', [id_usuario, id_tallerista,titulo,detalle,fecha])

    res.json('Realizado')
  
  
  })
  

  router.post("/ponerpresente",  async (req, res) => {
    const {fecha, id} = req.body
    const existe = await pool.query('select * from dtc_asistencia where id_usuario=? and fecha =?',[id,fecha])
    if (existe.length>0){
      await pool.query('delete  from  dtc_asistencia where id = ?', [existe[0]['id']])

    }else{
      await pool.query('insert into dtc_asistencia set fecha=?, id_usuario=?', [fecha, id])

    }

    res.json('Realizado')
  
  
  })
  router.post("/traerpresentes",  async (req, res) => {
    const {fecha} = req.body
    const  prod = await pool.query("select * from dtc_asistencia join (select id as idc, nombre, apellido,dni from dtc_chicos ) as sel on dtc_asistencia.id_usuario=sel.idc where fecha=?",[fecha])
    console.log(prod)
    const usuarios =  await pool.query("select * from dtc_chicos left join (select fecha, id_usuario from dtc_asistencia  where fecha=?) as sel on dtc_chicos.id=sel.id_usuario",[fecha])
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

