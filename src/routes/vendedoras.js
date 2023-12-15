const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const multer = require('multer')
const path = require('path')
const fs = require('fs')


const storage = multer.diskStorage({
  destination: path.join(__dirname, '../imagenesvendedoras'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/nuevoprpducto", upload.single('imagen'), async (req, res) => {



  const nombre = req.body.nombre;
  const categoria = req.body.categoria1;
  const descripcion = req.body.descripcion;
  const precio = req.body.precio;
  const stock = req.body.stock;
  const id_usuario = req.body.id_usuario;
  const fileName = req.file.filename;
  console.log(nombre, categoria, descripcion, precio, stock, fileName, id_usuario)

  try {
    await pool.query('insert into producto_venta set nombre=?, categoria=?, descripcion=?,precio=?,stock=?, id_usuario=?,fecha=?,ubicacion=?', [nombre, categoria, descripcion, precio, stock, id_usuario, (new Date(Date.now())).toLocaleDateString(),fileName])
    res.json(`Realizado`)
  } catch (error) {
    console.log(error)
    res.json('No escribiste nadaaa')
  }


})



router.get('/listadetodosproductos', async (req, res) => {
 

  const productosdeunapersona = await pool.query('select * from producto_venta ')
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
      nombre: productosdeunapersona[i]['nombre'],
      precio: productosdeunapersona[i]['precio'],
      descripcion: productosdeunapersona[i]['descripcion'],
      cantidad: productosdeunapersona[i]['stock'],
      fecha: productosdeunapersona[i]['fecha'],
      imagenBase64: imagenBuffer.toString('base64')
    }
enviar.push(nuevo)
  }

  res.json(enviar);


  //  res.json(tareas)

})


router.get('/listadeproductos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)

  const productosdeunapersona = await pool.query('select * from producto_venta where id_usuario=?', [id])
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
      nombre: productosdeunapersona[i]['nombre'],
      precio: productosdeunapersona[i]['precio'],
      descripcion: productosdeunapersona[i]['descripcion'],
      cantidad: productosdeunapersona[i]['stock'],
      imagenBase64: imagenBuffer.toString('base64')
    }
enviar.push(nuevo)
  }

  // Leer la imagen como un buffer


  // Convertir la imagen a base64

  // Enviar un objeto JSON con la imagen en base64
  res.json(enviar);


  //  res.json(tareas)

})



module.exports = router