const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const pool2 = require('../database2')
const XLSX = require('xlsx')
const caregorizar = require('./funciones/caregorizar')
const multer = require('multer')
const path = require('path')
const fs = require('fs')


const diskstorage = multer.diskStorage({
  destination: path.join(__dirname, '../Excel'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-inscrip-' + file.originalname)

  }
}) //para que almacene temporalmente la imagen
const fileUpload = multer({
  storage: diskstorage,

}).single('image')


const upload = multer({ dest: 'uploads/' });


router.get('/sacarcero', async (req, res) => {

  const personas = await pool.query('select * from personas')
  for(x in personas){
    cadena=personas[x]['tel']
    if (cadena.charAt(0) === "0") {
      console.log('actualizado',personas[x]['tel'],'a ')
      // Si es "0", devolver el resto de la cadena después del primer carácter
      ac= cadena.slice(1);
       console.log(ac)
       await pool.query('update personas set tel=? where id=?',[ac,personas[x]['id']])

  } 
 

  }
  res.send('Listo')
})


router.post('/subirexcelclientes', upload.single('excel'), async (req, res) => {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Suponiendo que hay solo una hoja en el archivo

    // Obtener los datos de la hoja
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Procesar los datos
  /*   const sheetData = sheetData.map(row => ({
      nombre: row.Nombre,
      apellido: row.Apellido

     ));    // Agrega más campos según las columnas que necesites procesar
    } */



    ///////////////////////////////////////////////////////////////////
    for (property in sheetData) {
      // a += 1
        ///////

  
          ///actualizar

          if (sheetData[property]['adrema'] === undefined) {
            adrema = 'sin definir'
          } else {
            adrema = sheetData[property]['Nombre']

          }
          exis = await pool2.query('select * from clientes where nombre=? and telefono=? and correo=? and fecha_nac=? and estado_civil=? and sexo=? and provincia=?', [sheetData[property]['nombre'],sheetData[property]['tel'],sheetData[property]['email'],sheetData[property]['fecha_nac'],sheetData[property]['estadoc'],sheetData[property]['sexo'],sheetData[property]['provincia']])
          if (exis==0){
            await pool2.query('insert into clientes set nombre=?,telefono=?,correo=?,fecha_nac=?,estado_civil=?,sexo=?,provincia=?', [sheetData[property]['nombre'],sheetData[property]['tel'],sheetData[property]['email'],sheetData[property]['fecha_nac'],sheetData[property]['estadoc'],sheetData[property]['sexo'],sheetData[property]['provincia']])

          }
  

    }


    // Devolver los datos procesados como respuesta
    res.json('realizado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo Excel.');
  }
})


router.post('/subirexcellotes', upload.single('excel'), async (req, res) => {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Suponiendo que hay solo una hoja en el archivo

    // Obtener los datos de la hoja
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Procesar los datos
  /*   const sheetData = sheetData.map(row => ({
      nombre: row.Nombre,
      apellido: row.Apellido

     ));    // Agrega más campos según las columnas que necesites procesar
    } */



    ///////////////////////////////////////////////////////////////////
    for (property in sheetData) {
      // a += 1
        ///////

  
          ///actualizar

          if (sheetData[property]['adrema'] === undefined) {
            adrema = 'sin definir'
          } else {
            adrema = sheetData[property]['Nombre']

          }
          exis = await pool2.query('select * from lotes where manzana=? and sector=? and lote=?', [sheetData[property]['manzana'],sheetData[property]['sector'],sheetData[property]['lote']])
          if (exis==0){
            await pool2.query('insert into lotes set manzana=?,lote=?,sector=?,superficie=?,estado=?,adrema=?', [sheetData[property]['manzana'],sheetData[property]['lote'],sheetData[property]['sector'],sheetData[property]['superficie'],sheetData[property]['estado'],adrema])

          }
  

    }


    // Devolver los datos procesados como respuesta
    res.json('realizado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo Excel.');
  }
})


