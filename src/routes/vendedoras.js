const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
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






router.post("/borrararticulo",  async (req, res) => {
  const {id} = req.body
  console.log(id)
  try {
    const  prod = await pool.query("select * from producto_venta where id=?",[id])
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
    await pool.query('delete  from  producto_venta where id = ?', [id])
  
  } catch (error) {
    console.log(error)
  }
  
    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('No Borrado')
  }

})


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
      id: productosdeunapersona[i]['id'],
      id_usuario: productosdeunapersona[i]['id_usuario'],
      nombre: productosdeunapersona[i]['nombre'],
      precio: productosdeunapersona[i]['precio'],
      descripcion: productosdeunapersona[i]['descripcion'],
      cantidad: productosdeunapersona[i]['stock'],
      fecha: productosdeunapersona[i]['fecha'],
      imagenBase64
    }
enviar.push(nuevo)
  }

  res.json(enviar);


  //  res.json(tareas)

})

router.get('/traermovimientos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_movimientos join(select id as idp, id_usuario from esme_productos) as sel on esme_movimientos.id_producto=sel.idp where id_usuario=?', [id])
res.json(productosdeunapersona)

})
router.get('/traerproductos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_productos where id_usuario=?', [id])
res.json(productosdeunapersona)

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
      console.log(rutaImagen)
      imagenBuffer = fs.readFileSync(rutaImagen);
      imagenBase64 = imagenBuffer.toString('base64');
    } catch (error) {

      console.log(error)
/*       rutaImagen = path.join(__dirname, '../../imagenes', "mantenimiento.jpeg");
          console.log(rutaImagen)
          imagenBuffer = fs.readFileSync(rutaImagen);
          imagenBase64 = imagenBuffer.toString('base64'); */
    }

    nuevo = {
      id: productosdeunapersona[i]['id'],
      nombre: productosdeunapersona[i]['nombre'],
      precio: productosdeunapersona[i]['precio'],
      descripcion: productosdeunapersona[i]['descripcion'],
      cantidad: productosdeunapersona[i]['stock'],
      imagenBase64
      
    }
enviar.push(nuevo)
  }

  // Leer la imagen como un buffer


  // Convertir la imagen a base64

  // Enviar un objeto JSON con la imagen en base64
  res.json(enviar);


  //  res.json(tareas)

})


router.post("/enviarmovimiento", async (req, res) => {
  const {
    productoId,
    fecha,
    tipo_movimiento,
    facturaCompra = 0,
    facturaVenta = 0,
    proveedor = 0,
    cliente = 0, // no se guarda en la tabla, pero lo recibís
    id_usuario = 1, // ajustar según tu lógica de usuario logueado
    cantidad,
    precio,
    variedad = 0
  } = req.body;

  try {
    const query = `
      INSERT INTO movimientos 
        (id_producto, fecha, tipo, factura_compra, factura_venta, proveedor, id_usuario, variedad, cantidad, precio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      productoId,
      fecha,
      tipo_movimiento,
      facturaCompra,
      facturaVenta,
      proveedor,
      id_usuario,
      variedad,
      cantidad,
      precio
    ];

    await pool.query(query, values);
    res.status(200).json({ message: "Movimiento guardado correctamente" });
  } catch (error) {
    console.error("Error al guardar movimiento:", error);
    res.status(500).json({ error: "Error al guardar el movimiento" });
  }
});


router.post("/crearnuevoproducto", async (req, res) => {
  try {
    const { nombre, categoria, costo, transporte, packaging, precioVenta, usuarioId } = req.body;
    
    // Si los campos numéricos no se completan, asignamos 0
    const nuevoProducto = {
      nombre,
      categoria,
      costo: costo ? Number(costo) : 0,
      transporte: transporte ? Number(transporte) : 0,
      packaging: packaging ? Number(packaging) : 0,
      precioVenta: precioVenta ? Number(precioVenta) : 0,
      id_usuario:usuarioId,
    };

    // Aquí iría la lógica para guardar el producto en la base de datos
    // Ejemplo con MySQL
    // 
      categoria,
      categoria,
      await pool.query("INSERT INTO esme_productos SET producto=?,categoria=?,costo=?,transporte=?,packaging=?,precio_venta=?,id_usuario=?", [nombre,categoria,costo ? Number(costo) : 0,transporte ? Number(transporte) : 0, packaging ? Number(packaging) : 0, precioVenta ? Number(precioVenta) : 0,usuarioId]);
    
    res.json("Producto creado con éxito");
  } catch (error) {
    console.error("Error al crear el producto", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


module.exports = router