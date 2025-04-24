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
    await pool.query('delete  from  esme_movimientos where id_producto = ?', [id])

  
  } catch (error) {
    console.log(error)
  }
  
    res.json('Borrado')


})

router.post("/borrarmovimiento",  async (req, res) => {
  const {id} = req.body
  console.log(id)

  try {
    await pool.query('delete  from  esme_movimientos where id = ?', [id])
    res.json('Borrado')
  } catch (error) {
    console.log(error)
    res.json('BNorrado')
  }
  
  


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
  const productosdeunapersona = await pool.query('select * from esme_movimientos join(select id as idp, id_usuario as idusuario,producto from esme_productos) as sel on esme_movimientos.id_producto=sel.idp where idusuario=? order by id desc', [id])
res.json(productosdeunapersona)

})


router.get('/traerstock/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const productosConStock = await pool.query(`
      SELECT 
        p.producto,
        p.categoria,
        p.id,
        COALESCE(SUM(CASE WHEN m.tipo = 'Compra' THEN m.cantidad ELSE 0 END), 0) AS total_compras,
        COALESCE(SUM(CASE WHEN m.tipo = 'Venta' THEN m.cantidad ELSE 0 END), 0) AS total_ventas,
        COALESCE(SUM(CASE WHEN m.tipo = 'Compra' THEN m.cantidad ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN m.tipo = 'Venta' THEN m.cantidad ELSE 0 END), 0) AS stock_actual
      FROM esme_productos p
      LEFT JOIN esme_movimientos m ON p.id = m.id_producto
      WHERE p.id_usuario = ?
      GROUP BY p.id, p.producto
    `, [id]);

    res.json(productosConStock);
  } catch (error) {
    console.error("Error al traer stock:", error);
    res.status(500).json({ error: "Error al procesar el stock." });
  }
});

router.get('/traercaja/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Obtener productos con sus categorías
    const productos = await pool.query(
      `SELECT id, producto, categoria FROM esme_productos WHERE id_usuario = ?`,
      [id]
    );

    // Obtener todos los movimientos de esos productos
    const movimientos = await pool.query(
      `SELECT 
        m.id_producto, 
        m.tipo, 
        m.cantidad, 
        m.precio, 
        m.nuevo_precio
      FROM esme_movimientos m
      INNER JOIN esme_productos p ON p.id = m.id_producto
      WHERE p.id_usuario = ?`,
      [id]
    );
    console.log(movimientos)
    // Organizar por categoría
    const resultado = {};

    productos.forEach((producto) => {
      const { id: productoId, producto: nombreProducto, categoria } = producto;

      const movimientosProducto = movimientos
        .filter(mov => mov.id_producto == productoId)
        .map(mov => {
          const monto =
            mov.tipo === "Compra"
              ? mov.precio
              : mov.nuevo_precio !== "No"
              ? mov.nuevo_precio
              : mov.precio;

          return {
            producto: nombreProducto,
            tipo: mov.tipo,
            monto: parseFloat(monto), // Convertir si viene como string
            cantidad: mov.cantidad
          };
        });

      // Si no hay movimientos, no lo agregamos
      if (!resultado[categoria]) {
        resultado[categoria] = [];
      }

      resultado[categoria].push(...movimientosProducto);
    });

    // Convertimos el objeto a array para el frontend
    const respuesta = Object.entries(resultado).map(([categoria, detalles]) => ({
      categoria,
      detalles,
    }));
    res.json(respuesta);
  } catch (error) {
    console.error("Error al traer caja:", error);
    res.status(500).json({ error: "Error al procesar la caja" });
  }
});



router.get('/traerinformes/:id', async (req, res) => {
  const id = req.params.id;

  try {


    const totales = await pool.query(
      `SELECT
        SUM(CASE 
              WHEN tipo = 'Venta' 
                THEN CASE 
                       WHEN nuevo_precio != 'No' THEN CAST(nuevo_precio AS DECIMAL(10,2)) 
                       ELSE precio 
                     END
              ELSE 0 
            END) AS total_ingresos,
        SUM(CASE 
              WHEN tipo = 'Compra' 
                THEN CASE 
                       WHEN nuevo_precio != 'No' THEN CAST(nuevo_precio AS DECIMAL(10,2)) 
                       ELSE precio 
                     END
              ELSE 0 
            END) AS total_egresos
       FROM esme_movimientos
       WHERE id_usuario = ?`,
      [id]
    );
    
      
    const movimientos = await pool.query(`
      SELECT 
        m.*, 
        p.producto, 
        p.categoria 
      FROM esme_movimientos m
      JOIN esme_productos p ON m.id_producto = p.id
      WHERE m.id_usuario = ? order by id desc
    `, [id]);

   console.log(totales)
    res.json(
    [  totales,
      movimientos]
    );
  } catch (error) {
    console.error("Error en /traercaja2/:id", error);
    res.status(500).json({ error: "Error al obtener datos de la caja" });
  }
});

router.get('/traercaja2/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Consulta de movimientos ordenados por fecha descendente
    const movimientos = await pool.query(`
      SELECT 
        esme_movimientos.*, 
        esme_productos.producto, 
        esme_productos.categoria 
      FROM esme_movimientos 
      JOIN esme_productos 
        ON esme_movimientos.id_producto = esme_productos.id 
      WHERE esme_movimientos.id_usuario = ?
      ORDER BY esme_movimientos.fecha DESC
    `, [id]);

    // Consulta de inversiones
    const inversiones = await pool.query(`
      SELECT * FROM esme_inversiones WHERE id_usuario = ?
    `, [id]);

    // Formateamos las inversiones para que coincidan con la estructura del array movimientos
    const inversionesFormateadas = inversiones.map(inv => ({
      ...inv,
      tipo_movimiento: inv.formaPago,
      producto: inv.detalle,
      categoria: inv.tipo || "N/A",
      precio: inv.monto,
      nuevo_precio: "No",
      fecha: inv.fecha || inv.created_at || "1970-01-01" // aseguramos que tenga fecha
    }));

    // Sumamos al total de ventas solo los movimientos de venta
    let totalVentas = 0;
    movimientos.forEach(mov => {
      let precio = mov.nuevo_precio !== "No" ? mov.nuevo_precio : mov.precio;
      const precioNum = parseFloat(precio) || 0;

      if (mov.tipo_movimiento === "Venta") {
        totalVentas += precioNum;
      }
    });

    // Unimos y ordenamos los movimientos completos por fecha descendente
    const movimientosCompletos = [...movimientos, ...inversionesFormateadas].sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    res.json({
      totalVentas,
      movimientos: movimientosCompletos
    });
  } catch (error) {
    console.error("Error en /traercaja2/:id", error);
    res.status(500).json({ error: "Error al obtener datos de la caja" });
  }
});


/*rout

er.get('/traerproductos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_productos where id_usuario=?', [id])
  const [costosfijos] = await pool.query(
    'SELECT SUM(CAST(precio AS DECIMAL(10,2))) AS total FROM esme_costos_fijos WHERE id_usuario = ?',
    [id]
  );


res.json(productosdeunapersona)

})
*/
router.get('/traerproductos/:id', async (req, res) => {
  const id = req.params.id;


  try {
    const productos = await pool.query('SELECT * FROM esme_productos WHERE id_usuario=? order by id desc', [id]);
    const trabajo = await pool.query('SELECT trabajo FROM usuarios WHERE id=?', [id]);
    const costosfijos= await pool.query(
      'SELECT SUM(CAST(precio AS DECIMAL(10,2))) AS total FROM esme_costos_fijos WHERE id_vendedora = ?',
      [id]
    );
    
    const totalinvertido = await pool.query(`
      SELECT 
        SUM(CASE WHEN tipo = 'Compra' THEN CAST(precio AS DECIMAL(10,2)) ELSE 0 END) AS total
      FROM esme_movimientos
    
    `);
    // Procesar productos: convertir strings y calcular valor total de cada producto
    const productosConValor = await Promise.all(productos.map(async (producto) => {
      const costo = parseFloat(producto.costo) || 0;
      const costovariable1 = parseFloat(producto.costovariable1) || 0;
      const costovariable2 = parseFloat(producto.costovariable2) || 0;
    
      const valorTotal = costo + costovariable1 + costovariable2;
    
      const resultado = await pool.query(`
        SELECT 
          SUM(CASE WHEN tipo = 'Compra' THEN CAST(precio AS DECIMAL(10,2)) ELSE 0 END) AS total
        FROM esme_movimientos
        WHERE id_producto = ?
      `, [producto.id]);
      const stock = await pool.query(`
        SELECT 
          SUM(CASE WHEN tipo = 'Compra' THEN CAST(cantidad AS DECIMAL(10,2)) ELSE 0 END) AS total
        FROM esme_movimientos
        WHERE id_producto = ?
      `, [producto.id]);
      const stockvendido = await pool.query(`
        SELECT 
          SUM(CASE WHEN tipo = 'Venta' THEN CAST(cantidad AS DECIMAL(10,2)) ELSE 0 END) AS total
        FROM esme_movimientos
        WHERE id_producto = ?
      `, [producto.id]);
       porcentajedeinvercion = 0
    
       adicional =  0
       valortotal2 =0
       precioventa="No hay stock para calcular"
      if(parseFloat(resultado[0].total)>0){
       
         porcentajedeinvercion = parseFloat(((resultado[0].total / totalinvertido[0].total) * 100).toFixed(2));

         adicional = parseFloat(
          (
            (parseFloat(costosfijos[0].total) * (porcentajedeinvercion / 100)) /
            parseFloat(stock[0].total)
          ).toFixed(2)
        );         console.log("adicional",adicional)
         valortotal2 = parseFloat(adicional) + valorTotal;
         variableganancia=100
         if(trabajo[0]['trabajo']){
          variableganancia=trabajo[0]['trabajo']
         }
         precioventa=valortotal2*(parseFloat(variableganancia)/100)      
        
        }
    

     
      
      return {
        ...producto,
        valorTotal,
        adicional,
        valortotal2,
        stockcomprado:parseInt(stock[0].total),
        stockvendido:parseInt(stockvendido[0].total),
        porcentajedeinvercion,
        precioventa
      };
    }));
    // Calcular total de todos los valores
   // const totalGeneral = productosConValor.reduce((sum, prod) => sum + prod.valorTotal, 0);

    // Agregar el porcentaje a cada producto
/*     const productosFinal = productosConValor.map((prod) => ({
      ...prod,
      porcentaje: totalGeneral > 0 ? ((prod.valorTotal / totalGeneral) * 100).toFixed(2) : "0.00"
    }));
console.log(productosFinal) */
    res.json(productosConValor);
  } catch (error) {
    console.error("Error al traer productos:", error);
    res.status(500).json({ error: "Error al procesar los productos." });
  }
});


router.get('/traercostosfijos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_costos_fijos where id_vendedora=?', [id])
res.json(productosdeunapersona)

})


router.get('/getResumenNegocio/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from usuarios where id=?', [id])
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



router.post("/updateResumenNegocio", async (req, res) => {
  const {
    id,
    materia,     // nombre del negocio
    direccion,
    nombre,
    estado,
    anios        // actividad
  } = req.body;
console.log(    id,
  materia,     // nombre del negocio
  direccion,
  nombre,
  
  anios )
  try {
    const query = `
      UPDATE usuarios
      SET materia = ?, direccion = ?, nombre = ?, anios = ?
      WHERE id = ?
    `;

    const values = [materia, direccion, nombre, anios, id];

    await pool.query(query, values);

    res.json({ message: "Negocio actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar negocio:", error);
    res.status(500).json({ error: "Error al actualizar el negocio" });
  }
});


router.post("/enviarmovimientoingreso", async (req, res) => {
  const {
    id_usuario,
    tipo,
    formaPago,
    detalle,
    fecha,
    monto
  } = req.body;

console.log(    id_usuario,
  tipo,
  formaPago,
  detalle,
  monto)
  try {
  

    const query = `
      INSERT INTO esme_inversiones 
        (tipo, formapago, detalle,monto, id_usuario,fecha)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      
      tipo,
      formaPago,
      detalle,
      monto,
      id_usuario,
      fecha
    ];

    await pool.query(query, values);
    res.json( "Movimiento guardado correctamente" );
  } catch (error) {
    console.error("Error al guardar movimiento:", error);
    res.status(500).json({ error: "Error al guardar el movimiento" });
  }
});



