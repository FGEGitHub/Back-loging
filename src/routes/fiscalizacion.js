const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const multer = require('multer')
const XLSX = require('xlsx')
const path = require('path')
const passport= require('passport')


const diskstorage = multer.diskStorage({
    destination: path.join(__dirname, '../Excel'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-inscrip-' + file.originalname)

    }
}) //para que almacene temporalmente la imagen
const fileUpload = multer({
    storage: diskstorage,

}).single('image')



router.get('/todasincripciones', async (req, res,) => {

    let inscri = await pool.query('select * from inscripciones_fiscales join (select dni as dni_persona, movilidad, vegano, celiaco, telefono,telefono2 from personas_fiscalizacion ) as selec on inscripciones_fiscales.dni=selec.dni_persona left join (select id as id_aliado, nombre as nombre_aliado from usuarios)  as selec2 on inscripciones_fiscales.cargadopor=selec2.id_aliado  where inscripciones_fiscales.estado="Pendiente" ' )
    res.json([inscri])
})



router.get('/traerincripcionesdealiado/:id',  async (req, res) => {
    const id = req.params.id
 
  try { 
       const etc= await pool.query('select id, dni, apellidoo, nombree, telefono, telefono2 from inscripciones_fiscales join (select dni as dni_pers, nombre as nombree, apellido as apellidoo, telefono, telefono2 from personas_fiscalizacion)as selec on dni=dni_pers where cargadopor =?', [id])
       
    res.json(etc);
  } catch (error) {
    console.log(error)
    res.json([]);
  }


    
  })


router.get('/datosusuarioporid/:dni',  async (req, res) => {
    const dni = req.params.dni
  
  
    const etc = await pool.query('select * from personas where dni =?', [dni])
  
    res.json(['ficha', 'porcentaje','cat']);
  
  

    
  })
  router.get('/traerescuelas',  async (req, res) => {
    const dni = req.params.dni
  
  
    const etc = await pool.query('select * from escuelas  order by nombre ')
  
    res.json(etc);
  
  

    
  })

  router.get('/traerescuelasymesas/:id',  async (req, res) => {
    const id = req.params.id
  
  
    const etc = await pool.query('select * from escuelas  ')
    const mesas = await pool.query('select * from mesas_fiscales where id_escuela=?  ',[id])
  
    res.json([etc,mesas]);
  
  

    
  })
  
  
router.get('/todaslasinscripcionesescuelas', async (req, res,) => {
    

    try {
        estr = await pool.query('select * from excelescuelas ')
        console.log(estr)
        res.json(estr)
    } catch (error) {
        res.send('algo salio mal')
    }


})

router.get('/todaslasinscripciones', async (req, res,) => {
    

    try {
        estr = await pool.query('select * from excelfiscalizacion ')
        console.log(estr)
        res.json(estr)
    } catch (error) {
        res.send('algo salio mal')
    }


})

router.get('/listademesas', async (req, res,) => {
  

    try {
        estr = await pool.query('select * from mesas_fiscales join (select id as id_esc, nombre from escuelas) as selec1 on mesas_fiscales.id_escuela=selec1.id_esc ')
   
        res.json(estr)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }


})
router.get('/listadeescuelas', async (req, res,) => {
  

    try {
        estr = await pool.query('select * from escuelas ')
   
        res.json(estr)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }


})



router.get('/traermesas/:id_escuela', async (req, res,) => {
const {id_escuela} = req.params
console.log(id_escuela)
const  mesas = await pool.query('select * from mesas_fiscales where id_escuela=?',[id_escuela])
res.json(mesas)


})



router.get('/datosdemesas', async (req, res,) => {
  //////  traer cantidad de mesas, mesas libres mesas ocupadas, 

    try {
        let cant = await pool.query('select * from mesas_fiscales ')
        let asig = await pool.query('select * from asignaciones_fiscales ')
        let esc = await pool.query('select * from escuelas ')
let mesas_sin_asignar=[]
        for (const index_mesas in cant) {
            let existe_aux = await pool.query('select * from inscripciones_fiscales where id_escuela =? ',[cant[index_mesas]['id']])
            if (existe_aux.length === 0){
                mesas_sin_asignar.push(cant[index_mesas])
            }
        }

  
        res.json([cant.length,asig.length,mesas_sin_asignar.length,esc.length])
    } catch (error) {
        console.log(error)
        res.send('algo salio mal')
    }


})





