const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2,isLoggedInn4 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const XLSX = require('xlsx')
const caregorizar = require('./funciones/caregorizar')
const multer = require('multer')
const path = require('path')
const fs = require('fs')


const diskstorage = multer.diskStorage({
  destination: path.join(__dirname, '../Excel'),
  filename: (req, file, cb) => {
      cb(null,  Date.now() + '-inscrip-' + file.originalname)

  }
}) //para que almacene temporalmente la imagen
const fileUpload = multer({
  storage: diskstorage,

}).single('image')





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


///// lista
router.get('/lista', async (req, res) => {
  const usuario = req.params.usuario

  const etc = await pool.query('select * from personas  ')
  listadef=[]
  for (ii in etc) {
 
    cat = await caregorizar.asignarcategoria([etc[ii]]) 



    nuevo = {
      id: etc[ii]['id'],
      nombre: etc[ii]['nombre'],
      id_persona: etc[ii]['id'],
      apellido:  etc[ii]['apellido'],
      dni: etc[ii]['dni'],
      categoria: cat,
      curso: etc[ii]['id'],
      id_turno: etc[ii]['id_turno'],
      /////////////////

    }
    listadef.push(nuevo)
  }
  

  res.json(listadef);
  //res.render('index')
})




///////////detalleusuarioparainscripcion
router.get('/datosusuarioporid/:dni',  async (req, res) => {
  const dni = req.params.dni


  const etc = await pool.query('select * from personas where dni =?', [dni])

  const curso1 = await pool.query('select cursos.nombre prioridaduno from inscripciones join cursos on inscripciones.uno =cursos.id where inscripciones.dni_persona =?', [dni])
  const curso2 = await pool.query('select cursos.nombre prioridaddos from inscripciones join cursos on inscripciones.dos =cursos.id where inscripciones.dni_persona =?', [dni])
  console.log(dni)
let cursado = await pool.query('select cursos.nombre from cursado  join cursos on cursado.id_curso = cursos.id where cursado.id_persona=?',[etc[0]['id']])

  if (cursado.length === 0){
    cursado=[{anotado:null}]
  }



  try {
    nombre= etc[0]['apellido'] + etc[0]['nombre']
  } catch (error) {
    nombre= 'no determinado'
  }

  try {
    prioridad1= curso1[0]['prioridaduno']
  } catch (error) {
    prioridad1='no determinado'
  }
  try {
    prioridad2= curso2[0]['prioridaddos']
  } catch (error) {
    prioridad2='no determinado'
  }
  try {
    anotado= cursado[0]['nombre']
  } catch (error) {
    anotado='no determinado'
  }
  try {
    hijos= etc[0]['hijos']
  } catch (error) {
    hijos='no determinado'
  }
  try {
    trabajo= etc[0]['trabajo']
  } catch (error) {
    trabajo='no determinado'
  }
  try {
    tipo_trabajo=  etc[0]['tipo_trabajo']
  } catch (error) {
    tipo_trabajo='no determinado'
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

  criterios= await pool.query(' select * from criterios ' )
  porcentaje=criterios[criterios.length-1][cat]


  res.json([ficha, porcentaje,cat]);




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





router.post("/cambiarestadocursado",  async (req, res) => {
  const { estado, id_cursado } = req.body

  try {
    await pool.query('update cursado set inscripcion=? where id=? ', [estado,id_cursado])
    cursado = await pool.query('select * from cursado where id =?',[id_cursado])
    await pool.query('update inscipciones set estado=? where id=? ', [estado,cursado[0]['id_inscripcion']])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }

})



router.post("/desinscribir", isLoggedInn2, async (req, res) => {
  const { id_cursado} = req.body
try {
  cursado = await pool.query('select * from cursado where id=?',[id_cursado])  
await pool.query('update inscripciones set estado="pendiente" where id=? ', [cursado[0]['id_inscripcion']])


  await pool.query('delete  from  cursado where id = ?',[id_cursado])


  res.json('Realizado')
} catch (error) {
  console.log(error)
  res.json('Error algo sucedio')
}



})


router.post("/inscribir", isLoggedInn2, async (req, res) => {
  const { id_curso, dni,   id_inscripcion, id_turno} = req.body
 



  const persona = await pool.query('select * from personas where dni =?', [dni])
  const inscripciones = await pool.query('select * from inscripciones where id =?', [id_inscripcion])
  //////////////////////
  
  cat = await caregorizar.asignarcategoria(persona)

  ////////////
  try {
   
  

    
///queda id_inscripcion
    await pool.query('insert into cursado set inscripcion=?,id_persona=?,id_curso=?,categoria=?,id_inscripcion=?,id_turno=? ', ["Asignado a curso", persona[0]['id'], id_curso, cat,id_inscripcion, id_turno])

    await pool.query('update inscripciones set estado="Asignado a curso" where id=? ', [inscripciones[0]['id']])

   

    res.json('Realizado con exito ')

  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})


router.post("/modificarpersona", isLoggedInn4, async (req, res) => {
  const {id, nombre, apellido, mail,tel, tel2, direccion, adicional_direccion} = req.body
try {
  console.log(id)
  act ={
    nombre, apellido, mail,tel, tel2, direccion, adicional_direccion
  }

  await pool.query('UPDATE personas set nombre=?,apellido=?,mail=?,tel=?,tel2=?,direccion=?,adicional_direccion=?  where id = ?  ', [ nombre, apellido, mail,tel, tel2, direccion, adicional_direccion, id])
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
  const  { id_coordinador, id }= req.body
  console.log(id_coordinador)
  console.log(id)
try {
  

await pool.query('update turnos set id_coordinador=? where id = ?',[id_coordinador,id])
res.json('realizado')
} catch (error) {
  console.log(error)
  res.json('Error algo sucedio')
}


})



router.post("/asignarencargado", isLoggedInn, async (req, res) => {
  const  { id_encargado, id }= req.body
  console.log(id_encargado)
  console.log(id) // id turno
try {
 
  


await pool.query('update turnos set id_encargado=? where id = ?',[id_encargado,id])


turno = await pool.query('select * from turnos where id = ?',[id])
  


await pool.query('update cursado set inscripcion=? where id_turno = ?',['Asignado a llamado',id])


res.json('realizado')
} catch (error) {
  console.log(error)
  res.json('Error algo sucedio')
}


})



router.post("/asignarllamado", isLoggedInn, async (req, res) => {
const  { id_profesor, id_cursado,}= req.body
console.log(id_profesor)
console.log(id_cursado)

  act = {profesor:id_profesor,
        
  }

await pool.query('update cursado set ? where id = ?',[act,id_cursado])

curs = await pool.query('select * from cursado where id =?',[id_cursado])
act = {
  estado:"Asignado a llamado"
}
await pool.query('update inscripciones set ? where id = ?',[act,curs[0]['id_inscripcion']])

res.json('realizado')
})





router.post("/asignarllamadoatodas", isLoggedInn, async (req, res) => {
  const  { id  }= req.body
  console.log(id) //////id turno

  turno = await pool.query('select * from turnos where id = ?',[id])
  


    act = {
          inscripcion:"Asignado a llamado"
    }
  
  await pool.query('update cursado set ? where id_turno = ?',[act,id])
  
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
    await pool.query('insert personas  set nombre=?,apellido=?,fecha_nac=?,nombre=?,trabajo', [nombre,apellido,fecha_nac,trabajo,hijos,dni])
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

          tel2: dataExcel[property]['Número de teléfono alternativo'],

          participante_anterior: dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres? '],
          nivel_secundario: dataExcel[property]['Nivel educativo alcanzado'],

          hijos: hijos,
          como_se_entero: dataExcel[property]['¿Cómo te enteraste de los cursos?'],
        }

        await pool.query('INSERT INTO personas set apellido=?,nombre=?,dni=?,usuario=?,direccion=?,barrio=?,residencia=?,tel=?,tel2=?,participante_anterior=?,nivel_secundario=?,hijos=?,como_se_entero=?', [dataExcel[property]['Apellido'], dataExcel[property]['Nombre'],dataExcel[property]['D.N.I.'],'No',dataExcel[property]['Dirección calle'] + '-' + dataExcel[property][' Altura'] + '-' + dataExcel[property]['Piso y departamento (en caso que corresponda)'],dataExcel[property]['Barrio'],dataExcel[property]['Donde vivís'],dataExcel[property]['Número de teléfono de contacto'], dataExcel[property]['Número de teléfono alternativo'],dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres? '],dataExcel[property]['Nivel educativo alcanzado'],dataExcel[property]['¿Cómo te enteraste de los cursos?']]);


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
router.get('/prueba', async (req, res) => {
  res.send('hola mundo')
})


///////////Guardar inscripciones

router.post('/subirprueba', fileUpload, async (req, res, done) => {
  const {formdata, file} = req.body

try {
  

  const type = req.file.mimetype
  const name = req.file.originalname
 // const data = fs.readFileSync(path.join(__dirname, '../Excel' + req.file.filename))
  fech = (new Date(Date.now())).toLocaleDateString()
 

  
  await pool.query('insert into excelinscripciones set fecha=?, ruta=?', [fech,req.file.filename])
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
         horario2: dataExcel[property]['Disponibilidad Horaria para cursar2'],
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

          dni_persona: dataExcel[property]['D.N.I.'],
          rubro: dataExcel[property]['Rubro'],
          descripcion: dataExcel[property]['Contamos brevemente de que se trata'],
          red_social: dataExcel[property]['Dejannos las redes sociales de tu emprendimiento (si lo tiene)'],
          quiere_partic_esme: dataExcel[property]['¿Te interesaría participar de una feria?'],


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

  const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
  //console.log(dataExcel)


  let a = 1
  for (const property in dataExcel) {
    a += 1
    dni = dataExcel[property]['D.N.I.']

    trabaja = dataExcel[property]['Actualmente, ¿se encuentra trabajando?']
    console.log(trabaja)
    if (trabaja === 'Si') {


      const newLink = {

        trabajo: 'Si',
        tipo_trabajo: dataExcel[property]['¿Qué tipo de empleo posee?'],



      }


      await pool.query('UPDATE personas set ? where dni = ?', [newLink, dni]);



      console.log('cargado')





    } else {
      const newLink = {

        trabajo: 'No',
        tipo_trabajo: dataExcel[property]['¿Qué tipo de empleo posee?'],



      }

      await pool.query('UPDATE personas set ?  where dni = ?', [newLink, dni]);

    }







  }
  console.log('finalizado')
})




module.exports = router