router.post("/enviarmovimiento", async (req, res) => {
  const {
    productoId,
    fecha,
    tipo_movimiento,
    tipo,
    nuevovalor,
    descuento,
    facturaCompra,
    facturaVenta,
    proveedor,
    
    
    cantidad,
    precio,
    variedad = 0
  } = req.body;

console.log(    tipo_movimiento,
  tipo)
  try {
    const produc =await pool.query('select * from esme_productos where id=?',[productoId])
    // Normalizamos valores opcionales
    id_usuario=produc[0]['id_usuario']
    const facturaVentaFinal = isNaN(parseFloat(facturaVenta)) ? 0 : parseFloat(facturaVenta);
    const facturaCompraFinal = isNaN(parseFloat(facturaCompra)) ? 0 : parseFloat(facturaCompra);
    const proveedorFinal = isNaN(parseFloat(proveedor)) ? 0 : parseFloat(proveedor);

    const tieneDescuento = nuevovalor && !isNaN(parseFloat(nuevovalor));

    const query = `
      INSERT INTO esme_movimientos 
        (id_producto, fecha, tipo,tipo_movimiento, factura_compra, factura_venta, proveedor, id_usuario, variedad, cantidad, precio, nuevo_precio, descuento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

    const values = [
      productoId,
      fecha,
      tipo,
      tipo_movimiento,
      facturaCompraFinal,
      facturaVentaFinal,
      proveedorFinal,
      id_usuario,
      variedad,
      cantidad,
      precio,
      tieneDescuento ? parseFloat(nuevovalor) : "No",
      tieneDescuento ? parseFloat(descuento) :  "No"
    ];

    await pool.query(query, values);
    res.json( "Movimiento guardado correctamente" );
  } catch (error) {
    console.error("Error al guardar movimiento:", error);
    res.status(500).json({ error: "Error al guardar el movimiento" });
  }
});


router.post("/crearnuevoproducto", async (req, res) => {

    let {
      nombre,
      categoria,
      costo,
      transporte, // ⚠️ No se usa en el INSERT, ¿debería guardarse?
      packaging,  // ⚠️ No se usa en el INSERT, ¿debería guardarse?
      precioVenta,
      usuarioId,
      variable1 ,
      costevariable1 ,
      variable2 ,
      costevariable2,
      costovariable1 ,
    } = req.body;
console.log(  variable1 ,
  costevariable1 ,
  costovariable1 ,
  costovariable1,)
if(variable1==undefined){
  variable1=0
  costevariable1=0

}

if(variable2==undefined){
  variable2=0
  costevariable2=0
}
    const toNumber = (val) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const nuevoProducto = {
      nombre,
      categoria,
      costo: toNumber(costo),
      variable1,
      costovariable1: toNumber(costevariable1),
      variable2,
      costovariable2: toNumber(costevariable2),
      precio_venta: toNumber(precioVenta),
      id_usuario: usuarioId,
    };

    await pool.query(
      `INSERT INTO esme_productos 
       (producto, categoria, costo, variable1, variable2, costovariable1, costovariable2, precio_venta, id_usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

});

router.post("/modificarmovimiento", async (req, res) => {

    const {
      fecha, cantidad, id
    } = req.body;
console.log(fecha, cantidad, id)
    
  await connection.query(
    "UPDATE movimientos SET fecha = ?, cantidad = ? WHERE id = ?",
    [fecha, cantidad, id]
  )
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
      costevariable1,
      variable2,
      costevariable2,
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
      valores.push(variable1); // No convertir a número
    }
    if (costevariable1 !== undefined) {
      campos.push("costovariable1 = ?");
      valores.push(toNumber(costevariable1));
    }
    if (variable2 !== undefined) {
      campos.push("variable2 = ?");
      valores.push(variable2); // No convertir a número
    }
    if (costevariable2 !== undefined) {
      campos.push("costovariable2 = ?");
      valores.push(toNumber(costevariable2));
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