router.get('/traerpaso2inscrip', async (req, res,) => {
  

    try {
        estr = await pool.query('select * from inscripciones_fiscales join (select dni as dniper,telefono, nombre as nombrepersona, apellido as apellidopersona from personas_fiscalizacion) as selec1 on inscripciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on inscripciones_fiscales.id_escuela=selec2.idescuela join (select id as idescuela2, nombre as nombreescuela2 from escuelas) as selec3 on inscripciones_fiscales.id_escuela2=selec3.idescuela2')
    
        res.json(estr)
    } catch (error) {
        console.log(error)
        res.send(['algo salio mal'])
    }


})

router.get('/todaslasasignaciones', async (req, res,) => {
  

    try {
        estr = await pool.query('select * from asignaciones_fiscales join (select dni as dniper,telefono, nombre from personas_fiscalizacion) as selec1 on asignaciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on asignaciones_fiscales.escuela=selec2.idescuela ')
    
        res.json([estr])
    } catch (error) {
        res.send('algo salio mal')
    }


})


router.post("/crearescuela",  async (req, res) => {
    let {  nombre,   circuito, observacion} = req.body
    
    if (observacion===undefined){
 
        observacion="Ninguna"
}
try {
    await pool.query('insert into escuelas set nombre=?, circuito=? ,observacion=? ', [nombre,circuito,observacion])
    res.json("Cargado")
} catch (error) {
    console.log(error)
    res.json("No Cargado")
}

})




router.post("/traerestadisticasdeescuelas",  async (req, res) => {
    let {  id1,id2} = req.body

   
 const cant1= await pool.query('select * from mesas_fiscales where id_escuela=?',[id1])
 const cant2= await pool.query('select * from mesas_fiscales where id_escuela=?',[id2])
 const datos_escuelas={
    cantidad_escuela1:cant1.length,
    cantidad_escuela2:cant2.length
 }
 res.json(datos_escuelas)

// mostrar  cuantas mesas tiene, cuantas ya se asignaron 


})


router.post("/modificarescuela",  async (req, res) => {
    let {  nombre,   circuito, id} = req.body
    

try {
    await pool.query('update escuelas set nombre=?, circuito =? where  id = ?', [nombre,   circuito, id])
    res.json("Modificado")
} catch (error) {
    console.log(error)
    res.json("No modificado")
}

})


router.post("/borrarescuela",  async (req, res) => {
    let {  decision,   id, id_escuela} = req.body
    console.log(decision)
    console.log(id)
    console.log(id_escuela)

if (decision==="Si"){
    await pool.query('update mesas_fiscales set id_escuela=? where  id_escuela = ?', [id_escuela,id])
    //}
   // let mesas_a_trasladar   = await pool.query('select * from mesas_fiscales where id_escuela =? ',[id])
  //  for (mesas_tras in mesas_a_trasladar){
    //    await pool.query('update mesas_fiscales set id_escuela=?  id = ?', [id_escuela,id])
//}

}
await pool.query('delete  from  escuelas where id = ?',[id])

res.json('Realizado')




})




