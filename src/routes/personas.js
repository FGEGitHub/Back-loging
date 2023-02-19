const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const XLSX = require('xlsx')




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



    res.json([aux]);

  } catch (error) {
    console.log(error)
    res.json(['']);
  }
  //res.render('index')
})
router.get('/lista', async (req, res) => {
  const usuario = req.params.usuario

  const etc = await pool.query('select * from personas')

  res.json(etc);
  //res.render('index')
})

router.get('/datosusuarioporid/:id', isLoggedInn2, async (req, res) => {
  const id = req.params.id
  console.log(id)
  const aux = await pool.query('select * from usuarios where id =?', [id])

  const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])

  porcentaje = 100
  console.log(etc[0]['trabajo'])
  if (etc[0]['trabajo'] == 'Si') {

    porcentaje -= 33
  }
  if (etc[0]['hijos'] == 'Si') {
    porcentaje -= 33
  }
  anios = parseInt(etc[0]['anios'])

  if (anios > 35) {
    console.log(anios)
    porcentaje -= 33
  }
  console.log(porcentaje)
  res.json([etc, porcentaje]);
  //res.render('index')
})








router.post("/inscribir", isLoggedInn2, async (req, res) => {
  const { id_curso, id_usuario, accion } = req.body
  console.log(id_usuario + '   ' + accion)

  const aux = await pool.query('select * from usuarios where id =?', [id_usuario])

  const etc = await pool.query('select * from personas where id =?', [aux[0]['id_persona']])


  try {
    let act = {
      inscripcion: 'Pendiente'
    }


    if (accion == 'Aceptar') {
      console.log('opcion aceptar ')
      act = {
        inscripcion: 'Cursando'
      }
    }

    if (accion == 'Rechazar') {
      act = {
        inscripcion: 'Rechazado'
      }
    }


    await pool.query('UPDATE cursado set ? WHERE id_curso = ? and id_persona = ?  ', [act, id_curso, etc[0]['id']])
    res.json('Realizado con exito ')

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


router.post("/modificardatosadic", isLoggedInn, async (req, res) => {
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




router.post("/crear", isLoggedInn, async (req, res) => {
  const { nombre, apellido, fecha_nac, trabajo, hijos, dni } = req.body
  try {

    etc = { nombre, apellido, fecha_nac, trabajo, hijos, dni }
    console.log(etc)
    await pool.query('insert personas  set ?', [etc])
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

  const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(dataExcel)


  let a = 1
  for (const property in dataExcel) {
    a += 1
    aux = dataExcel[property]['Número']
    existe = await pool.query('select * from personas where dni = ?', [aux])


    if (existe.length > 0) {
      console.log('Dni ya existe')
    } else {
      hijos = 0
      if (dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'] === '') {
        hijos = 0
      } else {
        hijos = dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?']
      }

      try {
        const newLink = {
          apellido: dataExcel[property]['Apellido'],
          nombre: dataExcel[property]['Nombre'],
          dni: dataExcel[property]['D.N.I.'],

          usuario: 'No',
          direccion: dataExcel[property]['Dirección calle'] + '-' + dataExcel[property][' Altura'] + '-' + dataExcel[property]['Piso y departamento (en caso que corresponda)'],
          barrio: dataExcel[property]['Barrio'],
          residencia: dataExcel[property]['Donde vivís'],
          tel: dataExcel[property]['Número de teléfono de contacto'],

          tel2: dataExcel[property]['tel2'],

          participante_anterior: dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres? '],
          nivel_secundario: dataExcel[property]['Nivel educativo alcanzado'],

          hijos: hijos,
          como_se_entero: dataExcel[property]['¿Cómo te enteraste de los cursos?'],


        }



        await pool.query('INSERT INTO personas set ?', [newLink]);


        console.log('cargado')



      } catch (e) {
        console.log(e)
      }

      /* if ((dataExcel[property]['Sucursal']).includes(cuil_cuit)) {
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

  const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(dataExcel)


  let a = 1
  for (const property in dataExcel) {
    a += 1
    aux = dataExcel[property]['Selecciona el primer curso de mayor preferencia (1)']
    existe = await pool.query('select * from cursos where nombre = ?', [aux])


    if (existe.length > 0) {
      console.log('Dni ya existe')
    } else {

      aux = dataExcel[property]['Selecciona el primer curso de mayor preferencia (1)']
      existe = await pool.query('select * from cursos where nombre = ?', [aux])
      if (existe.length > 0) {
        console.log('Curso ya existe')
      } else {

        aux = dataExcel[property]['Selecciona el primer curso de mayor preferencia (2)']
        existe = await pool.query('select * from cursos where nombre = ?', [aux])

        if (existe.length > 0) {
          console.log('Curso ya existe')
        } else {

          aux = dataExcel[property]['Selecciona el primer curso de mayor preferencia (3)']
          existe = await pool.query('select * from cursos where nombre = ?', [aux])

          if (existe.length > 0) {
            console.log('Curso ya existe')
          } else {
            try {
              const newLink = {

                nombre: aux,


              }



              await pool.query('INSERT INTO cursos set ?', [newLink]);


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


///////// CARGAR INSCRIPCIONES
router.get('/cargarinscripciones0000', async (req, res) => {

  const workbook = XLSX.readFile('./src/cargadepersonas/Muestreo.xlsx')
  const workbooksheets = workbook.SheetNames
  const sheet = workbooksheets[0]

  const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(dataExcel)


  let a = 1
  for (const property in dataExcel) {
    a += 1
    aux = dataExcel[property]['Número']
    existe = await pool.query('select * from personas where dni = ?', [aux])


    expresion = dataExcel[property]['Selecciona el primer curso de mayor preferencia (1)']
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


    expresion = dataExcel[property]['Selecciona el primer curso de mayor preferencia (2)']
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



    expresion = dataExcel[property]['Selecciona el primer curso de mayor preferencia (3)']
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
        motivacion: dataExcel[property]['¿Por que elegiste tomar este curso?'],
        conexion_int: dataExcel[property]['Posee alguno de los  siguientes dispositivos con conexión a internet:'],
        dni_persona: dataExcel[property]['D.N.I.'],
        objetivo: dataExcel[property]['¿Qué te gustaría  hacer con las habilidades aprendidas?'],
        horario: dataExcel[property]['Disponibilidad Horaria para cursar'],
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

    /* if ((dataExcel[property]['Sucursal']).includes(cuil_cuit)) {
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

  const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(dataExcel)


  let a = 1
  for (const property in dataExcel) {
    a += 1
    aux = dataExcel[property]['¿Tenes un emprendimiento?']


    if (aux === 'Sí') {

      try {
        const newLink = {

          dni_persona : dataExcel[property]['D.N.I.'],
          rubro : dataExcel[property]['Rubro'],
          descripcion : dataExcel[property]['Contamos brevemente de que se trata'],
          red_social : dataExcel[property]['Dejannos las redes sociales de tu emprendimiento (si lo tiene)'],
          quiere_partic_esme : dataExcel[property]['¿Te interesaría participar de una feria?'],


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





module.exports = router