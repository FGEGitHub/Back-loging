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


router.post("/borrarproducto",  async (req, res) => {
  const {id} = req.body
  console.log(id)

  try {
    await pool.query('delete  from  esme_productos where id = ?', [id])
  
  } catch (error) {
    console.log(error)
  }
  
    res.json('Borrado')


})

router.post("/agregarcostofijo", async (req, res) => {
  const { titulo, monto, usuarioId } = req.body;
console.log( titulo, monto, usuarioId)
  if (!titulo || !monto || !usuarioId) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const sql = "INSERT INTO esme_costos_fijos (titulo, precio, id_vendedora) VALUES (?, ?, ?)";
    await pool.query(sql, [titulo, monto, usuarioId]);
    res.json("Costo fijo agregado correctamente" );
  } catch (error) {
    console.error("Error al guardar costo fijo:", error);
    res.status(500).json({ error: "Error al guardar costo fijo" });
  }
});

router.post("/modisficarcostosfijos/", async (req, res) => {

  const { id,titulo, monto } = req.body;

  if (!titulo || !monto) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const sql = "UPDATE costos_fijos SET titulo = ?, monto = ? WHERE id = ?";
    await connection.query(sql, [titulo, monto, id]);
    res.status(200).json({ mensaje: "Costo fijo actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar costo fijo:", error);
    res.status(500).json({ error: "Error al actualizar costo fijo" });
  }
});

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
  const productosdeunapersona = await pool.query('select * from esme_movimientos join(select id as idp, id_usuario as idusuario from esme_productos) as sel on esme_movimientos.id_producto=sel.idp where idusuario=?', [id])
res.json(productosdeunapersona)

})
router.get('/traerproductos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_productos where id_usuario=?', [id])
res.json(productosdeunapersona)

})

router.get('/traercostosfijos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_costos_fijos where id_vendedora=?', [id])
res.json(productosdeunapersona)

})

router.get('/traerganancia/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from usuarios where id=?', [id])
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
    const {
      nombre,
      categoria,
      costo,
      transporte,
      packaging,
      precioVenta,
      usuarioId,
      variable1,
      costovariable1,
      variable2,
      costovariable2,
    } = req.body;

    // Validar numéricos, asegurándonos que sean número válidos
    const toNumber = (val) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const nuevoProducto = {
      nombre,
      categoria,
      costo: toNumber(costo),
      variable1: toNumber(variable1),
      costovariable1: toNumber(costovariable1),
      variable2: toNumber(variable2),
      costovariable2: toNumber(costovariable2),
      precio_venta: toNumber(precioVenta),
      id_usuario: usuarioId,
    };

    // Ejecutar query usando los campos definidos arriba
    await pool.query(
      "INSERT INTO esme_productos (producto, categoria, costo, variable1, variable2, costovariable1, costovariable2, precio_venta, id_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nuevoProducto.nombre,
        nuevoProducto.categoria,
        nuevoProducto.costo,
        nuevoProducto.variable1,
        nuevoProducto.variable2,
        nuevoProducto.costovariable1,
        nuevoProducto.costovariable2,
        nuevoProducto.precio_venta,
        nuevoProducto.id_usuario,
      ]
    );

    res.json("Producto creado con éxito");
  } catch (error) {
    console.error("Error al crear el producto", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});
router.post("/modificarproductoesme", async (req, res) => {
  try {
    const {
      id,
      nombre,
      categoria,
      costo,
      transporte,
      packaging,
      precioVenta,
      usuarioId,
      variable1,
      costovariable1,
      variable2,
      costovariable2,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Falta el ID del producto" });
    }

    const toNumber = (val) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const campos = [];
    const valores = [];

    if (nombre !== undefined) {
      campos.push("producto = ?");
      valores.push(nombre);
    }
    if (categoria !== undefined) {
      campos.push("categoria = ?");
      valores.push(categoria);
    }
    if (costo !== undefined) {
      campos.push("costo = ?");
      valores.push(toNumber(costo));
    }
    if (variable1 !== undefined) {
      campos.push("variable1 = ?");
      valores.push(toNumber(variable1));
    }
    if (costovariable1 !== undefined) {
      campos.push("costovariable1 = ?");
      valores.push(toNumber(costovariable1));
    }
    if (variable2 !== undefined) {
      campos.push("variable2 = ?");
      valores.push(toNumber(variable2));
    }
    if (costovariable2 !== undefined) {
      campos.push("costovariable2 = ?");
      valores.push(toNumber(costovariable2));
    }
    if (precioVenta !== undefined) {
      campos.push("precio_venta = ?");
      valores.push(toNumber(precioVenta));
    }
    if (usuarioId !== undefined) {
      campos.push("id_usuario = ?");
      valores.push(usuarioId);
    }

    if (campos.length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar" });
    }

    valores.push(id); // ID al final para el WHERE

    const query = `UPDATE esme_productos SET ${campos.join(", ")} WHERE id = ?`;

    await pool.query(query, valores);

    res.json("Producto modificado con éxito");
  } catch (error) {
    console.error("Error al modificar producto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

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