router.post("/enviarinscripcionadmin",  async (req, res) => {
    let {dni, como_se_entero,nombre_referido, apellido_referido, nombre, telefono, telefono2,apellido,id_aliado} = req.body
    

    try {
        ///////
        if (dni== undefined) {
            dni = 'Sin definir'
        } 
        if (apellido_referido== undefined) {
            apellido_referido = 'Sin definir'
        } 

        existe = await pool.query('select * from personas_fiscalizacion where dni = ?', [dni])
        let nombre_aliado =''
        if (id_aliado== undefined) {
            id_aliado = 'Autoinscripcion'
        } 
     
        if (como_se_entero== undefined) {
            como_se_entero = 'Sin definir'
        } 

            
            if (apellido=== undefined) {
                apellido = 'No brinda'
            } 
        if (nombre_referido== undefined) {
            nombre_referido = 'Sin definir'
        }
        if (existe.length === 0 || dni== "Sin definir" ) {//////si existe la personas


            ///crear nueva persona 
      
        
            if (telefono === undefined) {
                telefono = 'No'
            } 
            if (telefono2 === undefined) {
                telefono2 = 'No'
            } 
            
      

            await pool.query('INSERT INTO personas_fiscalizacion set nombre=?,apellido =?,telefono=?,telefono2=?,dni=?', [nombre, apellido, telefono, telefono2, dni]);
        }
        /////////¿Actualmente  se encuentra estudiando? actividad adicional
        /////////////Tipo de empleo


        let telefonoregistrado = await pool.query('select * from inscripciones_fiscales join (select dni as dni_pers, telefono, telefono2 from personas_fiscalizacion) as selec on inscripciones_fiscales.dni = selec.dni_pers where  telefono=? ', [telefono])
    if (telefonoregistrado.length>0 &&  dni!= "Sin definir" ){
        let dnicodif = telefonoregistrado[0]['dni']
        dnicodif = '****'+dnicodif[dnicodif.length-3]+dnicodif[dnicodif.length-2]+dnicodif[dnicodif.length-1]
        res.json('Error ya se posee ese numero de telefono, pertenece a '+dnicodif)
    }else{
        let exisinscrip = await pool.query('select * from inscripciones_fiscales where  dni=? ', [dni])
 
            if (exisinscrip.length  > 0 &&  dni!= "Sin definir"){
                res.json('Error fiscal ya inscripto')
            }else{
               
        await pool.query('INSERT INTO inscripciones_fiscales set  nombre=?,apellido=?, dni=?, cargadopor=?, fecha_carga=?,como_se_entero=?,apellido_referido=?,nombre_referido=?', [nombre,apellido,dni,id_aliado,(new Date(Date.now())).toLocaleDateString(),como_se_entero,apellido_referido,nombre_referido])
        res.json('inscripto correctamente, muchas gracias por completar, por favor aguarda en unos dias nos comunicaremos al numero de telefono registrado')
      } }
  



    } catch (e) {
        console.log(e)
        res.json('Error, algo sucedio')
    }


   
})


router.post("/enviarinscripcion",  async (req, res) => {
    let {  dni, como_se_entero,nombre_referido, apellido_referido, nombre, telefono, telefono2,apellido,id_aliado} = req.body
    

    try {
        ///////
        

        existe = await pool.query('select * from personas_fiscalizacion where dni = ?', [dni])
        let nombre_aliado =''
        if (id_aliado== undefined) {
            id_aliado = 'Autoinscripcion'
        } 
        if (como_se_entero== undefined) {
            como_se_entero = 'Sin definir'
        } 
        if (apellido_referido== undefined) {
            apellido_referido = 'Sin definir'
        } 
        
        if (nombre_referido== undefined) {
            nombre_referido = 'Sin definir'
        }
        if (existe.length === 0) {//////si existe la personas


            ///crear nueva persona 
          
            if (nombre=== undefined) {
                nombre = 'No'
            } 
        
            if (telefono === undefined) {
                telefono = 'No'
            } 
            if (telefono2 === undefined) {
                telefono2 = 'No'
            } 
            
      

            await pool.query('INSERT INTO personas_fiscalizacion set nombre=?,apellido =?,telefono=?,telefono2=?,dni=?', [nombre, apellido, telefono, telefono2, dni]);
        }
        /////////¿Actualmente  se encuentra estudiando? actividad adicional
        /////////////Tipo de empleo


        let telefonoregistrado = await pool.query('select * from inscripciones_fiscales join (select dni as dni_pers, telefono, telefono2 from personas_fiscalizacion) as selec on inscripciones_fiscales.dni = selec.dni_pers where  telefono=? ', [telefono])
    if (telefonoregistrado.length>0){
        let dnicodif = telefonoregistrado[0]['dni']
        dnicodif = '****'+dnicodif[dnicodif.length-3]+dnicodif[dnicodif.length-2]+dnicodif[dnicodif.length-1]
        res.json('Error ya se posee ese numero de telefono, pertenece a '+dnicodif)
    }else{
        let exisinscrip = await pool.query('select * from inscripciones_fiscales where  dni=? ', [dni])
 
            if (exisinscrip.length  > 0){
                res.json('Error fiscal ya inscripto')
            }else{
               
        await pool.query('INSERT INTO inscripciones_fiscales set  nombre=?,apellido=?, dni=?, cargadopor=?, fecha_carga=?,como_se_entero=?,apellido_referido=?,nombre_referido=?', [nombre,apellido,dni,id_aliado,(new Date(Date.now())).toLocaleDateString(),como_se_entero,apellido_referido,nombre_referido])
        res.json('inscripto correctamente, muchas gracias por completar, por favor aguarda en unos dias nos comunicaremos al numero de telefono registrado')
      } }
  



    } catch (e) {
        console.log(e)
        res.json('Error, algo sucedio')
    }


   
})