router.post('/subirexcel', upload.single('excel'), async (req, res) => {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Suponiendo que hay solo una hoja en el archivo

    // Obtener los datos de la hoja
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Procesar los datos
  /*   const sheetData = sheetData.map(row => ({
      nombre: row.Nombre,
      apellido: row.Apellido

     ));    // Agrega más campos según las columnas que necesites procesar
    } */


 

 



    ///////////////////////////////////////////////////////////////////
    for (property in sheetData) {
      // a += 1
      cat="cero"
      console.log(sheetData[property]['D.N.I.'])
      aux = sheetData[property]['D.N.I.']
      existe = await pool.query('select * from personas where dni = ?', [aux])
      try {
        ///////
        yainscripto = await pool.query('select * from inscripciones where dni_persona = ? and edicion=3', [aux])
        if (yainscripto.length == 0) {



        if (existe.length > 0) {

         

          ///actualizar

          if (sheetData[property]['Nombre'] === undefined) {
            nombre = 'No'
          } else {
            nombre = sheetData[property]['Nombre']

          }
          if (sheetData[property]['Apellido'] === undefined) {
            apellido = 'No'
          } else {
            apellido = sheetData[property]['Apellido']
          }
          if (sheetData[property]['D.N.I.'] === undefined) {
            dni = 'No'
          } else {
            dni = sheetData[property]['D.N.I.']
          }
          if (sheetData[property]['Correo electrónico'] === undefined) {
            mail = 'No'
          } else {
            mail = sheetData[property]['Correo electrónico']

          }
          if (sheetData[property]['Domicilio'] === undefined) {
            direccion = 'No'
          } else {
            direccion = sheetData[property]['Domicilio']
          }
          if (sheetData[property]['recibir_novedades'] === undefined) {
            recibir_novedades = 'No'
          } else {
            recibir_novedades = sheetData[property]['recibir_novedades']
          }
          if (sheetData[property]['Barrio'] === undefined) {
            barrio = 'No'
          } else {
            barrio = sheetData[property]['Barrio']
          }
          if (sheetData[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)'] === undefined) {
            fecha_nac = 'No'
          } else {
            fecha_nac = sheetData[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)']
          }
          if (sheetData[property]['Número de teléfono de contacto'] === undefined) {
            tel = 'No'
          } else {
            tel = sheetData[property]['Número de teléfono de contacto']
          }
          if (sheetData[property]['Número de teléfono alternativo'] === undefined) {
            tel2 = 'No'
          } else {
            tel2 = sheetData[property]['Número de teléfono alternativo']
          }
          if (sheetData[property]['¿Participaste o participas de nuestra Feria de Mujeres Emprendedoras?'] === undefined) {
            participante_feria = 'No'
          } else {
            participante_feria = sheetData[property]['¿Participaste o participas de nuestra Feria de Mujeres Emprendedoras?']
          }
          

          if (sheetData[property]['¿Participaste de algún curso de la Escuela de Mujeres Emprendedoras anteriormente? '] === undefined) {
            participante_anterior = 'No'
          } else {
            participante_anterior = sheetData[property]['¿Participaste de algún curso de la Escuela de Mujeres Emprendedoras anteriormente? ']
          }
          if (sheetData[property]['Nivel educativo alcanzado'] === undefined) {
            nivel_secundario = 'No'
          } else {
            nivel_secundario = sheetData[property]['Nivel educativo alcanzado']
          }
          if (sheetData[property]['¿Actualmente estas trabajando?'] === undefined) {
            trabajo = 'No'
          } else {
            trabajo = sheetData[property]['¿Actualmente estas trabajando?']
          }
          if (sheetData[property]['Si tu respuesta fue sí, contamos como es tu empleo:'] === undefined) {
            tipo_trabajo = 'No'
          } else {
            tipo_trabajo = sheetData[property]['Si tu respuesta fue sí, contamos como es tu empleo:']
          }
          if (sheetData[property]['¿Qué tipo de trabajo posees?'] === undefined) {
            tipo_empleo = 'No'
          } else {
            tipo_empleo = sheetData[property]['¿Qué tipo de trabajo posees?']
          }
          if (sheetData[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'] === undefined) {
            hijos = 'No'
          } else {
            hijos = sheetData[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?']
          }
          if (sheetData[property]['¿Te gustaría recibir novedades de nuevos cursos y/o actividades que llevemos adelante desde nuestro espacio?'] === undefined) {
            novedades = 'No'
          } else {
            novedades = sheetData[property]['¿Te gustaría recibir novedades de nuevos cursos y/o actividades que llevemos adelante desde nuestro espacio?']
          }
         idp = await pool.query('select * from personas where dni =?',[dni])
          cat = await caregorizar.asignarcategoria(idp)

          await pool.query('update personas set categoria=?, tipo_empleo=?, mail=?, participante_feria=?, recibir_novedades=?,direccion =?,barrio=?,fecha_nac=?, tel=?, tel2=?,participante_anterior=?,nivel_secundario=?,trabajo=?,tipo_trabajo=?,hijos=? where dni = ?', [cat,tipo_empleo, mail, participante_feria, recibir_novedades,direccion, barrio, fecha_nac, tel, tel2, participante_anterior, nivel_secundario, trabajo, tipo_trabajo, hijos, aux])


        } else {
          ///crear nueva persona 

          if (sheetData[property]['Nombre'] === undefined) {
            nombre = 'No'
          } else {
            nombre = sheetData[property]['Nombre']

          }
          if (sheetData[property]['Apellido'] === undefined) {
            apellido = 'No'
          } else {
            apellido = sheetData[property]['Apellido']
          }
          if (sheetData[property]['D.N.I.'] === undefined) {
            dni = 'No'
          } else {
            dni = sheetData[property]['D.N.I.']
          }
          if (sheetData[property]['Domicilio'] === undefined) {
            direccion = 'No'
          } else {
            direccion = sheetData[property]['Domicilio']
          }
          if (sheetData[property]['Correo electrónico'] === undefined) {
            mail = 'No'
          } else {
            mail = sheetData[property]['Correo electrónico']

          }
          if (sheetData[property]['¿Qué tipo de trabajo posees?'] === undefined) {
            tipo_empleo = 'No'
          } else {
            tipo_empleo = sheetData[property]['¿Qué tipo de trabajo posees?']
          }
          if (sheetData[property]['recibir_novedades'] === undefined) {
            recibir_novedades = 'No'
          } else {
            recibir_novedades = sheetData[property]['recibir_novedades']
          }
          if (sheetData[property]['¿Participaste o participas de nuestra Feria de Mujeres Emprendedoras?'] === undefined) {
            participante_feria = 'No'
          } else {
            participante_feria = sheetData[property]['¿Participaste o participas de nuestra Feria de Mujeres Emprendedoras?']
          }
          
          if (sheetData[property]['Barrio'] === undefined) {
            barrio = 'No'
          } else {
            barrio = sheetData[property]['Barrio']
          }
          if (sheetData[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)'] === undefined) {
            fecha_nac = 'No'
          } else {
            fecha_nac = sheetData[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)']
          }
          if (sheetData[property]['Número de teléfono de contacto'] === undefined) {
            tel = 'No'
          } else {
            tel = sheetData[property]['Número de teléfono de contacto']
          }
          if (sheetData[property]['Número de teléfono alternativo'] === undefined) {
            tel2 = 'No'
          } else {
            tel2 = sheetData[property]['Número de teléfono alternativo']
          }
          if (sheetData[property]['¿Participaste de algún curso de la Escuela de Mujeres Emprendedoras anteriormente? '] === undefined) {
            participante_anterior = 'No'
          } else {
            participante_anterior = sheetData[property]['¿Participaste de algún curso de la Escuela de Mujeres Emprendedoras anteriormente? ']
          }
          if (sheetData[property]['Nivel educativo alcanzado'] === undefined) {
            nivel_secundario = 'No'
          } else {
            nivel_secundario = sheetData[property]['Nivel educativo alcanzado']
          }
          if (sheetData[property]['¿Actualmente estas trabajando?'] === undefined) {
            trabajo = 'No'
          } else {
            trabajo = sheetData[property]['¿Actualmente estas trabajando?']
          }
          if (sheetData[property]['Si tu respuesta fue sí, contamos como es tu empleo:'] === undefined) {
            tipo_trabajo = 'No'
          } else {
            tipo_trabajo = sheetData[property]['Si tu respuesta fue sí, contamos como es tu empleo:']
          }
          if (sheetData[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'] === undefined) {
            hijos = 'No'
          } else {
            hijos = sheetData[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?']
          }
          if (sheetData[property]['¿Te gustaría recibir novedades de nuevos cursos y/o actividades que llevemos adelante desde nuestro espacio?'] === undefined) {
            novedades = 'No'
          } else {
            novedades = sheetData[property]['¿Te gustaría recibir novedades de nuevos cursos y/o actividades que llevemos adelante desde nuestro espacio?']
          }
          let idp = await pool.query('select * from personas where dni =?',[dni])
          cat = await caregorizar.asignarcategoria(idp)

          await pool.query('INSERT INTO personas set categoria=?,tipo_empleo=?, mail=?, participante_feria=?, recibir_novedades=?, nombre=?,apellido=?,dni=?,direccion=?,barrio=?,fecha_nac=?,tel=?, tel2=?,participante_anterior=?, nivel_secundario=?, trabajo=?,tipo_trabajo=?,hijos=?', [cat,tipo_empleo, mail, participante_feria, recibir_novedades,nombre, apellido, dni, direccion , barrio, fecha_nac, tel, tel2, participante_anterior, nivel_secundario, trabajo, tipo_trabajo, hijos]);
        }
        /////////¿Actualmente  se encuentra estudiando? actividad adicional
        /////////////Tipo de empleo
      }else{
        
      }

      }
      //////
      catch (error) {
        console.log(error)
      }

      switch (sheetData[property]['Selecciona el primer curso de mayor preferencia']) {
        case "Martes de 08 a 10hs - COSTURA CREATIVA":
          id_curso = 408
          break;
        case "Martes de 10 a 12hs - COSTURA CREATIVA":
          id_curso = 409
          break;

        case "Martes de 14 a 16hs - COSTURA CREATIVA":
          id_curso = 410
          break;
        case "Martes de 16 a 18hs - COSTURA CREATIVA":
          id_curso = 411
          break;
        case "Martes de 18 a 20hs - COSTURA CREATIVA":
          id_curso = 412
            break;
        case "Lunes de 14 a 16hs - BARBERÍA":
          id_curso = 413
              break;

        case "Lunes de 16 a 18hs - BARBERÍA":
          id_curso = 414
                break;

        case "Lunes de 18 a 20hs - BARBERÍA":
          id_curso = 415
                  break;

        case "Jueves de 08 a 10hs - BARBERÍA":
          id_curso = 416
                    break;

        case "Jueves de 10 a 12hs - BARBERÍA":
          id_curso = 417
                      break;

        case "Lunes de 08 a 10hs - CROCHET DESDE CERO":
          id_curso = 418
                        break;

        case "Lunes de 10 a 12hs - CROCHER DESDE CERO":
          id_curso = 419
                          break;
        case "Miércoles 08 a 10hs - CROCHET DESDE CERO":
          id_curso = 420
                            break;

        case "Miércoles de 10 a 12hs - CROCHET DESDE CERO":
          id_curso = 421
                              break;

        case "Miércoles de 14 a 16hs - COCINA EXPRESS":
          id_curso = 422
                                break;

        case "Miércoles de 16 a 18hs - COCINA EXPRESS":
          id_curso = 423
                                  break;

        case "Miércoles de 18 a 20hs - COCINA EXPRESS":
          id_curso = 424
                                    break;

        case "Viernes de 08 a 10hs - COCINA EXPRESS":
          id_curso = 425
                                      break;

        case "Viernes de 10 a 12hs - COCINA EXPRESS":
          id_curso = 426
                                        break;

        case "Jueves de 14 a 16hs - DECORACIÓN DE TORTAS":
          id_curso = 427
                                          break;

        case "Jueves de 16 a 18hs - DECORACIÓN DE TORTAS":
          id_curso = 428
                                            break;
                                            
        case "Jueves de 18 a 20hs - DECORACIÓN DE TORTAS":
          id_curso = 429
                                            break;
                                            
        case "Viernes de 14 a 16hs - COCTELERÍA":
          id_curso = 430
                                            break;
                                            
        case "Viernes de 16 a 18hs - COCTELERÍA":
          id_curso = 431
                                            break;
                                            
        case "Viernes de 18 a 20hs - COCTELERÍA":
          id_curso = 432
                                            break;
                                            




        default:
          id_curso = 1
          break;
      }
      uno = id_curso


      switch (sheetData[property]['Selecciona el segundo curso de mayor preferencia']) {
        case "Martes de 08 a 10hs - COSTURA CREATIVA":
          id_curso = 408
          break;
        case "Martes de 10 a 12hs - COSTURA CREATIVA":
          id_curso = 409
          break;

        case "Martes de 14 a 16hs - COSTURA CREATIVA":
          id_curso = 410
          break;
        case "Martes de 16 a 18hs - COSTURA CREATIVA":
          id_curso = 411
          break;
        case "Martes de 18 a 20hs - COSTURA CREATIVA":
          id_curso = 412
            break;
        case "Lunes de 14 a 16hs - BARBERÍA":
          id_curso = 413
              break;

        case "Lunes de 16 a 18hs - BARBERÍA":
          id_curso = 414
                break;

        case "Lunes de 18 a 20hs - BARBERÍA":
          id_curso = 415
                  break;

        case "Jueves de 08 a 10hs - BARBERÍA":
          id_curso = 416
                    break;

        case "Jueves de 10 a 12hs - BARBERÍA":
          id_curso = 417
                      break;

        case "Lunes de 08 a 10hs - CROCHET DESDE CERO":
          id_curso = 418
                        break;

        case "Lunes de 10 a 12hs - CROCHER DESDE CERO":
          id_curso = 419
                          break;
        case "Miércoles 08 a 10hs - CROCHET DESDE CERO":
          id_curso = 420
                            break;

        case "Miércoles de 10 a 12hs - CROCHET DESDE CERO":
          id_curso = 421
                              break;

        case "Miércoles de 14 a 16hs - COCINA EXPRESS":
          id_curso = 422
                                break;

        case "Miércoles de 16 a 18hs - COCINA EXPRESS":
          id_curso = 423
                                  break;

        case "Miércoles de 18 a 20hs - COCINA EXPRESS":
          id_curso = 424
                                    break;

        case "Viernes de 08 a 10hs - COCINA EXPRESS":
          id_curso = 425
                                      break;

        case "Viernes de 10 a 12hs - COCINA EXPRESS":
          id_curso = 426
                                        break;

        case "Jueves de 14 a 16hs - DECORACIÓN DE TORTAS":
          id_curso = 427
                                          break;

        case "Jueves de 16 a 18hs - DECORACIÓN DE TORTAS":
          id_curso = 428
                                            break;
                                            
        case "Jueves de 18 a 20hs - DECORACIÓN DE TORTAS":
          id_curso = 429
                                            break;
                                            
        case "Viernes de 14 a 16hs - COCTELERÍA":
          id_curso = 430
                                            break;
                                            
        case "Viernes de 16 a 18hs - COCTELERÍA":
          id_curso = 431
                                            break;
                                            
        case "Viernes de 18 a 20hs - COCTELERÍA":
          id_curso = 432
                                            break;
                                            




        default:
          id_curso = 1
          break;
      }
      dos = id_curso

        if (yainscripto.length == 0) {
      try {

       
        if (sheetData[property]['D.N.I.'] === undefined) {
          dni = '34825125'
        } else {
          dni = sheetData[property]['D.N.I.']
        }
        let idp = await pool.query('select * from personas where dni =?',[dni])
        cat = await caregorizar.asignarcategoria(idp)
        console.log(cat)
        await pool.query('update personas set categoria=? where dni =?', [cat, dni])

        if (sheetData[property]['¿Por que querés tomar alguno de estos cursos?'] === undefined) {
          motivacion = 'Sin completar'
        } else {
          motivacion = sheetData[property]['¿Por que querés tomar alguno de estos cursos?']
        }
        if (sheetData[property]['Posee alguno de los  siguientes dispositivos con conexión a internet:'] === undefined) {
          conexion_int = 'Sin completar'
        } else {
          conexion_int = sheetData[property]['Posee alguno de los  siguientes dispositivos con conexión a internet:']
        }
        if (sheetData[property]['D.N.I.'] === undefined) {
          dni_persona = 'Sin completar'
        } else {
          dni_persona = sheetData[property]['D.N.I.']
        }
        if (sheetData[property]['¿Qué te gustaría hacer con las habilidades aprendidas?'] === undefined) {
          objetivo = 'Sin completar'
        } else {
          objetivo = sheetData[property]['¿Qué te gustaría hacer con las habilidades aprendidas?']
        }
        if (sheetData[property]['Disponibilidad Horaria para cursar '] === undefined) {
          horario = 'Sin completar'
        } else {
          horario = sheetData[property]['Disponibilidad Horaria para cursar ']
        }
        if (sheetData[property]['¿Cómo te enteraste de los cursos?'] === undefined) {
          como_se_entero = 'Sin completar'
        } else {
          como_se_entero = sheetData[property]['¿Cómo te enteraste de los cursos?']
        }

        if (sheetData[property]['¿Qué curso te gustaría que agreguemos en las próximas ofertas?'] === undefined) {
          recomendacion = 'Sin completar'
        } else {
          recomendacion = sheetData[property]['¿Qué curso te gustaría que agreguemos en las próximas ofertas?']
        }
        


        await pool.query('INSERT INTO inscripciones set id_persona=?,motivacion=?,conexion_int=?,dni_persona=?,objetivo=?,horario=?, estado="pendiente",uno=?,dos=?,como_se_entero=?,recomendacion=?,edicion=3', [idp[0]['id'],motivacion, conexion_int, dni_persona, objetivo, horario, uno, dos,como_se_entero,recomendacion]);


      



      } catch (e) {
        console.log(e)
      }}
  
    }


    // Devolver los datos procesados como respuesta
    res.json('realizado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo Excel.');
  }
});










router.get('/traerobservaciones/:id', async (req, res) => {
  const id = req.params.id


  const etc = await pool.query('select * from observaciones where id_ref=?', [id])

  res.json(etc);
  //res.render('index')
})

router.get('/traerpersona/:id', async (req, res) => {
  const id = req.params.id


  const etc = await pool.query('select * from personas where dni=?', [id])

  res.json(etc);
  //res.render('index')
})

router.get('/traerusuario/:id', async (req, res) => {
  const id = req.params.id


  const etc = await pool.query('select nombre, usuario from usuarios where id=?', [id])

  res.json(etc);
  //res.render('index')
})



router.get('/traerencargados/', async (req, res) => {

  profesores = await pool.query('select * from usuarios where nivel=4')

  res.json(profesores)
})
router.get('/traercoordiandores/', async (req, res) => {

  profesores = await pool.query('select * from usuarios where nivel=3')
  res.json(profesores)
})



router.get('/datosusuario/:usuario', async (req, res) => {
  const usuario = req.params.usuario



  const aux = await pool.query('select * from usuarios where usuario =?', [usuario])

  const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])

  res.json([etc]);
  //res.render('index')
})
router.get('/datospersona/:id', async (req, res) => {
  const id = req.params.id

  try {


    const aux = await pool.query('select * from personas where id =?', [id])

    console.log(aux)

    res.json(aux);

  } catch (error) {
    console.log(error)
    res.json(['']);
  }
  //res.render('index')
})


router.get('/categorizarpersonas', async (req, res) => {

  criterios = await pool.query('select * from criterios ')

  const etc2 = await pool.query('select * from inscripciones where edicion=3  and estado="Inscripta"')
  for (ii in etc2) {
    etc = await pool.query('select * from personas where dni=? ', [etc2[ii]['dni_persona']])
    cat = await caregorizar.asignarcategoria(etc)

    await pool.query('update personas set categoria=? where dni =?', [cat, etc2[ii]['dni_persona']])



  }
  res.json('listo')

})
/* 
router.get('/preasignarllamados', async (req, res) => {
  etc2 = await pool.query('select * from inscripciones where estado="Preasignada"')
 const callcenter = await pool.query('select * from usuarios where nivel = 6')
  for (ii in etc2) {
    await pool.query('update inscripciones set id_call=? where id =?',[callcenter[ii % callcenter.length]['id'],etc2[ii]['id']])

  }
res.json('listo')



}) */


///funcion preasignar 

/* router.get('/preasignar', async (req, res) => {
 


  etc2 = await pool.query('select * from inscripciones where edicion=2')


  for (let i = 0; i < 1250; i++) {


    await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[i]['id']])



  } 

}) */
/*   criterios =  await pool.query('select * from criterios ')
  
  uno=10*criterios[criterios.length-1]['uno']
  dos=10*criterios[criterios.length-1]['dos']
  tres=10*criterios[criterios.length-1]['tres']
  cuatro=10*criterios[criterios.length-1]['cuatro']
  cinco=10*criterios[criterios.length-1]['cinco']
  seis=10*criterios[criterios.length-1]['seis'] 
  siete=10*criterios[criterios.length-1]['siete']
  ocho=10*criterios[criterios.length-1]['ocho']
  nueve=10*criterios[criterios.length-1]['nueve']
  diez=10*criterios[criterios.length-1]['diez']
  once=10*criterios[criterios.length-1]['once']
  const etc2 = await pool.query('select * from inscripciones where edicion=2  ')
  console.log(uno,dos,tres,cuatro,cinco,seis,siete,ocho,nueve,diez,once)
  for (ii in etc2) {
     etc = await pool.query('select * from personas where dni=? ',[etc2[ii]['dni_persona']])
    cat = await caregorizar.asignarcategoria([etc[0]])
   await pool.query('update personas set categoria=? where dni =?',[cat,etc2[ii]['dni_persona']])

   switch (cat) {
    case "uno":
      if (uno>0){
        await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
        uno-=1
      }

      break;
    case "dos":
      if (dos>0){
        await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
        dos-=1
      }
      break;
    case "tres":
      if (tres>0){
        await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
        tres-=1
      }
      break;
    case "cuatro":
      if (cuatro>0){
        await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
        cuatro-=1
      }
      break;
    case "cinco":
      if (cinco>0){
        await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
        cinco-=1
      }
      break;
      case "seis":
        if (seis>0){
          await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
          seis-=1
        }
        break;
      case "siete":
        if (siete>0){
          await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
          siete-=1
        }
        break;
      case "ocho":
        if (ocho>0){
          await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
          ocho-=1
        }
        break;
      case "nueve":
        if (nueve>0){
          await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
          nueve-=1
        }
        break;
      case "diez":
        if (diez>0){
          await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
          diez-=1
        }
        break;
        case "once":
          if (once>0){
            await pool.query('update inscripciones set estado="Preasignada" where id =?',[etc2[ii]['id']])
            once-=1
          }
          break;
    default:
 
      break;
  }

  }


  res.json ('')
  
  })
 */



router.get('/categorizarpersonastodas', async (req, res) => {

  criterios = await pool.query('select * from criterios ')


  etc = await pool.query('select * from personas')
  for (ii in etc) {

    cat = await caregorizar.asignarcategoria([etc[ii]])
    await pool.query('update personas set categoria=? where dni =?', [cat, etc[ii]['dni']])


    ///////


    ///



  }
  res.json('listo')

})

///// lista
router.get('/lista', async (req, res) => {
  const usuario = req.params.usuario

  const etc = await pool.query('select * from personas  ')


  res.json(etc);
  //res.render('index')
})




///////////detalleusuarioparainscripcion
router.get('/datosusuarioporid/:dni', async (req, res) => {
  const dni = req.params.dni


  const etc = await pool.query('select * from personas where dni =?', [dni])

  const curso1 = await pool.query('select cursos.nombre prioridaduno from inscripciones join cursos on inscripciones.uno =cursos.id where inscripciones.dni_persona =?', [dni])
  const curso2 = await pool.query('select cursos.nombre prioridaddos from inscripciones join cursos on inscripciones.dos =cursos.id where inscripciones.dni_persona =?', [dni])
  console.log(dni)
  let cursado = await pool.query('select selec2.nombrecurso from cursado  join (select id as idturnos, id_curso as idcurso from turnos) as selec1 on cursado.id_turno = selec1.idturnos join (select nombre as nombrecurso,  id as idcurso2 from cursos ) as selec2 on selec1.idcurso=selec2.idcurso2  where cursado.id_persona=?', [etc[0]['id']])

  if (cursado.length === 0) {
    cursado = [{ anotado: null }]
  }



  try {
    nombre = etc[0]['apellido'] + etc[0]['nombre']
  } catch (error) {
    nombre = 'no determinado'
  }

  try {
    prioridad1 = curso1[0]['prioridaduno']
  } catch (error) {
    prioridad1 = 'no determinado'
  }
  try {
    prioridad2 = curso2[0]['prioridaddos']
  } catch (error) {
    prioridad2 = 'no determinado'
  }
  try {
    anotado = cursado[0]['nombrecurso']
  } catch (error) {
    anotado = 'no determinado'
  }
  try {
    hijos = etc[0]['hijos']
  } catch (error) {
    hijos = 'no determinado'
  }
  try {
    trabajo = etc[0]['trabajo']
  } catch (error) {
    trabajo = 'no determinado'
  }
  try {
    tipo_trabajo = etc[0]['tipo_trabajo']
  } catch (error) {
    5
    tipo_trabajo = 'no determinado'
  }
  try {
    ficha = {
      nombre,
      prioridad1,
      prioridad2,
      anotado,
      hijos,
      trabajo,
      tipo_trabajo
    }
  } catch (error) {
    ficha = {
      nombre: 'no determinado',
      prioridad1: 'no determinado',
      prioridad2: 'no determinado',
      anotado: 'no determinado'
    }
  }


  cat = await caregorizar.asignarcategoria(etc)

  criterios = await pool.query(' select * from criterios ')
  porcentaje = criterios[criterios.length - 1][cat]


  res.json([ficha, porcentaje, cat]);




  /* 
    participante_ant = "No"
    if (etc[0]['participante_anterior'] == "Sí") {
      participante_ant = "Si"
    }
  
    tiene_hijos = "Si"
  
    if ((etc[0]['hijos'] == "0") || (etc[0]['hijos'] == null)) {
      tiene_hijos = "No"
    }
  
    trabaja = "No"
    tipot = ""
    console.log('revision')
    console.log(etc[0]['trabajo'])
    console.log(trabaja)
    if (etc[0]['trabajo'] == "Si") {
      trabaja = "Si"
      tipot = etc[0]['tipo_trabajo']
  
  
    }
    console.log(trabaja)
  
    
    categoria=''
    console.log(ficha)
    porcentaje_real = 100
    if (participante_ant === "Si") {
      // porcentaje_real=45
      console.log('Participante anteirior')
      ///45%   PARTICIPO  TIENE HIJOS
      if (tiene_hijos === "Si") {
        console.log('Tiene hijos')
        ///78% tiene hijos
        //  porcentaje_real=35.1
        if (trabaja === "Si") {
          console.log('Trabaja')
          if (tipot === "Formal") {
            console.log('formalmente')
            ///trabaja formal 3.5
            porcentaje_real = 1.2285
            categoria='K'
          } else {
            console.log('Informalmente')
            ///// trabaja informalñ 6.5
            porcentaje_real = 2.2815
            categoria='I'
          }
  
  
        } else {
          ///No trabaja 90%
          console.log('No trabaja')
          porcentaje_real = 31.59
          categoria='A'
  
  
  
        }
      } else {
        ///22%  Notiene hijos
        //  porcentaje_real=9.9
        console.log('No tiene hijos')
        if (trabaja === "Si") {
          ///15%
          console.log('Trabaja')
          porcentaje_real = 1.485
          categoria='J'
  
        } else {
          ///No trabaja 85%
          console.log('no trabaja')
          porcentaje_real = 8.415
          categoria='E'
  
        }
  
  
  
      }
  
  
  
    } else {///////////////////////NO PARTICIPARON 
      ////55% 
      console.log('No participaron')
      //   porcentaje_real=55
      if (tiene_hijos === "Si") {
        ///68&  
        console.log('Tiene hijos')
        //  porcentaje_real=37.4
        if (trabaja === "Si") {
          console.log('Trabaja')
          if (tipot === "Formal") {
            /////15%
            console.log('formalmente')
            porcentaje_real = 5.61
            categoria='F'
          } else {
            console.log('Informalmente')
            porcentaje_real = 13.09
            categoria='C'
            ///35%
  
          }
  
        } else {
          porcentaje_real = 18.7
          console.log('No trabaja')
          categoria='B'
          //no trabaja 50%
        }
  
      } else {
        ///no tiene hijos
        //  porcentaje_real=17.6
        ///32%
        console.log('No tiene hijos')
  
        if (trabaja === "Si") {
          console.log('trabaja')
          if (tipot === "Formal") {
            console.log('formal')
            /////15
            porcentaje_real = 2.64
            categoria='H'
          } else {
            porcentaje_real = 2.64
            categoria='G'
            ///15
  
          }
  
        } else {
          porcentaje_real = 12.32
          categoria='D'
          //no trabaja 70%
        }
  
      }
  
    }
   */



  //res.render('index')
})



router.post("/agregarobservacion", async (req, res) => {
  let { id, observaciones } = req.body


  try {
    await pool.query('insert into observaciones set detalle=?, id_ref=?, fecha=? ', [observaciones, id, (new Date(Date.now())).toLocaleDateString()])
    res.json(`Realizado`)
  } catch (error) {
    console.log(error)
    res.json('No escribiste nadaaa')
  }


})


router.post("/enviarinscripcioncarnaval", async (req, res) => {
  let {   nombre, apellido, dni, tel, localidad, fecha_nac,  direccion, barrio } = req.body
  
  try {
    let pers = await pool.query('select * from personas where dni =?', [dni])
    if (pers.length > 0) {
      await pool.query('update personas set fecha_nac=?, nombre=?, apellido=?, dni=?, tel=?, direccion=?,barrio=?,localidad=? where dni=? ', [fecha_nac, nombre, apellido, dni, tel, direccion, barrio,localidad,  dni])
    } else {
      await pool.query('insert into personas set fecha_nac=?, nombre=?, apellido=?, dni=?, tel=?,direccion=?,barrio=?,localidad=? ', [fecha_nac, nombre, apellido, dni, tel, direccion, barrio, localidad])

    }
    pers = await pool.query('select * from personas where dni =?', [dni])
    const yainsc = await pool.query('select * from inscripciones_carnaval where id_persona =? ', [pers[0]['id']])
    let mensaje = ''
    if (yainsc.length > 0) {
      mensaje = 'Con estos datos ya tenemos una inscripción, no hace falta que te vuelvas a anotar. Por favor aguarda nuestro contacto.'
    }
    else {
      fecha = (new Date(Date.now()))
      await pool.query('insert into inscripciones_carnaval set fecha=?,dni_persona=?,id_persona=?', [fecha, dni, pers[0]['id']])
      mensaje = 'Inscripcion realizada, te pedimos que aguardes contacto'
    }


    res.json(mensaje)

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio, verifica que hayas completado todos los campos')
  }
})

router.post("/enviarinscripcion", async (req, res) => {
  let { nombre, apellido, dni, tel, tel2, fecha_nac, prioridad1, prioridad2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, participante_feria, motivacion } = req.body
  ///participante_feria
  if (tipo_trabajo === undefined) {
    tipo_trabajo = 'Sin determinar'
  }
  if (participante_feria === undefined) {
    participante_feria = 'Sin determinar'
  }

  if (tipo_empleo === undefined) {
    tipo_empleo = 'Sin determinar'
  }
  ///fecha
  if (cantidad_hijos === undefined) {
    cantidad_hijos = 'Sin determinar'
  }

  console.log(nombre, fecha_nac, participante_feria, apellido, dni, tel, tel2, prioridad1, prioridad2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, motivacion)

  try {
    let pers = await pool.query('select * from personas where dni =?', [dni])
    if (pers.length > 0) {
      cat = await caregorizar.asignarcategoria(pers)

      await pool.query('update personas set fecha_nac=?, nombre=?, apellido=?, dni=?, tel=?, tel2=?, mail=?,direccion=?,barrio=?,nivel_secundario=?,trabajo=?,tipo_trabajo=?,tipo_empleo=?,hijos=?,cantidad_hijos=?,participante_anterior=?, categoria=?,participante_feria=? where dni=? ', [fecha_nac, nombre, apellido, dni, tel, tel2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, cat, participante_feria, dni])
    } else {

      await pool.query('insert into personas set fecha_nac=?, nombre=?, apellido=?, dni=?, tel=?, tel2=?, mail=?,direccion=?,barrio=?,nivel_secundario=?,trabajo=?,tipo_trabajo=?,tipo_empleo=?,hijos=?,cantidad_hijos=?,participante_anterior=?,participante_feria = ? ', [fecha_nac, nombre, apellido, dni, tel, tel2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, participante_feria])
      pers = await pool.query('select * from personas where dni =?', [dni])
      cat = await caregorizar.asignarcategoria(pers)

      await pool.query('update personas set categoria=? where id=? ', [cat, pers[0]['id']])

    }
    pers = await pool.query('select * from personas where dni =?', [dni])
    const yainsc = await pool.query('select * from inscripciones where id_persona =? and edicion=2', [pers[0]['id']])
    let mensaje = ''
    if (yainsc.length > 0) {
      mensaje = 'Ya estas inscripta!'
    }
    else {
      fecha = (new Date(Date.now()))
      cat = await caregorizar.asignarcategoria(pers)
      await pool.query('insert into inscripciones set fecha=?,dni_persona=?, uno=?,dos=?,motivacion=?,id_persona=?,edicion=?', [fecha, dni, prioridad1, prioridad2, motivacion, pers[0]['id'], 6])
      mensaje = 'Inscripcion realizada, te pedimos que aguardes contacto'
    }


    res.json(mensaje)

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio, verifica que hayas completado todos los campos')
  }




})



router.post("/enviarinscripcion2", async (req, res) => {
  let {uno, dos, nombre, apellido, dni, tel, tel2, fecha_nac, prioridad1, prioridad2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, participante_feria, motivacion,modalidad,emprendimiento,genero, otrogenero } = req.body
  ///participante_feria
  if (tipo_trabajo === undefined) {
    tipo_trabajo = 'Sin determinar'
  }
  if (participante_feria === undefined) {
    participante_feria = 'Sin determinar'
  }

  if (tipo_empleo === undefined) {
    tipo_empleo = 'Sin determinar'
  }
  ///fecha
  if (cantidad_hijos === undefined) {
    cantidad_hijos = 'Sin determinar'
  }
  if (otrogenero == undefined) {
    otrogenero = 'Sin determinar'
  }
  
  if (emprendimiento == undefined) {
    emprendimiento = 'Sin determinar'
  }
  console.log(uno,dos,nombre, fecha_nac, participante_feria, apellido, dni, tel, tel2, prioridad1, prioridad2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, motivacion,modalidad ,genero, otrogenero  )

  try {
    let pers = await pool.query('select * from personas where dni =?', [dni])
    if (pers.length > 0) {
      cat = await caregorizar.asignarcategoria(pers)

      await pool.query('update personas set fecha_nac=?, nombre=?, apellido=?, dni=?, tel=?, tel2=?, mail=?,direccion=?,barrio=?,nivel_secundario=?,trabajo=?,tipo_trabajo=?,tipo_empleo=?,hijos=?,cantidad_hijos=?,participante_anterior=?, categoria=?,participante_feria=?  where dni=? ', [fecha_nac, nombre, apellido, dni, tel, tel2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, cat, participante_feria, dni])
    } else {

      await pool.query('insert into personas set fecha_nac=?, nombre=?, apellido=?, dni=?, tel=?, tel2=?, mail=?,direccion=?,barrio=?,nivel_secundario=?,trabajo=?,tipo_trabajo=?,tipo_empleo=?,hijos=?,cantidad_hijos=?,participante_anterior=?,participante_feria=?  ', [fecha_nac, nombre, apellido, dni, tel, tel2, mail, direccion, barrio, nivel_secundario, trabajo, tipo_trabajo, tipo_empleo, hijos, cantidad_hijos, participante_anterior, participante_feria])
      pers = await pool.query('select * from personas where dni =?', [dni])
      cat = await caregorizar.asignarcategoria(pers)

      await pool.query('update personas set categoria=? where id=? ', [cat, pers[0]['id']])

    }
    pers = await pool.query('select * from personas where dni =?', [dni])
    const yainsc = await pool.query('select * from inscripciones where id_persona =? and edicion=6', [pers[0]['id']])
    let mensaje = ''
    if (yainsc.length > 0) {
      mensaje = 'Te informamos que ya estas inscripta!, ya has completado el formulario de esta edicion'
    }
    else {
      fecha = (new Date(Date.now()))
      cat = await caregorizar.asignarcategoria(pers)
      console.log(uno,dos)
      await pool.query('insert into inscripciones set uno=?,dos=?, fecha=?,dni_persona=?,emprendimiento=?,motivacion=?,id_persona=?,edicion=?', [uno, dos, fecha, dni, emprendimiento, motivacion, pers[0]['id'], 6])
      mensaje = 'Inscripcion realizada, te pedimos que aguardes contacto'
    }


    res.json(mensaje)

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio, verifica que hayas completado todos los campos')
  }




})

router.post("/cambiarestadocursado", async (req, res) => {
  const { estado, id_cursado } = req.body

  try {
   
    cursado = await pool.query('select * from cursado where id =?', [id_cursado])
    await pool.query('update inscripciones set estado="Inscripta" where id=? ', [cursado[0]['id_inscripcion']])
    await pool.query('delete  from  cursado  where id=? ', [ id_cursado])

    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }

})




router.post("/desinscribir", isLoggedInn2, async (req, res) => {
  const { id_cursado } = req.body
  try {
    cursado = await pool.query('select * from cursado where id=?', [id_cursado])
    await pool.query('update inscripciones set estado="pendiente" where id=? ', [cursado[0]['id_inscripcion']])


    await pool.query('delete  from  cursado where id = ?', [id_cursado])


    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }



})


router.post("/inscribir", isLoggedInn2, async (req, res) => {
  const { dni, id_inscripcion, id_turno } = req.body




  const persona = await pool.query('select * from personas where dni =?', [dni])
  const inscripciones = await pool.query('select * from inscripciones where id =?', [id_inscripcion])
  //////////////////////

  tur = await pool.query('select * from turnos where id =?', [id_turno])
  id_curso = tur[0]['id_curso']
  cat = await caregorizar.asignarcategoria(persona)

  ////////////
  try {




    ///queda id_inscripcion
    await pool.query('insert into cursado set inscripcion=?,id_persona=?,id_curso=?,categoria=?,id_inscripcion=?,id_turno=? ', ["Asignado a curso", persona[0]['id'], id_curso, cat, id_inscripcion, id_turno])

    await pool.query('update inscripciones set estado="Asignado a curso" where id=? ', [inscripciones[0]['id']])



    res.json('Realizado con exito ')

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


router.post("/modificarpersona", isLoggedInn4, async (req, res) => {
  const { id, nombre, apellido, mail, tel, tel2, direccion, adicional_direccion } = req.body
  try {
    console.log(id)
    act = {
      nombre, apellido, mail, tel, tel2, direccion, adicional_direccion
    }

    await pool.query('UPDATE personas set nombre=?,apellido=?,mail=?,tel=?,tel2=?,direccion=?,adicional_direccion=?  where id = ?  ', [nombre, apellido, mail, tel, tel2, direccion, adicional_direccion, id])
    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('realizado')
  }






})




router.post("/modificardatosadic", isLoggedInn4, async (req, res) => {
  const { anios, trabajo, hijos, usuario } = req.body
  try {
    const aux = await pool.query('select * from usuarios where usuario =?', [usuario])

    const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])

    act = { anios, trabajo, hijos }

    await pool.query('UPDATE personas set ?  where id = ?  ', [act, etc[0]['id']])
    res.json('Guardado con exito')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }
})






router.post("/asignarcoordinador", isLoggedInn4, async (req, res) => {
  const { id_coordinador, id } = req.body
  console.log(id_coordinador)
  console.log(id)
  try {


    await pool.query('update turnos set id_coordinador=? where id = ?', [id_coordinador, id])
    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})



router.post("/asignarencargado", isLoggedInn, async (req, res) => {
  const { id_encargado, id } = req.body
  console.log(id_encargado)
  console.log(id) // id turno
  try {




    await pool.query('update turnos set id_encargado=? where id = ?', [id_encargado, id])


    turno = await pool.query('select * from turnos where id = ?', [id])



    await pool.query('update cursado set inscripcion=? where id_turno = ?', ['Asignado a llamado', id])


    res.json('realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})



router.post("/asignarllamado", isLoggedInn, async (req, res) => {
  const { id_profesor, id_cursado, } = req.body
  console.log(id_profesor)
  console.log(id_cursado)

  act = {
    profesor: id_profesor,

  }

  await pool.query('update cursado set ? where id = ?', [act, id_cursado])

  curs = await pool.query('select * from cursado where id =?', [id_cursado])
  act = {
    estado: "Asignado a llamado"
  }
  await pool.query('update inscripciones set ? where id = ?', [act, curs[0]['id_inscripcion']])

  res.json('realizado')
})





router.post("/asignarllamadoatodas", isLoggedInn, async (req, res) => {
  const { id } = req.body
  console.log(id) //////id turno

  turno = await pool.query('select * from turnos where id = ?', [id])



  act = {
    inscripcion: "Asignado a llamado"
  }

  await pool.query('update cursado set ? where id_turno = ?', [act, id])

  /*  curs = await pool.query('select * from cursado where id =?',[id_cursado])
   act = {
     estado:"Asignado a llamado"
   } */
  //await pool.query('update inscripciones set ? where id = ?',[act,curs[0]['id_inscripcion']])

  res.json('realizado')
})






router.post("/crear", isLoggedInn, async (req, res) => {
  const { nombre, apellido, fecha_nac, trabajo, hijos, dni } = req.body
  try {

    etc = { nombre, apellido, fecha_nac, trabajo, hijos, dni }
    console.log(etc)
    await pool.query('insert personas  set nombre=?,apellido=?,fecha_nac=?,nombre=?,trabajo', [nombre, apellido, fecha_nac, trabajo, hijos, dni])
    console.log(1)
    res.json('Guardado con exito')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }
})












///////// CARGAR PERSONAS DEL EXCEL
router.get('/cargarpersonas111', async (req, res) => {

  const workbook = XLSX.readFile('./src/cargadepersonas/Muestreo.xlsx')
  const workbooksheets = workbook.SheetNames
  const sheet = workbooksheets[0]

  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(sheetData)


  let a = 1
  for (const property in sheetData) {
    a += 1
    aux = sheetData[property]['Número']
    existe = await pool.query('select * from personas where dni = ?', [aux])


    if (existe.length > 0) {
      console.log('Dni ya existe')
    } else {
      hijos = 0
      if (sheetData[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'] === '') {
        hijos = 0
      } else {
        hijos = sheetData[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?']
      }

      try {
      
        await pool.query('INSERT INTO personas set apellido=?,nombre=?,dni=?,usuario=?,direccion=?,barrio=?,residencia=?,tel=?,tel2=?,participante_anterior=?,nivel_secundario=?,hijos=?,como_se_entero=?', [sheetData[property]['Apellido'], sheetData[property]['Nombre'], sheetData[property]['D.N.I.'], 'No', sheetData[property]['Dirección calle'] + '-' + sheetData[property][' Altura'] + '-' + sheetData[property]['Piso y departamento (en caso que corresponda)'], sheetData[property]['Barrio'], sheetData[property]['Donde vivís'], sheetData[property]['Número de teléfono de contacto'], sheetData[property]['Número de teléfono alternativo'], sheetData[property]['¿Participaste de algún curso de la Escuela de Mujeres Emprendedoras anteriormente?  '], sheetData[property]['Nivel educativo alcanzado'], sheetData[property]['¿Cómo te enteraste de los cursos?']]);


        console.log('cargado')



      } catch (e) {
        console.log(e)
      }

      /* if ((sheetData[property]['Sucursal']).includes(cuil_cuit)) {
          estado = 'A'
      }*/

    }
  }
  console.log('finalizado')
})




router.get('/cargarcursos111', async (req, res) => {

  const workbook = XLSX.readFile('./src/cargadepersonas/Muestreo.xlsx')
  const workbooksheets = workbook.SheetNames
  const sheet = workbooksheets[0]

  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(sheetData)


  let a = 1
  for (const property in sheetData) {
    a += 1
    aux = sheetData[property]['Selecciona el primer curso de mayor preferencia (1)']
    existe = await pool.query('select * from cursos where nombre = ?', [aux])


    if (existe.length > 0) {
      console.log('Dni ya existe')
    } else {

      aux = sheetData[property]['Selecciona el primer curso de mayor preferencia (1)']
      existe = await pool.query('select * from cursos where nombre = ?', [aux])
      if (existe.length > 0) {
        console.log('Curso ya existe')
      } else {

        aux = sheetData[property]['Selecciona el primer curso de mayor preferencia (2)']
        existe = await pool.query('select * from cursos where nombre = ?', [aux])

        if (existe.length > 0) {
          console.log('Curso ya existe')
        } else {

          aux = sheetData[property]['Selecciona el primer curso de mayor preferencia (3)']
          existe = await pool.query('select * from cursos where nombre = ?', [aux])

          if (existe.length > 0) {
            console.log('Curso ya existe')
          } else {
            try {



              await pool.query('INSERT INTO cursos set nombre=?', [aux]);


              console.log('cargado')



            } catch (e) {
              console.log(e)
            }
          }
        }


      }
    }
  }
  console.log('finalizado')
})



///////////
router.get('/prueba/:dni', async (req, res) => {
  const dni = req.params.dni
  etc = await pool.query('select * from personas where dni=? ', [dni])
  cat = await caregorizar.asignarcategoria([etc[0]])
  res.send(cat)
})


///////////Guardar inscripciones

router.post('/subirprueba', fileUpload, async (req, res, done) => {
  const { formdata, file } = req.body

  try {


    const type = req.file.mimetype
    const name = req.file.originalname
    // const data = fs.readFileSync(path.join(__dirname, '../Excel' + req.file.filename))
    fech = (new Date(Date.now())).toLocaleDateString()



    await pool.query('insert into excelinscripciones set fecha=?, ruta=?', [fech, req.file.filename])
    res.send('Imagen guardada con exito')
  } catch (error) {
    console.log(error)
  }





})


///////// CARGAR INSCRIPCIONES




router.get('/cargarinscripciones', async (req, res) => {







  const workbook = XLSX.readFile('./src/cargadepersonas/Muestreo.xlsx')
  const workbooksheets = workbook.SheetNames
  const sheet = workbooksheets[0]

  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(sheetData)


  let a = 1
  for (const property in sheetData) {
    a += 1
    aux = sheetData[property]['Número']
    existe = await pool.query('select * from personas where dni = ?', [aux])


    expresion = sheetData[property]['Selecciona el primer curso de mayor preferencia (1)']
    switch (expresion) {
      case 'Bordado Mexicano':
        id_curso = 122
        break;
      case 'Organización de Eventos, nivel 2':
        id_curso = 123
        break;

      case 'Introducción al Maquillaje y Peinados para Eventos':
        id_curso = 124
        break;
      case 'Introducción a la elaboración de prendas textiles a partir de la reutilización de materiales (upcycling)':
        id_curso = 125
        break;
      case 'Introducción a la Instalación de Sistemas Operativos':
        id_curso = 126
        break;
      case 'Restauración de Muebles':

        id_curso = 127
        break;
      default:
        id_curso = 1
        break;
    }
    uno = id_curso


    expresion = sheetData[property]['Selecciona el primer curso de mayor preferencia (2)']
    switch (expresion) {
      case 'Bordado Mexicano':
        id_curso = 122
        break;
      case 'Organización de Eventos, nivel 2':
        id_curso = 123
        break;

      case 'Introducción al Maquillaje y Peinados para Eventos':
        id_curso = 124
        break;
      case 'Introducción a la elaboración de prendas textiles a partir de la reutilización de materiales (upcycling)':
        id_curso = 125
        break;
      case 'Introducción a la Instalación de Sistemas Operativos':
        id_curso = 126
        break;
      case 'Restauración de Muebles':

        id_curso = 127
        break;
      default:
        id_curso = 1
        break;
    }
    dos = id_curso



    expresion = sheetData[property]['Selecciona el primer curso de mayor preferencia (3)']
    switch (expresion) {
      case 'Bordado Mexicano':
        id_curso = 122
        break;
      case 'Organización de Eventos, nivel 2':
        id_curso = 123
        break;

      case 'Introducción al Maquillaje y Peinados para Eventos':
        id_curso = 124
        break;
      case 'Introducción a la elaboración de prendas textiles a partir de la reutilización de materiales (upcycling)':
        id_curso = 125
        break;
      case 'Introducción a la Instalación de Sistemas Operativos':
        id_curso = 126
        break;
      case 'Restauración de Muebles':

        id_curso = 127
        break;
      default:
        id_curso = 1
        break;
    }
    tres = id_curso


    try {
      const newLink = {
        motivacion: sheetData[property]['¿Por que elegiste tomar este curso?'],
        conexion_int: sheetData[property]['Posee alguno de los  siguientes dispositivos con conexión a internet:'],
        dni_persona: sheetData[property]['D.N.I.'],
        objetivo: sheetData[property]['¿Qué te gustaría  hacer con las habilidades aprendidas?'],
        horario: sheetData[property]['Disponibilidad Horaria para cursar'],
        horario2: sheetData[property]['Disponibilidad Horaria para cursar2'],
        estado: 'pendiente',

        uno,
        dos,
        tres


      }



      await pool.query('INSERT INTO inscripciones set ?', [newLink]);


      console.log('cargado')



    } catch (e) {
      console.log(e)
    }

    /* if ((sheetData[property]['Sucursal']).includes(cuil_cuit)) {
        estado = 'A'
    }*/


  }
  console.log('finalizado')
  res.send('finalizado')
})









///////cargar emprendimientos

router.get('/cargaremprendimientos1111', async (req, res) => {

  const workbook = XLSX.readFile('./src/cargadepersonas/Muestreo.xlsx')
  const workbooksheets = workbook.SheetNames
  const sheet = workbooksheets[0]

  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(sheetData)


  let a = 1
  for (const property in sheetData) {
    a += 1
    aux = sheetData[property]['¿Tenes un emprendimiento?']


    if (aux === 'Sí') {

      try {
        const newLink = {

          dni_persona: sheetData[property]['D.N.I.'],
          rubro: sheetData[property]['Rubro'],
          descripcion: sheetData[property]['Contamos brevemente de que se trata'],
          red_social: sheetData[property]['Dejannos las redes sociales de tu emprendimiento (si lo tiene)'],
          quiere_partic_esme: sheetData[property]['¿Te interesaría participar de una feria?'],


        }



        await pool.query('INSERT INTO emprendimientos_pers set ?', [newLink]);


        console.log('cargado')



      } catch (e) {
        console.log(e)
      }


    }







  }
  console.log('finalizado')
})




router.get('/cargartrabajos', async (req, res) => {

  const workbook = XLSX.readFile('./src/cargadepersonas/Muestreo.xlsx')
  const workbooksheets = workbook.SheetNames
  const sheet = workbooksheets[0]

  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(sheetData)


  let a = 1
  for (const property in sheetData) {
    a += 1
    dni = sheetData[property]['D.N.I.']

    trabaja = sheetData[property]['¿Actualmente estas trabajando?']
    console.log(trabaja)
    if (trabaja === 'Si') {


      const newLink = {

        trabajo: 'Si',
        tipo_trabajo: sheetData[property]['Si tu respuesta fue sí, contamos como es tu empleo:'],



      }


      await pool.query('UPDATE personas set ? where dni = ?', [newLink, dni]);



      console.log('cargado')





    } else {
      const newLink = {

        trabajo: 'No',
        tipo_trabajo: sheetData[property]['Si tu respuesta fue sí, contamos como es tu empleo:'],



      }

      await pool.query('UPDATE personas set ?  where dni = ?', [newLink, dni]);

    }







  }
  console.log('finalizado')
})




router.post('/subirexceltelefonos', upload.single('excel'), async (req, res) => {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Suponiendo que hay solo una hoja en el archivo

    // Obtener los datos de la hoja
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Procesar los datos
  /*   const sheetData = sheetData.map(row => ({
      nombre: row.Nombre,
      apellido: row.Apellido

     ));    // Agrega más campos según las columnas que necesites procesar
    } */



    ///////////////////////////////////////////////////////////////////
    for (property in sheetData) {
      // a += 1
        ///////

  
          ///actualizar
try {
  await pool.query('UPDATE personas set tel=? where dni = ?  ', [sheetData[property]['Número de teléfono de contacto '], sheetData[property]['D.N.I.']])
  console.log("sa")
} catch (error) {
  console.log(error)
}

 

    }


    // Devolver los datos procesados como respuesta
    res.json('realizado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el archivo Excel.');
  }
})


module.exports = router