router.post("/inscribir",  async (req, res) => {
    const {  dni,   id_inscripcion, id_escuela,id_escuela2, mesa,vegano,movilidad,domicilio,fiscal_antes} = req.body
   
  console.log(dni)
  
  
    const persona = await pool.query('select * from personas where dni =?', [dni])
    console.log(persona[0])
    const inscripciones = await pool.query('select * from inscripciones where id =?', [id_inscripcion])
    //////////////////////
    

    ////////////
    try {
     
    
  
      
  ///queda id_inscripcion
 //  await pool.query('insert into asignaciones_fiscales set id_inscripcion=?, escuela=? ,mesa=?, dni=? ', [id_inscripcion,id_escuela,id_escuela2,mesa,dni])
 await pool.query('update personas_fiscalizacion set vegano=?, movilidad=?,domicilio=?, fiscal_antes=?  where dni=?', [vegano,movilidad,domicilio,fiscal_antes,dni])
  await pool.query('update inscripciones_fiscales set estado="Contactado", id_escuela=?, id_escuela2=? where id=?', [id_escuela,id_escuela2,id_inscripcion])
  
     
  
      res.json('Realizado con exito ')
  
    } catch (error) {
      console.log(error)
      res.json('Error algo sucedio')
    }
  
  
  })

  

  
  router.get('/borrarinscripcion/:id', async (req, res) => {
    const id = req.params.id
try {
  
       await pool.query('delete  from  inscripciones_fiscales where id = ?',[id])
       res.json("Realizado")
} catch (error) {
    res.json("No Realizado")
}
 


    
})

  router.get('/todos/', async (req, res) => {
   
  
    const etc = await pool.query ('select * from usuarios where nivel=5 or nivel=6 or nivel=7' )
console.log(etc)
  res.json(etc);
//res.render('index')
})

router.post('/signupp', passport.authenticate('local.registroadmin', {
    successRedirect: '/exitosignup',
    failureRedirect:'/noexito',
    failureFlash:true

}))

  router.post('/crearmesa', async (req, res) => {
    const { id_escuela,numero } = req.body
    let existe = await pool.query('select * from mesas_fiscales where id_escuela=? and numero=?',[ id_escuela,numero])
    if(existe.length >0 ){
        res.json('Error ya existe la mesa')
    }else{

        await pool.query('insert into mesas_fiscales set id_escuela=?, numero=?', [id_escuela, numero])
        res.json('Realizado')
    
    }
   
  })


router.post('/incripcionesid', async (req, res) => {
    const { id } = req.body

    const estract = await pool.query('select * from excelfiscalizacion where id = ? ', [id])
    const nombree = estract[0]['nombre']
    console.log(nombree)

    let mandar = []
    // const workbook = XLSX.readFile(`./src/Excel/${nombree}`)

    // const workbook = XLSX.readFile('./src/Excel/1665706467397-estr-cuentas_PosicionConsolidada.xls')

    try {
        const workbook = XLSX.readFile(path.join(__dirname, '../Excel/' + nombree))
        const workbooksheets = workbook.SheetNames
        const sheet = workbooksheets[0]

        const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
        //console.log(dataExcel)

        let regex = /(\d+)/g;

        for (const property in dataExcel) {


            /*  if ((dataExcel[property]['Descripción']).includes(cuil_cuit)) {
                 estado = 'A'
                 // tipo de pago normal 
             } */






            try {





                try {







                    nombre = dataExcel[property]['Nombre y Apellido']

                    fiscal_antes = dataExcel[property]['¿Fuiste fiscal antes?']
                    DNI = dataExcel[property]['DNI']

                    nuevo = {
                        nombre,
                        fiscal_antes,

                        DNI,

                    }


                    mandar.push(nuevo);


                } catch (error) {
                    console.log(error)
                    nombre = dataExcel[property]['Nombre']
                    apellido = dataExcel[property]['Apellido']
                    dni = dataExcel[property]['D.N.I.']
                    eleccion1 = dataExcel[property]['Selecciona el primer curso de mayor preferencia (1)']
                    eleccion2 = dataExcel[property]['Selecciona el primer curso de mayor preferencia (2)']
                    nuevo = {
                        nombre: 'no se encontro archivo',
                        apellido: 'no se encontro archivo',
                        dni: 'no se encontro archivo',
                        eleccion1: 'no se encontro archivo',
                        eleccion2: 'no se encontro archivo',


                    }
                    mandar = [nuevo]

                }



            } catch (error) {
                console.log(error)
            }





        }

    } catch (error) {
        console.log(error)
    }
    console.log(mandar)
    res.json(mandar)


})





router.post('/incripcionesidescuelas', async (req, res) => {
    const { id } = req.body

    const estract = await pool.query('select * from excelescuelas  where id = ? ', [id])
    const nombree = estract[0]['nombre']
    console.log(nombree)

    let mandar = []
    // const workbook = XLSX.readFile(`./src/Excel/${nombree}`)

    // const workbook = XLSX.readFile('./src/Excel/1665706467397-estr-cuentas_PosicionConsolidada.xls')

    try {
        const workbook = XLSX.readFile(path.join(__dirname, '../Excel/' + nombree))
        const workbooksheets = workbook.SheetNames
        const sheet = workbooksheets[0]

        const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
        //console.log(dataExcel)

        let regex = /(\d+)/g;

        for (const property in dataExcel) {




            try {



                try {




                    nombre = dataExcel[property]['ESCUELA']

                    circuito = dataExcel[property]['CIR']
                    DNI = dataExcel[property]['DNI']

                    nuevo = {
                        nombre,
                        circuito,

                        DNI,

                    }


                    mandar.push(nuevo);


                } catch (error) {
                    console.log(error)
                    nombre = dataExcel[property]['Nombre']
                    apellido = dataExcel[property]['Apellido']
                    dni = dataExcel[property]['D.N.I.']
                    eleccion1 = dataExcel[property]['Selecciona el primer curso de mayor preferencia (1)']
                    eleccion2 = dataExcel[property]['Selecciona el primer curso de mayor preferencia (2)']
                    nuevo = {
                        nombre: 'no se encontro archivo',
                        apellido: 'no se encontro archivo',
                        dni: 'no se encontro archivo',
                        eleccion1: 'no se encontro archivo',
                        eleccion2: 'no se encontro archivo',


                    }
                    mandar = [nuevo]

                }



            } catch (error) {
                console.log(error)
            }





        }

    } catch (error) {
        console.log(error)
    }
    console.log(mandar)
    res.json(mandar)


})


router.post('/cargarinscripcionesescuelas', async (req, res) => {
    const { id } = req.body
    console.log(id)
    const estract = await pool.query('select * from excelescuelas where id = ? ', [id])
    console.log(estract)
    const nombree = estract[0]['nombre']
    console.log(nombree)

    let mandar = []
    // const workbook = XLSX.readFile(`./src/Excel/${nombree}`)

    // const workbook = XLSX.readFile('./src/Excel/1665706467397-estr-cuentas_PosicionConsolidada.xls')

    try {
        const workbook = XLSX.readFile(path.join(__dirname, '../Excel/' + nombree))
        const workbooksheets = workbook.SheetNames
        const sheet = workbooksheets[0]

        const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
        //console.log(dataExcel)






        let a = 1

        for (const property in dataExcel) {
            a += 1
        
            escuela = dataExcel[property]['ESCUELA']
         console.log(dataExcel[property]['ESCUELA'])
        
               
                existe = await pool.query('select * from escuelas where nombre = ?', [escuela])
           
                try {
                    ///////

                    if (existe.length > 0) {

            
                        await pool.query('update escuelas set circuito=?  where nombre = ?', [dataExcel[property]['CIR'], dataExcel[property]['ESCUELA']])

                    } else {
                        ///crear nueva persona 

                       nombre = dataExcel[property]['ESCUELA']
                       circuito = dataExcel[property]['CIR']
                       

                        await pool.query('INSERT INTO escuelas set nombre =?, circuito=?', [nombre, circuito]);
                    }
                    /////////¿Actualmente  se encuentra estudiando? actividad adicional
                    /////////////Tipo de empleo



                }
                //////
                catch (error) {
                    console.log(error)
                }

                let id_esc = await pool.query('select * from escuelas where nombre = ? ',[dataExcel[property]['ESCUELA']])
                numero = dataExcel[property]['MESA']
                let existe_mesa = await pool.query('select * from mesas_fiscales where numero=? and id_escuela =?',[numero,id_esc[0]['id'] ])
                if (existe_mesa.length>0){
                    console.log('ya existe mesa')
                }else{
                    await pool.query('INSERT INTO mesas_fiscales set numero =?, id_escuela=?', [numero, id_esc[0]['id']]);
                    console.log('mesa_cargada')
                }

            /* if ((dataExcel[property]['Sucursal']).includes(cuil_cuit)) {
                estado = 'A'
            }*/


        }
        res.json(mandar)
    } catch (error) {
        console.log(error)
        res.send(error)

    }




})


router.post('/cargarinscripciones', async (req, res) => {
    const { id } = req.body
    console.log(id)
    const estract = await pool.query('select * from excelfiscalizacion where id = ? ', [id])
    console.log(estract)
    const nombree = estract[0]['nombre']
    console.log(nombree)

    let mandar = []
    // const workbook = XLSX.readFile(`./src/Excel/${nombree}`)

    // const workbook = XLSX.readFile('./src/Excel/1665706467397-estr-cuentas_PosicionConsolidada.xls')

    try {
        const workbook = XLSX.readFile(path.join(__dirname, '../Excel/' + nombree))
        const workbooksheets = workbook.SheetNames
        const sheet = workbooksheets[0]

        const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
        //console.log(dataExcel)

        let regex = /(\d+)/g;






 
        let dni = undefined
        let escuela = 'Sin definir'
        for (const property in dataExcel) {
   
            dni = dataExcel[property]['DNI']
            console.log(dni)
            if (dni != undefined) {
                console.log(dni)
                existe = await pool.query('select * from personas_fiscalizacion where dni = ?', [dni])
                console.log('existe')
                try {
                    ///////




                    if (existe.length > 0) {//////si existe la personas

                        console.log(dni)

                        ///actualiza

                        let fiscal_antes = dataExcel[property]['¿Fuiste fiscal antes?']



                        if (dataExcel[property]['Nombre y Apellido'] === undefined) {
                            nombre = 'No'
                        } else {
                            nombre = dataExcel[property]['Nombre y Apellido']

                        }
                        if (dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)'] === undefined) {
                            domicilio = 'No'
                        } else {
                            domicilio = dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)']
                        }
                        if (dataExcel[property]['Teléfono de contacto'] === undefined) {
                            telefono = 'No'
                        } else {
                            telefono = dataExcel[property]['Teléfono de contacto']

                        }
                        if (dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?'] === undefined) {
                            movilidad = 'No'
                        } else {
                            movilidad = dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?']

                        }
                        if (dataExcel[property]['Vegane'] === undefined) {
                            vegano = 'No'
                        } else {
                            vegano = dataExcel[property]['Vegane']

                        }
                        if (dataExcel[property]['¿Fuiste fiscal antes?'] === undefined) {
                            fiscal_antes = 'No'
                        } else {
                            if (dataExcel[property]['¿Fuiste fiscal antes?'] === 'Si, fui fiscal antes') {
                                fiscal_antes = 'Si'
                            }
                            fiscal_antes = 'No'

                        }
                        await pool.query('update personas_fiscalizacion set nombre=?,domicilio =?,telefono=?,movilidad=?,vegano=?, fiscal_antes=?  where dni = ?', [nombre, domicilio, telefono, movilidad, vegano, fiscal_antes, dni])


                    } else {
                        ///crear nueva persona 

                        if (dataExcel[property]['Nombre y Apellido'] === undefined) {
                            nombre = 'No'
                        } else {
                            nombre = dataExcel[property]['Nombre y Apellido']

                        }
                        if (dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)'] === undefined) {
                            domicilio = 'No'
                        } else {
                            domicilio = dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)']
                        }
                        if (dataExcel[property]['Teléfono de contacto'] === undefined) {
                            telefono = 'No'
                        } else {
                            telefono = dataExcel[property]['Teléfono de contacto']

                        }
                        if (dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?'] === undefined) {
                            movilidad = 'No'
                        } else {
                            movilidad = dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?']

                        }
                        if (dataExcel[property]['Vegane'] === undefined) {
                            vegano = 'No'
                        } else {
                            vegano = dataExcel[property]['Vegane']

                        }
                        if (dataExcel[property]['¿Fuiste fiscal antes?'] === undefined) {
                            fiscal_antes = 'No'
                        } else {
                            if (dataExcel[property]['¿Fuiste fiscal antes?'] === 'Si, fui fiscal antes') {
                                fiscal_antes = 'Si'
                            }
                            fiscal_antes = 'No'

                        }


                        await pool.query('INSERT INTO personas_fiscalizacion set nombre=?,domicilio =?,telefono=?,movilidad=?,vegano=?, fiscal_antes=?,dni=?', [nombre, domicilio, telefono, movilidad, vegano, fiscal_antes, dni]);
                    }
                    /////////¿Actualmente  se encuentra estudiando? actividad adicional
                    /////////////Tipo de empleo



                }
                //////
                catch (error) {
                    console.log(error)
                }


              
                if ( dataExcel[property]['Escuela'] === undefined) {
                    escuela = 'Sin definir'
                } else {
                    escuela =  dataExcel[property]['Escuela']

                }
            
                exi = await pool.query('select * from escuelas where nombre =?', [escuela])
                if (exi.length > 0) {
                    id_escuela = exi[0]['id']
                } else {
                    await pool.query('INSERT INTO escuelas set nombre=?', [escuela])
                    exi = await pool.query('select * from escuelas where nombre =?', [escuela])
                    id_escuela = exi[0]['id']
                }

              

                try {
                    let exisinscrip = await pool.query('select * from inscripciones_fiscales where  dni=? ', [])
                        if (exisinscrip.length  > 0){
                            console.log('ya inscripto')
                        }else{
                    await pool.query('INSERT INTO inscripciones_fiscales set id_escuela=?, nombre=?, dni=?', [id_escuela, nombre, dni])
                    console.log('cargado')
                  } 
              



                } catch (e) {
                    console.log(e)
                }
            }
            /* if ((dataExcel[property]['Sucursal']).includes(cuil_cuit)) {
                estado = 'A'
            }*/


        }
        res.json(mandar)
    } catch (error) {
        console.log(error)
        res.send(error)

    }




})


router.post('/subirprueba', fileUpload, async (req, res, done) => {
    const { formdata, file } = req.body

    try {


        const type = req.file.mimetype
        const name = req.file.originalname
        // const data = fs.readFileSync(path.join(__dirname, '../Excel' + req.file.filename))
        fech = (new Date(Date.now())).toLocaleDateString()
        console.log(9)
        console.log(req.file.filename)

        await pool.query('insert into excelfiscalizacion set fecha=?, nombre=?', [fech, req.file.filename])
        res.send('Imagen guardada con exito')
    } catch (error) {
        console.log(error)
    }





})



router.post('/subirpruebaescuelas', fileUpload, async (req, res, done) => {
    const { formdata, file } = req.body

    try {


        const type = req.file.mimetype
        const name = req.file.originalname
        // const data = fs.readFileSync(path.join(__dirname, '../Excel' + req.file.filename))
        fech = (new Date(Date.now())).toLocaleDateString()
        console.log(9)
        console.log(req.file.filename)

        await pool.query('insert into excelescuelas set fecha=?, nombre=?', [fech, req.file.filename])
        res.send('Imagen guardada con exito')
    } catch (error) {
        console.log(error)
    }





})
module.exports = router
