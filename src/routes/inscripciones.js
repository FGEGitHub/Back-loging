import express from "express";
const router = express.Router();

import {
  isLoggedIn,
  isLoggedInn,
  isLoggedInn2
} from "../lib/auth.js";

import pool from "../database.js";

//import caregorizar from "./funciones/caregorizar.js";
import { asignarcategoria } from "./funciones/caregorizar.js";

import { cantidadcategoriaporcurso } from "./funciones/cantidadocupado..js";
import XLSX from "xlsx";
import path from "path";


////////////




/////////////////////


router.get('/todaslasinscripciones', async (req, res,) => {
  cuil_cuit = req.params.cuil_cuit

  try {
    estr = await pool.query('select * from excelinscripciones ')
    console.log(estr)
    res.json(estr)
  } catch (error) {
    res.send('algo salio mal')
  }


})

router.post('/incripcionesid', async (req, res) => {
  const { id } = req.body

  const estract = await pool.query('select * from excelinscripciones where id = ? ', [id])
  const nombree = estract[0]['ruta']


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







          nombre = dataExcel[property]['Nombre']
          apellido = dataExcel[property]['Apellido']
          dni = dataExcel[property]['D.N.I.']
          eleccion1 = dataExcel[property]['Selecciona el primer curso de mayor preferencia (1)']
          eleccion2 = dataExcel[property]['Selecciona el primer curso de mayor preferencia (2)']
          nuevo = {
            nombre,

            apellido,
            dni,
            eleccion1,
            eleccion2

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














router.post('/cargarinscripciones', async (req, res) => {
  const { id } = req.body
  console.log(id)
  const estract = await pool.query('select * from excelinscripciones where id = ? ', [id])
  console.log(estract)
  const nombree = estract[0]['ruta']
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




    cursoss = await pool.query('select * from cursos')
    curso1 = cursoss[0]['nombre']
    curso2 = cursoss[1]['nombre']
    curso3 = cursoss[2]['nombre']
    curso4 = cursoss[3]['nombre']
    let a = 1
    for (const property in dataExcel) {
      a += 1
      aux = dataExcel[property]['D.N.I.']
      existe = await pool.query('select * from personas where dni = ?', [aux])
      try {
        ///////
        if (existe.length > 0) {



          ///actualizar
          nuevo = {
            residencia: dataExcel[property]['Donde vivís'],   //// ncampo residencia 
            direccion: dataExcel[property]['Dirección calle'] + ' ' + dataExcel[property]['Altura'],
            adicional_direccion: dataExcel[property]['Grupo de viviendas (en caso que corresponda)'] + ' - ' + dataExcel[property]['Piso y departamento (en caso que corresponda)'],
            barrio: dataExcel[property]['Barrio'],
            fecha_nac: dataExcel[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)'],
            tel: dataExcel[property]['Número de teléfono de contacto'],
            tel2: dataExcel[property]['Número de teléfono alternativo'],
            participante_anterior: dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres?'],
            nivel_secundario: dataExcel[property]['Nivel educativo alcanzado'],
            trabajo: dataExcel[property]['Actualmente, ¿se encuentra trabajando?'],
            tipo_trabajo: dataExcel[property]['¿Qué tipo de empleo posee?'],
            hijos: dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'],

          }
          if (dataExcel[property]['Nombre'] === undefined) {
            nombre = 'No'
          } else {
            nombre = dataExcel[property]['Nombre']

          }
          if (dataExcel[property]['Apellido'] === undefined) {
            apellido = 'No'
          } else {
            apellido = dataExcel[property]['Apellido']
          }
          if (dataExcel[property]['D.N.I.'] === undefined) {
            dni = 'No'
          } else {
            dni = dataExcel[property]['D.N.I.']
          }
          if (dataExcel[property]['Donde vivís'] === undefined) {
            residencia = 'No'
          } else {
            residencia = dataExcel[property]['Donde vivís']
          }
          if (dataExcel[property]['Barrio'] === undefined) {
            barrio = 'No'
          } else {
            barrio = dataExcel[property]['Barrio']
          }
          if (dataExcel[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)'] === undefined) {
            fecha_nac = 'No'
          } else {
            fecha_nac = dataExcel[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)']
          }
          if (dataExcel[property]['Número de teléfono de contacto'] === undefined) {
            tel = 'No'
          } else {
            tel = dataExcel[property]['Número de teléfono de contacto']
          }
          if (dataExcel[property]['Número de teléfono alternativo'] === undefined) {
            tel2 = 'No'
          } else {
            tel2 = dataExcel[property]['Número de teléfono alternativo']
          }
          if (dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres?'] === undefined) {
            participante_anterior = 'No'
          } else {
            participante_anterior = dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres?']
          }
          if (dataExcel[property]['Nivel educativo alcanzado'] === undefined) {
            nivel_secundario = 'No'
          } else {
            nivel_secundario = dataExcel[property]['Nivel educativo alcanzado']
          }
          if (dataExcel[property]['Actualmente, ¿se encuentra trabajando?'] === undefined) {
            trabajo = 'No'
          } else {
            trabajo = dataExcel[property]['Actualmente, ¿se encuentra trabajando?']
          }
          if (dataExcel[property]['¿Qué tipo de empleo posee?'] === undefined) {
            tipo_trabajo = 'No'
          } else {
            tipo_trabajo = dataExcel[property]['¿Qué tipo de empleo posee?']
          }
          if (dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'] === undefined) {
            hijos = 'No'
          } else {
            hijos = dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?']
          }
          await pool.query('update personas set residencia=?,direccion =?,adicional_direccion=?,barrio=?,fecha_nac=?, tel=?, tel2=?,participante_anterior=?,nivel_secundario=?,trabajo=?,tipo_trabajo=?,hijos=? where dni = ?', [residencia, dataExcel[property]['Dirección calle'] + ' ' + dataExcel[property]['Altura'], dataExcel[property]['Grupo de viviendas (en caso que corresponda)'] + ' - ' + dataExcel[property]['Piso y departamento (en caso que corresponda)'], barrio, fecha_nac, tel, tel2, participante_anterior, nivel_secundario, trabajo, tipo_trabajo, hijos, aux])


        } else {
          ///crear nueva persona 
          nuevo = {
            nombre: dataExcel[property]['Nombre'],
            apellido: dataExcel[property]['Apellido'],
            dni: dataExcel[property]['D.N.I.'],
            residencia: dataExcel[property]['Donde vivís'],   //// ncampo residencia 
            direccion: dataExcel[property]['Dirección calle'] + ' ' + dataExcel[property]['Altura'],
            adicional_direccion: dataExcel[property]['Grupo de viviendas (en caso que corresponda)'] + ' - ' + dataExcel[property]['Piso y departamento (en caso que corresponda)'],
            barrio: dataExcel[property]['Barrio'],
            fecha_nac: dataExcel[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)'],
            tel: dataExcel[property]['Número de teléfono de contacto'],
            tel2: dataExcel[property]['Número de teléfono alternativo'],
            participante_anterior: dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres?'],
            nivel_secundario: dataExcel[property]['Nivel educativo alcanzado'],
            trabajo: dataExcel[property]['Actualmente, ¿se encuentra trabajando?'],
            tipo_trabajo: dataExcel[property]['¿Qué tipo de empleo posee?'],
            hijos: dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'],

          }
          if (dataExcel[property]['Nombre'] === undefined) {
            nombre = 'No'
          } else {
            nombre = dataExcel[property]['Nombre']

          }
          if (dataExcel[property]['Apellido'] === undefined) {
            apellido = 'No'
          } else {
            apellido = dataExcel[property]['Apellido']
          }
          if (dataExcel[property]['D.N.I.'] === undefined) {
            dni = 'No'
          } else {
            dni = dataExcel[property]['D.N.I.']
          }
          if (dataExcel[property]['Donde vivís'] === undefined) {
            residencia = 'No'
          } else {
            residencia = dataExcel[property]['Donde vivís']
          }
          if (dataExcel[property]['Barrio'] === undefined) {
            barrio = 'No'
          } else {
            barrio = dataExcel[property]['Barrio']
          }
          if (dataExcel[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)'] === undefined) {
            fecha_nac = 'No'
          } else {
            fecha_nac = dataExcel[property]['Fecha de nacimiento (indicar mes, dia y año. Ejempo 08/11/1987 11 de agosto de 1987)']
          }
          if (dataExcel[property]['Número de teléfono de contacto'] === undefined) {
            tel = 'No'
          } else {
            tel = dataExcel[property]['Número de teléfono de contacto']
          }
          if (dataExcel[property]['Número de teléfono alternativo'] === undefined) {
            tel2 = 'No'
          } else {
            tel2 = dataExcel[property]['Número de teléfono alternativo']
          }
          if (dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres?'] === undefined) {
            participante_anterior = 'No'
          } else {
            participante_anterior = dataExcel[property]['¿Participaste de algún curso de la escuela de Mujeres?']
          }
          if (dataExcel[property]['Nivel educativo alcanzado'] === undefined) {
            nivel_secundario = 'No'
          } else {
            nivel_secundario = dataExcel[property]['Nivel educativo alcanzado']
          }
          if (dataExcel[property]['Actualmente, ¿se encuentra trabajando?'] === undefined) {
            trabajo = 'No'
          } else {
            trabajo = dataExcel[property]['Actualmente, ¿se encuentra trabajando?']
          }
          if (dataExcel[property]['¿Qué tipo de empleo posee?'] === undefined) {
            tipo_trabajo = 'No'
          } else {
            tipo_trabajo = dataExcel[property]['¿Qué tipo de empleo posee?']
          }
          if (dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?'] === undefined) {
            hijos = 'No'
          } else {
            hijos = dataExcel[property]['En caso de haber respondido Si a la pregunta anterior, ¿Cuántos hijos tiene?']
          }


          await pool.query('INSERT INTO personas set nombre=?,apellido=?,dni=?,residencia=?,direccion=?,adicional_direccion=?,barrio=?,fecha_nac=?,tel=?, tel2=?,participante_anterior=?, nivel_secundario=?, trabajo=?,tipo_trabajo=?,hijos=?', [nombre, apellido, dni, residencia, dataExcel[property]['Dirección calle'] + dataExcel[property]['Altura'], dataExcel[property]['Grupo de viviendas (en caso que corresponda)'] + ' - ' + dataExcel[property]['Piso y departamento (en caso que corresponda)'], barrio, fecha_nac, tel, tel2, participante_anterior, nivel_secundario, trabajo, tipo_trabajo, hijos]);
        }
        /////////¿Actualmente  se encuentra estudiando? actividad adicional
        /////////////Tipo de empleo



      }
      //////
      catch (error) {
        console.log(error)
      }

      expresion = dataExcel[property]['Selecciona el primer curso de mayor preferencia (1)']
      switch (expresion) {
        case cursoss[0]['nombre']:
          id_curso = cursoss[0]['id']
          break;
        case cursoss[1]['nombre']:
          id_curso = cursoss[1]['id']
          break;

        case cursoss[2]['nombre']:
          id_curso = cursoss[2]['id']
          break;
        case cursoss[3]['nombre']:
          id_curso = cursoss[3]['id']
          break;

        default:
          id_curso = 1
          break;
      }
      uno = id_curso


      expresion = dataExcel[property]['Selecciona el primer curso de mayor preferencia (2)']
      switch (expresion) {
        case cursoss[0]['nombre']:
          id_curso = cursoss[0]['id']
          break;
        case cursoss[1]['nombre']:
          id_curso = cursoss[1]['id']
          break;

        case cursoss[2]['nombre']:
          id_curso = cursoss[2]['id']
          break;
        case cursoss[3]['nombre']:
          id_curso = cursoss[3]['id']
          break;
        case cursoss[3]['nombre']:
          id_curso = cursoss[3]['id']
          break;
        default:
          id_curso = 1
          break;
      }
      dos = id_curso


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



        }
        if (dataExcel[property]['¿Por que elegiste tomar este curso?'] === undefined) {
          motivacion = 'Sin completar'
        } else {
          motivacion = dataExcel[property]['¿Por que elegiste tomar este curso?']
        }
        if (dataExcel[property]['Posee alguno de los  siguientes dispositivos con conexión a internet:'] === undefined) {
          conexion_int = 'Sin completar'
        } else {
          conexion_int = dataExcel[property]['Posee alguno de los  siguientes dispositivos con conexión a internet:']
        }
        if (dataExcel[property]['D.N.I.'] === undefined) {
          dni_persona = 'Sin completar'
        } else {
          dni_persona = dataExcel[property]['D.N.I.']
        }
        if (dataExcel[property]['¿Qué te gustaría hacer con las habilidades aprendidas?'] === undefined) {
          objetivo = 'Sin completar'
        } else {
          objetivo = dataExcel[property]['¿Qué te gustaría hacer con las habilidades aprendidas?']
        }
        if (dataExcel[property]['Disponibilidad Horaria para cursar '] === undefined) {
          horario = 'Sin completar'
        } else {
          horario = dataExcel[property]['Disponibilidad Horaria para cursar ']
        }



        await pool.query('INSERT INTO inscripciones set motivacion=?,conexion_int=?,dni_persona=?,objetivo=?,horario=?, estado="pendiente",uno=?,dos=?', [motivacion, conexion_int, dni_persona, objetivo, horario, uno, dos]);


        console.log('cargado')



      } catch (e) {
        console.log(e)
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

router.post('/modificarestadodeinscrip', async (req, res) => {
  const { id, estado } = req.body
  try {
    await pool.query('update inscripciones set  estado=? where  id = ?', [estado, id])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('No Realizado')
  }

})

router.post('/cargarexcelpersonas', async (req, res) => {
  const { id } = req.body
  console.log(id)
  const estract = await pool.query('select * from excelinscripciones where id = ? ', [id])

  const nombree = estract[0]['ruta']


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





    let a = 1
    for (const property in dataExcel) {
      a += 1
      aux = dataExcel[property]['DNI']
      existe = await pool.query('select * from personas where dni = ?', [aux])
      try {
        ///////
        if (dataExcel[property]['Nombre'] === undefined) {
          nombre = 'No'
        } else {
          nombre = dataExcel[property]['Nombre']

        }
        if (dataExcel[property]['Apellido'] === undefined) {
          apellido = 'No'
        } else {
          apellido = dataExcel[property]['Apellido']
        }

        if (dataExcel[property]['barrio_id'] === undefined) {
          barrio = 'No'
        } else {
          barrio = dataExcel[property]['barrio_id']
        }

        if (dataExcel[property]['telefono'] === undefined) {
          tel = 'No'
        } else {
          tel = dataExcel[property]['telefono']
        }

        if (dataExcel[property]['nivelestudio_id'] === undefined) {
          nivel_secundario = 'Sin determinar'
        } else {
          nivel_secundario = dataExcel[property]['nivelestudio_id']
        }
        if (dataExcel[property]['empleo'] === undefined) {
          trabajo = 'Sin determinar'
        } else {
          trabajo = dataExcel[property]['empleo']
        }
        if (dataExcel[property]['empleotipo_id'] === undefined) {
          tipo_trabajo = 'Sin determinar'
        } else {
          tipo_trabajo = dataExcel[property]['empleotipo_id']
        }
        if (dataExcel[property]['correo'] === undefined) {
          mail = 'Sin determinar'
        } else {
          mail = dataExcel[property]['correo']
        }
        if (dataExcel[property]['domicilio'] === undefined) {
          direccion = 'Sin determinar'
        } else {
          direccion = dataExcel[property]['domicilio']
        }
        if (existe.length > 0) {

          console.log('viejo')

          await pool.query('update personas set  tel=?,mail=? where dni = ?', [tel, mail, aux])
          console.log('viejo guardado')

        } else {
          ///crear nueva persona 
          console.log('nuevo')


          await pool.query('INSERT INTO personas set direccion=?, nombre=?,apellido=?,dni=?,barrio=?,tel=?, nivel_secundario=?, trabajo=?,tipo_trabajo=?,mail=?', [direccion, nombre, apellido, aux, barrio, tel, nivel_secundario, trabajo, tipo_trabajo, mail]);
          console.log('nuevo guardado')
        }

        /////////¿Actualmente  se encuentra estudiando? actividad adicional
        /////////////Tipo de empleo



      }
      //////
      catch (error) {
        console.log(error)
      }




    }
    res.json(mandar)
  } catch (error) {
    console.log(error)
    res.send(error)

  }




})









router.get('/traerinscripcionesenc/', async (req, res) => {
  const id = req.params.id


  const etc = await pool.query('select * from turnos where  (id_call is null or id_call= 0) and etapa=6  ')
  console.log(etc)

  res.json(etc);




})

router.get('/preinscriptascall/:id', async (req, res) => {
  const id = req.params.id

  try {

   // inscriptos = await pool.query('select * from inscripciones join (select dni, nombre, apellido,categoria, participante_anterior, trabajo, hijos, tipo_trabajo,tel,tel2 from personas) as sel on inscripciones.dni_persona=sel.dni join (select id as id1, nombre as nombrecurso1 from cursos) as sel2 on inscripciones.uno=sel2.id1 join (select id as id2, nombre as nombrecurso2 from cursos) as sel3 on inscripciones.dos=sel3.id2 left join (select id_inscripcion , id_turno  from cursado) as sel8 on inscripciones.id=sel8.id_inscripcion left join (select id as idt, descripcion, id_curso from turnos) as sel9 on sel8.id_turno=sel9.idt left join(select id as idc, nombre as nombrecurso from cursos) as sel10 on sel9.id_curso=sel10.idc where id_call=? ', [id])
    inscriptos = await pool.query("select * from turnos join (select id_turno, id_inscripcion from cursado) as sel on turnos.id=sel.id_turno join (select id as idi, id_persona as idp, estado from inscripciones) as sel2 on sel.id_inscripcion=sel2.idi join(select id as idpp,dni, nombre, apellido,categoria, participante_anterior, trabajo, hijos, tipo_trabajo,tel,tel2 from personas) as sel3 on sel2.idp=sel3.idpp  where id_call =?",[id])
    res.json([inscriptos])

  } catch (error) {
console.log(error)
    res.json(["error"])
  }
})

router.get('/preinscriptas/', async (req, res) => {

  try {

   const inscriptos = await pool.query('select * from inscripciones join (select dni, nombre, apellido,categoria, participante_anterior, trabajo, hijos, tipo_trabajo,tel,tel2 from personas) as sel on inscripciones.dni_persona=sel.dni join (select id_inscripcion, id_turno from cursado) as sel2 on inscripciones.id=sel2.id_inscripcion  join (select id as idc, descripcion from turnos) as sel5 on sel2.id_turno=sel5.idc left join (select id as idu, nombre as nombrecall from usuarios) as sel4 on inscripciones.id_call=sel4.idu where edicion=3 and estado="Preasignada"')


    res.json([inscriptos])

  } catch (error) {
    console.log(error)
    res.json([[11]])
  }
})

router.post("/asignarinscripciones", async (req, res) => {
  let { id, inscrip } = req.body


  for (ins in inscrip) {



    await pool.query('update turnos set id_call =?  where  id = ?', [id, inscrip[ins]])
  }
  res.json('realizado')

})

////
router.post('/asignarencargado', async (req, res) => {
  const { id_inscripcion, id_encargado } = req.body

  try {
    await pool.query('update inscripciones set encargado=? where  id = ?', [id_encargado, id_inscripcion])
    res.json('asignado')

  } catch (error) {
    res.json('error')
  }
})

router.get('/incriptas2da/', async (req, res) => {
/* 
  inscriptos = await pool.query('select * from inscripciones join (select dni, nombre, apellido,categoria,id as idp from personas) as sel on inscripciones.dni_persona=sel.dni join (select id as id1, descripcion as nombrecurso1 from turnos) as sel2 on inscripciones.uno=sel2.id1 join (select id as id2, descripcion as nombrecurso2 from turnos) as sel3 on inscripciones.dos=sel3.id2 left join (select id_inscripcion , id_turno  from cursado) as sel8 on inscripciones.id=sel8.id_inscripcion left join (select id as idt, descripcion, id_curso from turnos) as sel9 on sel8.id_turno=sel9.idt left join(select id as idc, nombre as nombrecurso from cursos) as sel10 on sel9.id_curso=sel10.idc where edicion=3')


  //inscriptos = await pool.query('select * from inscripciones join (select dni, nombre, apellido,categoria from personas) as sel on inscripciones.dni_persona=sel.dni join (select id as id1, nombre as nombrecurso1 from cursos) as sel2 on inscripciones.uno=sel2.id1 join (select id as id2, nombre as nombrecurso2 from cursos) as sel3 on inscripciones.dos=sel3.id2 left join (select id as idc, id_turno from cursado) as sel8 on inscripciones.id=sel8.idt where edicion=2')
  curso1 = await pool.query('select * from inscripciones where uno =132')
  curso2 = await pool.query('select * from inscripciones where uno =133')
  curso3 = await pool.query('select * from inscripciones where uno =134')
  curso4 = await pool.query('select * from inscripciones where uno =135')
  curso5 = await pool.query('select * from inscripciones where uno =136')

  let deuda_exigible = []

  if (inscriptos.length === 0) {

    const dato1 = {
      'datoa': 'Cantidad de inscriptas',
      'datob': "No hay cuotas Calculadas"
    }
    const dato2 = {
      'datoa': 'Monto devengado hasta la cuota',
      'datob': "No hay cuotas Calculadas"
    }
    const dato3 = {
      'datoa': 'Monto abonado hasta la cuota',
      'datob': "No hay cuotas Calculadas"
    }
    const dato4 = {
      'datoa': 'Deuda Exigible',
      'datob': "No hay cuotas Calculadas"
    }
    const deuda_exigible = [dato1, dato2, dato3, dato4]
    const dato5 = {
      'datoa': 'Cantidad de cuotas sin pago',
      'datob': 'no calculado'
    }
    const dato6 = {
      'datoa': 'Monto cuota pura',
      'datob': 'no calculado'
    }
    const dato7 = {
      'datoa': 'Saldo de capital a vencer',
      'datob': 'no calculado'
    }

    const cuotas_pendientes = [dato5, dato6, dato7]




    res.json(respuesta)
  } else {



    const dato1 = {
      'datoa': 'Cantidad de inscriptas',
      'datob': inscriptos.length,
      'datoc': inscriptos.length * 100 / inscriptos.length,
      'datod': (25 * (inscriptos.length / inscriptos.length)).toFixed(2)

    }
    const dato2 = {
      'datoa': 'Elaboracion de mesa de dulces para eventos',
      'datob': curso1.length,
      'datoc': (curso1.length * 100 / inscriptos.length).toFixed(2),
      'datod': (25 * (curso1.length / inscriptos.length)).toFixed(2)
    }
    const dato3 = {
      'datoa': 'Maquillaje y peinado para eventos',
      'datob': curso2.length,
      'datoc': (curso2.length * 100 / inscriptos.length).toFixed(2),
      'datod': (25 * (curso2.length / inscriptos.length)).toFixed(2)
    }
    const dato4 = {
      'datoa': 'Diseño de lenceria femenina',
      'datob': curso3.length,
      'datoc': (curso3.length * 100 / inscriptos.length).toFixed(2),
      'datod': (25 * (curso3.length / inscriptos.length)).toFixed(2)
    }
    const dato5 = {
      'datoa': 'Textiles y accesorios para el verano',
      'datob': curso4.length,
      'datoc': (curso4.length * 100 / inscriptos.length).toFixed(2),
      'datod': (25 * (curso4.length / inscriptos.length)).toFixed(2)
    }
    const dato6 = {
      'datoa': 'Refaccion integral para el hogar',
      'datob': curso5.length,
      'datoc': (curso5.length * 100 / inscriptos.length).toFixed(2),
      'datod': (25 * (curso5.length / inscriptos.length)).toFixed(2)
    }
    deuda_exigible = [dato1, dato2, dato3, dato4, dato5, dato6]


  }

  cantidaddisp = await pool.query('select sum(disponibles) from turnos  where etapa=2 ')
  cantidaddis = await pool.query('select sum(cupo) from turnos  where etapa=2 ')
  cant_pre = await pool.query('select * from inscripciones where edicion=2 and estado in ("Preasignada","Asignada a curso","Rechazada","No Contesta")')
  cant_nc = await pool.query('select * from inscripciones where edicion=2 and estado ="No contesta"')
  cant_nr = await pool.query('select * from inscripciones where edicion=2 and estado ="Rechazada"')
  cant_pend = await pool.query('select * from inscripciones where edicion=2 and estado ="Preasignada"')
  cant_conf = await pool.query('select * from cursado join (select id as idi, edicion from inscripciones) as sel on cursado.id_inscripcion=sel.idi where edicion=2 ')


  datos33 = {
    cantidadturnos: cantidaddis[0]['sum(cupo)'],
    cant_preasig: cant_pre.length,
    cant_conf: cant_conf.length,
    cant_nc: cant_nc.length,
    cant_pend: cant_pend.length,
    cant_rech: cant_nr.length,
    cantidaddis: parseInt(cantidaddis[0]['sum(cupo)']) - cant_conf.length
  }

  res.json([inscriptos, deuda_exigible, datos33]) */
const  inscriptos = await pool.query('select * from inscripciones_carnaval join (select dni, nombre, apellido,categoria,id as idp,tel,tel2, barrio from personas) as sel on inscripciones_carnaval.id_persona=sel.idp where id>590')
  
let  deuda_exigible = []
 let datos33={}
    res.json([inscriptos, deuda_exigible, datos33])

})

////////  FUNCION PARA CREAR CURSOS
/* 
router.get('/crearcursos2daetapa/', async (req, res) => {
  inscriptos = await pool.query('select * from inscripciones join (select dni, nombre, apellido from personas) as sel on inscripciones.dni_persona=sel.dni join (select id as id1, nombre as nombrecurso1 from cursos) as sel2 on inscripciones.uno=sel2.id1 join (select id as id2, nombre as nombrecurso2 from cursos) as sel3 on inscripciones.dos=sel3.id2 where edicion=2')

  curso1 = await pool.query('select * from inscripciones where uno =132')
  curso2 = await pool.query('select * from inscripciones where uno =133')
  curso3 = await pool.query('select * from inscripciones where uno =134')
  curso4 = await pool.query('select * from inscripciones where uno =135')
  curso5 = await pool.query('select * from inscripciones where uno =136')

 uno = Math.round(25*(curso1.length/inscriptos.length))
 dos = Math.round(25*(curso2.length/inscriptos.length))
 tres = Math.round(25*(curso3.length/inscriptos.length))
 cuatro = Math.round(25*(curso4.length/inscriptos.length))
 cinco = Math.round(25*(curso5.length/inscriptos.length))

 for (let i = 0; i < uno; i++) {

  await pool.query('insert into turnos set id_curso=132, numero=?, Descripcion="Septiembre" ', [i])


}
for (let i = 0; i < dos; i++) {

  await pool.query('insert into turnos set id_curso=133, numero=?, Descripcion="Septiembre" ', [i])


}
for (let i = 0; i < tres; i++) {

  await pool.query('insert into turnos set id_curso=134, numero=?, Descripcion="Septiembre" ', [i])


}
for (let i = 0; i < cuatro; i++) {

  await pool.query('insert into turnos set id_curso=135, numero=?, Descripcion="Septiembre" ', [i])


}
for (let i = 0; i < cinco; i++) {

  await pool.query('insert into turnos set id_curso=136, numero=?, Descripcion="Septiembre" ', [i])


}

res.json (uno,dos,tres,cuatro,cinco)
})
 */
router.get('/incriptoss/', async (req, res) => {


  noinsc = await pool.query('select selec1.nombre,selec1.apellido, cursos.nombre as nombrecurso,priori2.nombre as nombrecurso2,selec1.dni from inscripciones join (select *, id as idpersona from personas ) as selec1 on inscripciones.dni_persona=selec1.dni join cursos on inscripciones.uno =cursos.id join (select * from cursos) as priori2 on inscripciones.dos=priori2.id where estado= "pendiente"')
  inscriptos = await pool.query('select id_persona,id_curso,id_turno, selec1.dni, selec1.nombre as nombrepersona,selec1.apellido as apellidopersona, cursos.nombre as nombrecurso, selec2.numero as numeroturno, selec2.descripcion  from  cursado join (select *, id as idpersona from personas) as selec1 on cursado.id_persona = selec1.idpersona join cursos on cursado.id_curso=cursos.id join (select id as idturno, numero, descripcion from turnos ) as selec2 on cursado.id_turno=selec2.idturno')
  console.log(inscriptos)
  res.json([inscriptos, noinsc])
})




router.post("/buscarestadopornombre", async (req, res) => {
  let { nombre, edicion } = req.body
  try {


    const asi = await pool.query('select * from inscripciones join (select nombre, apellido, dni from personas) as sel on inscripciones.dni_persona=sel.dni  where nombre like ? or apellido like ? and edicion=2', ['%' + nombre + '%', '%' + nombre + '%'])


    res.json(asi)



  } catch (error) {
    console.log(error)
    res.json([{ nombre: 'error' }])
  }
})

router.post("/buscarestadopordni", async (req, res) => {
  let { dni } = req.body
  try {


    const asi = await pool.query('select * from inscripciones join (select nombre, apellido, dni from personas) as sel on inscripciones.dni_persona=sel.dni  where dni like ?  and edicion=2', ['%' + dni + '%'])


    res.json(asi)



  } catch (error) {
    console.log(error)
    res.json([{ nombre: 'error' }])
  }
})

router.post('/borrarinscripcionde/', async (req, res) => {
const {id} = req.body



  await pool.query('delete from inscripciones_carnaval where id= ?',[id])

  res.json('Realizado')

})
////// desinscribir 
router.get('/desinscribirtodos/', async (req, res) => {


  await pool.query('update inscripciones set  estado= "pendiente"')


  await pool.query('delete  from  cursado')
  res.json('Realizado')

})

router.get('/borrarturnos/', async (req, res) => {

  try {




    await pool.query('delete  from  cursado ')
    await pool.query('delete  from  turnos')
    await pool.query('delete  from  clases')
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Algo salio mal')
  }

})



router.get('/borrarincripciones/', async (req, res) => {

  try {



    await pool.query('delete  from  inscripciones')
    await pool.query('delete  from  cursado')

    await pool.query('delete  from  clases')
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Algo salio mal')
  }

})

/////definir cupos 
router.get('/designarturnos/', async (req, res) => {
  const descripcion_curso = await pool.query('select * from descripcion_turno')
  const cursos = await pool.query('select uno, count(uno) from inscripciones group by uno ')

  try {


    let inscripciones = await pool.query('select * from inscripciones where estado="pendiente"')

    let turnos = 0
    if (inscripciones.length > 1000) {
      turnos = 25
    } else {
      ///cursos de 10 personas
      turnos = inscripciones.length / 10//////ACA REEMPLAZAR POR 25 DESPUES DE LAS PRUEBAS
    }
    rta = []


    for (ii in cursos) {


      porcentaje = cursos[ii]['count(uno)'] / inscripciones.length * 100
      console.log(porcentaje)
      console.log(turnos)
      console.log(turnos * porcentaje / 100 + "%")

      cantidad = Math.round(turnos * porcentaje / 100)
      console.log(cantidad)
      for (let i = 0; i < cantidad; i++) {

        nuev = {
          id_curso: cursos[ii]['uno'],
          numero: i + 1,
          descripcion: descripcion_curso[i + 1]['descripcion']
        }
        await pool.query('insert into turnos set ? ', [nuev])

        act = cantidad * 44////////////////////CAMBIAR A 25 CUANDO SE DE

        await pool.query('update cursos set cupo=?  where id=?', [act, cursos[ii]['uno']])


      }


    }
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.send('algo sucedio, asignar manualmente')
  }

})
router.get('/inscribirautomaticamente333/', async (req, res) => {

  for (let variable = 0; variable < 14; variable++) {
    unos = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="uno" and edicion=3 and  (estado="Inscripta" or estado="pendiente" )')

    if (unos.length > 0) {
      recorrer = 0
      necesario = 0
      while ((recorrer < unos.length) && (necesario < 30)) {

        /////// buscamso prioridad uno 
        try {

          disponibilidad = await pool.query('select * from cursado where id_turno=?', [unos[recorrer]['uno']])
          console.log('disponibilidad',disponibilidad)
          if (disponibilidad.length < 60) {
            necesario += 1
            console.log('agregando cat 1')
            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [unos[recorrer]['id_persona'], unos[recorrer]['categoria'], unos[recorrer]['uno'], unos[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [unos[recorrer]['id']])

          }

        } catch (error) {
          console.log(error)
        }
        recorrer += 1
      }
      if ((necesario < 30) && (disponibilidad.length < 60)) {
        console.log('buscando disponibilidad2')
        recorrer = 0
        while ((recorrer < unos.length) && (necesario < 30)) {


          disponibilidad = await pool.query('select * from cursado where id_turno=?', [unos[recorrer]['dos']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [unos[recorrer]['id_persona'], unos[recorrer]['categoria'], unos[recorrer]['dos'], unos[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [unos[recorrer]['id']])
          }
          recorrer += 1
        }
     
      }/// fin buscar uuna opcion por 2da 
    }/// fin de la busqueda de categoria 





    //////////categoria2
    doses = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="dos" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
    if (doses.length > 0) {
      recorrer = 0
      necesario = 0
      while ((recorrer < doses.length) && (necesario < 10)) {

        /////// buscamso prioridad uno 
        try {

          disponibilidad = await pool.query('select * from cursado where id_turno=?', [doses[recorrer]['uno']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [doses[recorrer]['id_persona'], doses[recorrer]['categoria'], doses[recorrer]['uno'], doses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [doses[recorrer]['id']])
            console.log('agregando cat 2')
          }
        

        } catch (error) {
          console.log(error)
        }
        recorrer += 1
      }
      if ((necesario < 10) && (disponibilidad.length < 60)) {
        console.log('buscando disponibilidad2')
        recorrer = 0
        while ((recorrer < doses.length) && (necesario < 10)) {


          disponibilidad = await pool.query('select * from cursado where id_turno=?', [doses[recorrer]['dos']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [doses[recorrer]['id_persona'], doses[recorrer]['categoria'], doses[recorrer]['dos'], doses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [doses[recorrer]['id']])
          }
          recorrer += 1
        }
       
      }/// fin buscar uuna opcion por 2da 
    }/// fin de la busqueda de categoria 












    
    //////////categoria3
    treses = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="tres" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
    if (treses.length > 0) {
      recorrer = 0
      necesario = 0
      while ((recorrer < treses.length) && (necesario < 5)) {

        /////// buscamso prioridad uno 
        try {

          disponibilidad = await pool.query('select * from cursado where id_turno=?', [treses[recorrer]['uno']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [treses[recorrer]['id_persona'], treses[recorrer]['categoria'], treses[recorrer]['uno'], treses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [treses[recorrer]['id']])
            console.log('agregando cat 2')
          }
       

        } catch (error) {
          console.log(error)
        }
        recorrer += 1
      }
      if ((necesario < 5) && (disponibilidad.length < 60)) {
        console.log('buscando disponibilidad2')
        recorrer = 0
        while ((recorrer < treses.length) && (necesario < 5)) {


          disponibilidad = await pool.query('select * from cursado where id_turno=?', [treses[recorrer]['dos']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [treses[recorrer]['id_persona'], treses[recorrer]['categoria'], treses[recorrer]['dos'], treses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [treses[recorrer]['id']])
          }
          recorrer += 1
        }
      
      }/// fin buscar uuna opcion por 2da 
    }/// fin de la busqueda de categoria 







    
    //////////categoria4
    cuatroses = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="cuatro" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
    if (cuatroses.length > 0) {
      recorrer = 0
      necesario = 0
      
      while ((recorrer < cuatroses.length) && (necesario < 15)) {

        /////// buscamso prioridad uno 
        try {

          disponibilidad = await pool.query('select * from cursado where id_turno=?', [cuatroses[recorrer]['uno']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [cuatroses[recorrer]['id_persona'], cuatroses[recorrer]['categoria'], cuatroses[recorrer]['uno'], cuatroses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [cuatroses[recorrer]['id']])
            console.log('agregando cat 2')
          }
       

        } catch (error) {
          console.log(error)
        }
        recorrer += 1
      }
      if ((necesario < 15) && (disponibilidad.length < 60)) {
        console.log('buscando disponibilidad2')
        recorrer = 0
        while ((recorrer < cuatroses.length) && (necesario < 5)) {


          disponibilidad = await pool.query('select * from cursado where id_turno=?', [cuatroses[recorrer]['dos']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [cuatroses[recorrer]['id_persona'], cuatroses[recorrer]['categoria'], cuatroses[recorrer]['dos'], cuatroses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [cuatroses[recorrer]['id']])
          }
          recorrer += 1
        }
        
      }/// fin buscar uuna opcion por 2da 
    }/// fin de la busqueda de categoria 











    
    
    //////////categoria5
    cincoses = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="cinco" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
    if (cincoses.length > 0) {
      recorrer = 0
      necesario = 0
      
      while ((recorrer < cincoses.length) && (necesario < 5)) {

        /////// buscamso prioridad uno 
        try {

          disponibilidad = await pool.query('select * from cursado where id_turno=?', [cincoses[recorrer]['uno']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [cincoses[recorrer]['id_persona'], cincoses[recorrer]['categoria'], cincoses[recorrer]['uno'], cincoses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [cincoses[recorrer]['id']])
            console.log('agregando cat 5')
          }
       

        } catch (error) {
          console.log(error)
        }
        recorrer += 1
      }
      if ((necesario < 5) && (disponibilidad.length < 60)) {
        console.log('buscando disponibilidad25')
        recorrer = 0
        while ((recorrer < cincoses.length) && (necesario < 5)) {


          disponibilidad = await pool.query('select * from cursado where id_turno=?', [cincoses[recorrer]['dos']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [cincoses[recorrer]['id_persona'], cincoses[recorrer]['categoria'], cincoses[recorrer]['dos'], cincoses[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [cincoses[recorrer]['id']])
          }
          recorrer += 1
        }
        
      }/// fin buscar uuna opcion por 2da 
    }/// fin de la busqueda de categoria 









    
    //////////categoria6
    seises = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="seis" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
    if (seises.length > 0) {
      recorrer = 0
      necesario = 0
      
      while ((recorrer < seises.length) && (necesario < 5)) {

        /////// buscamso prioridad uno 
        try {

          disponibilidad = await pool.query('select * from cursado where id_turno=?', [seises[recorrer]['uno']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [seises[recorrer]['id_persona'], seises[recorrer]['categoria'], seises[recorrer]['uno'], seises[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [seises[recorrer]['id']])
            console.log('agregando cat 2')
          }
       

        } catch (error) {
          console.log(error)
        }
        recorrer += 1
      }
      if ((necesario < 5) && (disponibilidad.length < 60)) {
        console.log('buscando disponibilidad2')
        recorrer = 0
        while ((recorrer < seises.length) && (necesario < 5)) {


          disponibilidad = await pool.query('select * from cursado where id_turno=?', [seises[recorrer]['dos']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [seises[recorrer]['id_persona'], seises[recorrer]['categoria'], seises[recorrer]['dos'], seises[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [seises[recorrer]['id']])
          }
          recorrer += 1
        }
      
      }/// fin buscar uuna opcion por 2da 
    }/// fin de la busqueda de categoria 





    //////////categoria7
    sietes = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="siete" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
    if (sietes.length > 0) {
      recorrer = 0
      necesario = 0
      
      while ((recorrer < sietes.length) && (necesario < 5)) {

        /////// buscamso prioridad uno 
        try {

          disponibilidad = await pool.query('select * from cursado where id_turno=?', [sietes[recorrer]['uno']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [sietes[recorrer]['id_persona'], sietes[recorrer]['categoria'], sietes[recorrer]['uno'], sietes[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [sietes[recorrer]['id']])
            console.log('agregando cat 2')
          }
       

        } catch (error) {
          console.log(error)
        }
        recorrer += 1
      }
      if ((necesario < 5) && (disponibilidad.length < 60)) {
        console.log('buscando disponibilidad2')
        recorrer = 0
        while ((recorrer < sietes.length) && (necesario < 5)) {


          disponibilidad = await pool.query('select * from cursado where id_turno=?', [sietes[recorrer]['dos']])
          if (disponibilidad.length < 60) {
            necesario += 1

            await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [sietes[recorrer]['id_persona'], sietes[recorrer]['categoria'], sietes[recorrer]['dos'], sietes[recorrer]['id']])

            await pool.query('update inscripciones set estado="Preasignada" where id=? ', [sietes[recorrer]['id']])
          }
          recorrer += 1
        }
      
      }/// fin buscar uuna opcion por 2da 
    }/// fin de la busqueda de categoria 













        //////////categoria8
        ochoss = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="ocho" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
        if (ochoss.length > 0) {
          recorrer = 0
          necesario = 0
          
          while ((recorrer < ochoss.length) && (necesario < 2)) {
    
            /////// buscamso prioridad uno 
            try {
    
              disponibilidad = await pool.query('select * from cursado where id_turno=?', [ochoss[recorrer]['uno']])
              if (disponibilidad.length < 60) {
                necesario += 1
    
                await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [ochoss[recorrer]['id_persona'], ochoss[recorrer]['categoria'], ochoss[recorrer]['uno'], ochoss[recorrer]['id']])
    
                await pool.query('update inscripciones set estado="Preasignada" where id=? ', [ochoss[recorrer]['id']])
                console.log('agregando cat 2')
              }
           
    
            } catch (error) {
              console.log(error)
            }
            recorrer += 1
          }
          if ((necesario < 2) && (disponibilidad.length < 60)) {
            console.log('buscando disponibilidad2')
            recorrer = 0
            while ((recorrer < ochoss.length) && (necesario < 2)) {
    
    
              disponibilidad = await pool.query('select * from cursado where id_turno=?', [ochoss[recorrer]['dos']])
              if (disponibilidad.length < 60) {
                necesario += 1
    
                await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [ochoss[recorrer]['id_persona'], ochoss[recorrer]['categoria'], ochoss[recorrer]['dos'], ochoss[recorrer]['id']])
    
                await pool.query('update inscripciones set estado="Preasignada" where id=? ', [ochoss[recorrer]['id']])
              }
              recorrer += 1
            }
          
          }/// fin buscar uuna opcion por 2da 
        }/// fin de la busqueda de categoria 
    





          //////////categoria9
          nuevess = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="nueve" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
          if (nuevess.length > 0) {
            recorrer = 0
            necesario = 0
            
            while ((recorrer < nuevess.length) && (necesario < 3)) {
      
              /////// buscamso prioridad uno 
              try {
      
                disponibilidad = await pool.query('select * from cursado where id_turno=?', [nuevess[recorrer]['uno']])
                if (disponibilidad.length < 60) {
                  necesario += 1
      
                  await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [nuevess[recorrer]['id_persona'], nuevess[recorrer]['categoria'], nuevess[recorrer]['uno'], nuevess[recorrer]['id']])
      
                  await pool.query('update inscripciones set estado="Preasignada" where id=? ', [nuevess[recorrer]['id']])
                  console.log('agregando cat 2')
                }
             
      
              } catch (error) {
                console.log(error)
              }
              recorrer += 1
            }
            if ((necesario < 3) && (disponibilidad.length < 60)) {
              console.log('buscando disponibilidad2')
              recorrer = 0
              while ((recorrer < nuevess.length) && (necesario < 3)) {
      
      
                disponibilidad = await pool.query('select * from cursado where id_turno=?', [nuevess[recorrer]['dos']])
                if (disponibilidad.length < 60) {
                  necesario += 1
      
                  await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [nuevess[recorrer]['id_persona'], nuevess[recorrer]['categoria'], nuevess[recorrer]['dos'], nuevess[recorrer]['id']])
      
                  await pool.query('update inscripciones set estado="Preasignada" where id=? ', [nuevess[recorrer]['id']])
                }
                recorrer += 1
              }
            
            }/// fin buscar uuna opcion por 2da 
          }/// fin de la busqueda de categoria 








                //////////categoria10
                dieses = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="diez" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
                if (dieses.length > 0) {
                  recorrer = 0
                  necesario = 0
                  
                  while ((recorrer < dieses.length) && (necesario < 10)) {
            
                    /////// buscamso prioridad uno 
                    try {
            
                      disponibilidad = await pool.query('select * from cursado where id_turno=?', [dieses[recorrer]['uno']])
                      if (disponibilidad.length < 60) {
                        necesario += 1
            
                        await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [dieses[recorrer]['id_persona'], dieses[recorrer]['categoria'], dieses[recorrer]['uno'], dieses[recorrer]['id']])
            
                        await pool.query('update inscripciones set estado="Preasignada" where id=? ', [dieses[recorrer]['id']])
                        console.log('agregando cat 2')
                      }
                   
            
                    } catch (error) {
                      console.log(error)
                    }
                    recorrer += 1
                  }
                  if ((necesario < 10) && (disponibilidad.length < 60)) {
                    console.log('buscando disponibilidad2')
                    recorrer = 0
                    while ((recorrer < dieses.length) && (necesario < 10)) {
            
            
                      disponibilidad = await pool.query('select * from cursado where id_turno=?', [dieses[recorrer]['dos']])
                      if (disponibilidad.length < 60) {
                        necesario += 1
            
                        await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [dieses[recorrer]['id_persona'], dieses[recorrer]['categoria'], dieses[recorrer]['dos'], dieses[recorrer]['id']])
            
                        await pool.query('update inscripciones set estado="Preasignada" where id=? ', [dieses[recorrer]['id']])
                      }
                      recorrer += 1
                    }
                  
                  }/// fin buscar uuna opcion por 2da 
                }/// fin de la busqueda de categoria 









                
                //////////categoria11
                oncess = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="once" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
                if (oncess.length > 0) {
                  recorrer = 0
                  necesario = 0
                  
                  while ((recorrer < oncess.length) && (necesario < 2)) {
            
                    /////// buscamso prioridad uno 
                    try {
            
                      disponibilidad = await pool.query('select * from cursado where id_turno=?', [oncess[recorrer]['uno']])
                      if (disponibilidad.length < 60) {
                        necesario += 1
            
                        await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [oncess[recorrer]['id_persona'], oncess[recorrer]['categoria'], oncess[recorrer]['uno'], oncess[recorrer]['id']])
            
                        await pool.query('update inscripciones set estado="Preasignada" where id=? ', [oncess[recorrer]['id']])
                        console.log('agregando cat 2')
                      }
                   
            
                    } catch (error) {
                      console.log(error)
                    }
                    recorrer += 1
                  }
                  if ((necesario < 2) && (disponibilidad.length < 60)) {
                    console.log('buscando disponibilidad2')
                    recorrer = 0
                    while ((recorrer < oncess.length) && (necesario < 2)) {
            
            
                      disponibilidad = await pool.query('select * from cursado where id_turno=?', [oncess[recorrer]['dos']])
                      if (disponibilidad.length < 60) {
                        necesario += 1
            
                        await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [oncess[recorrer]['id_persona'], oncess[recorrer]['categoria'], oncess[recorrer]['dos'], oncess[recorrer]['id']])
            
                        await pool.query('update inscripciones set estado="Preasignada" where id=? ', [oncess[recorrer]['id']])
                      }
                      recorrer += 1
                    }
                  
                  }/// fin buscar uuna opcion por 2da 
                }/// fin de la busqueda de categoria 



                  
                //////////categoria12
                docess = await pool.query('select * from inscripciones join (select id as idp,categoria from personas) as sel on inscripciones.id_persona=sel.idp where  categoria="doce" and edicion=3 and  (estado="Inscripta" or estado="pendiente")')
                if (docess.length > 0) {
                  recorrer = 0
                  necesario = 0
                  
                  while ((recorrer < docess.length) && (necesario < 3)) {
            
                    /////// buscamso prioridad uno 
                    try {
            
                      disponibilidad = await pool.query('select * from cursado where id_turno=?', [docess[recorrer]['uno']])
                      if (disponibilidad.length < 60) {
                        necesario += 1
            
                        await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,etapa=3', [docess[recorrer]['id_persona'], docess[recorrer]['categoria'], docess[recorrer]['uno'], docess[recorrer]['id']])
            
                        await pool.query('update inscripciones set estado="Preasignada" where id=? ', [docess[recorrer]['id']])
                        console.log('agregando cat 2')
                      }
                   
            
                    } catch (error) {
                      console.log(error)
                    }
                    recorrer += 1
                  }
                  if ((necesario < 3) && (disponibilidad.length < 60)) {
                    console.log('buscando disponibilidad2')
                    recorrer = 0
                    while ((recorrer < docess.length) && (necesario < 3)) {
            
            
                      disponibilidad = await pool.query('select * from cursado where id_turno=?', [docess[recorrer]['dos']])
                      if (disponibilidad.length < 60) {
                        necesario += 1
            
                        await pool.query('insert into cursado set id_persona=?,categoria=?,id_turno=?,id_inscripcion=?,observaciones="Se toma 2da opcion",etapa=3', [docess[recorrer]['id_persona'], docess[recorrer]['categoria'], docess[recorrer]['dos'], docess[recorrer]['id']])
            
                        await pool.query('update inscripciones set estado="Preasignada" where id=? ', [docess[recorrer]['id']])
                      }
                      recorrer += 1
                    }
                  
                  }/// fin buscar uuna opcion por 2da 
                }/// fin de la busqueda de categoria 

    console.log("Vuelta")
    console.log("variable")
    
  } /// fin for

})



router.get('/inscribirauddddto/', async (req, res) => {

  let inscripciones = await pool.query('select * from inscripciones where estado="Inscripta"')
  const criterios = await pool.query('select * from criterios')
  listadef = []

  for (ii in inscripciones) {

    persona = await pool.query('select * from personas where dni =?', inscripciones[ii]['dni_persona'])

    cat = await asignarcategoria(persona) //// trae la categoria
    turnoaux = inscripciones[ii]['horario']



    bandera = false////la bandera para avisar si ya se inscribio en alguno de los cupos
    //iii = 0

    yaseinscribio = await pool.query('select * from cursado where id_persona =?', persona[0]['id'])
    if (yaseinscribio.length === 0) {
      if (persona.length === 0) {
        bandera = false
      }
      ////////ENTRA EN BUCLE REVISANDO CUPO EN HORARIOS
      turnoactual = '99'



      turno = await pool.query('select * from turnos where id_curso=? and numero = ?', [inscripciones[ii]['uno'], turnoaux])
      bandera = false
      try {
        id_turn = turno[0]['id']


      } catch (err) {

        id_turn = '9999j'/////valor cualquiera
      }
      if (turno.length > 0) {
        console.log(turno.length)
        for (iiii in turno) {
          if (!bandera) {
            haycupo = await cantidadcategoriaporcurso(cat, inscripciones[ii]['uno'], criterios[criterios.length - 1][cat], turno[iiii]['id'])//// envia categoria y la id del curso devuelve si hay cupo 

            if (haycupo) {


              bandera = true

              console.log(inscripciones[ii]['uno'])



              await pool.query('insert into cursado set inscripcion=?,id_persona=?,id_curso=?,categoria=?,id_inscripcion=?,id_turno=? ', ["Asignado a curso", persona[0]['id'], inscripciones[ii]['uno'], cat, inscripciones[ii]['id'], turno[iiii]['id']])


              await pool.query('update inscripciones set estado="Asignado a curso" where id=? ', [inscripciones[ii]['id']])

            }

          }

        }


      }

      if (!bandera) {
        listadef.push(inscripciones[ii])
        //////crea una listta con las inscripciones 1 rechazadas
      }



    }

  }


  ////////////propridad 2
  //////////listadef las sobranters
  for (ii in listadef) {


    persona = await pool.query('select * from personas where dni =?', listadef[ii]['dni_persona'])
    cat = await asignarcategoria(persona) //// trae la categoria
    turnoaux = inscripciones[ii]['horario']



    bandera = false////la bandera para avisar si ya se inscribio en alguno de los cupos
    iii = 0
    if (persona.length === 0) {
      bandera = true
    }
    ////////ENTRA EN BUCLE REVISANDO CUPO EN HORARIOS

    pers = await pool.query('select * from personas where dni =?', inscripciones[ii]['dni_persona'])

    yaseinscribio = await pool.query('select * from cursado where id_persona =?', pers[0]['id'])
    if (yaseinscribio.length === 0) {

      turno = await pool.query('select * from turnos where id_curso=? and numero = ?', [listadef[ii]['dos'], turnoaux])
      if (turno.length > 0) {
        for (iiii in turno) {
          if (!bandera) {
            haycupo = await cantidadcategoriaporcurso(cat, listadef[ii]['dos'], criterios[criterios.length - 1][cat], turno[iiii]['id'])//// envia categoria y la id del curso devuelve si hay cupo 


            if (haycupo) {






              await pool.query('insert into cursado set inscripcion=?,id_persona=?,id_curso=?,categoria=?,id_inscripcion=?,id_turno=? ', ["Asignado a curso", persona[0]['id'], listadef[ii]['dos'], cat, listadef[ii]['id'], turno[iiii]['id']])



              await pool.query('update inscripciones set estado= "Asignado a curso" where id=? ', [listadef[ii]['id'],])
              bandera = true
            }
          }

        }
      }


    }

  }
  res.send('Realizado')
})






router.get('/listaaclaracioncriterios/', async (req, res) => {


  const criterios = await pool.query(' select * from criterios ')

 const  tabla = [
    {
      Categoria: "1.1.1",
      Aclaracion: "Uno",
      Detalle: "No participo/Tiene hijos/No trabaja",
      porcentaje: criterios[criterios.length - 1]['uno']
    },
    {
      Categoria: "1.1.2.1",
      Detalle: "No participo/Tiene hijos/trabaja informalmente",
      Aclaracion: "Dos",
      porcentaje: criterios[criterios.length - 1]['dos']
    },
    {
      Categoria: "1.1.2.2",
      Aclaracion: "Tres",
      Detalle: "No participo/Tiene hijos/trabaja formalmente",
      porcentaje: criterios[criterios.length - 1]['tres']
    },
    {
      Categoria: "1.2.1",
      Aclaracion: "Cuatro",
      Detalle: "No participo/ No tiene hijos/ No trabaja ",
      porcentaje: criterios[criterios.length - 1]['cuatro']
    }
    , {
      Categoria: "1.2.2.1",
      Aclaracion: "Cinco",
      Detalle: "No participo/ No tiene hijos/ Trabaja Informalmente",
      porcentaje: criterios[criterios.length - 1]['cinco']
    },
    {
      Categoria: "1.2.2.2",
      Aclaracion: "Seis",
      Detalle: "No participo/ No tiene hijos/ Trabaja Formalmente",
      porcentaje: criterios[criterios.length - 1]['seis']
    },

    {
      Categoria: "2.1.1",
      Aclaracion: "Siete",
      Detalle: "Participo/Tiene hijos/No trabaja",
      porcentaje: criterios[criterios.length - 1]['siete']
    },
    {
      Categoria: "2.1.2.1",
      Aclaracion: "Ocho",
      Detalle: "Participo/Tiene hijos/ Tranaja informalmente",
      porcentaje: criterios[criterios.length - 1]['ocho']
    },
    {
      Categoria: "2.1.2.2",
      Aclaracion: "Nueve",
      Detalle: "Participo/Tiene hijos/ Tranaja Formalmente",
      porcentaje: criterios[criterios.length - 1]['nueve']
    },
    {
      Categoria: "2.2.1",
      Aclaracion: "Diez",
      Detalle: "Participo/ No tiene hijos/ No trabaja",
      porcentaje: criterios[criterios.length - 1]['diez']
    },
    {
      Categoria: "2.2.2",
      Aclaracion: "Once",
      Detalle: "Participo/ No tiene hijos/ trabaja",
      porcentaje: criterios[criterios.length - 1]['once']
    },


  ]
  res.json(tabla)

})


///////// LISTA DE CRITERIOS 

router.get('/listacriterios/', async (req, res) => {

  const criterios = await pool.query('select * from criterios')

  res.json([criterios[criterios.length - 1]])
})


router.get('/listacursos/', async (req, res) => {

  ////////ista de inscriptos con prioridad uno

  // const detallepriori1 = await pool.query('select cursos.nombre,  cupo from inscripciones  join personas on inscripciones.dni_persona  = personas.dni join cursos on inscripciones.uno = cursos.id  ')

  //seleccionamos los cursos 
  const cursos = await pool.query(' select id from cursos')
  //recorremos los cursos 

  let listadef = []
let cantidad = []
let turnosss = []
let cursado = []
let Obj = {}
  /////// inicio carga de prioridad 1
  for (ii in cursos) {

    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo from inscripciones left join cursos on inscripciones.uno = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.uno = ?    ', [cursos[ii]['id']])

    cursado = await pool.query('select * from cursado where id_curso= ?', [cursos[ii]['id']])
    turnosss = await pool.query('select * from turnos where id_curso= ?', [cursos[ii]['id']])
    try {
      Obj = {
        nombre: cantidad[0]['nombre'],
        cantidad: cantidad.length,
        cupo: turnosss.length * 44,
        cursando: cursado.length,
        id: cantidad[0]['id'],
        turnos: turnosss.length
      }

    } catch (error) {
      Obj = {
        nombre: 'no',
        cantidad: 'no',
        cupo: 'no',
        cursando: 'no',
        id: 'no',

      }
    }


    listadef.push(Obj)

  }



  listadef2 = []

  /////// inicio carga de prioridad 2
  for (ii in cursos) {
    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo from inscripciones left join cursos on inscripciones.dos = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.dos = ?    ', [cursos[ii]['id']])
    turnosss = await pool.query('select * from turnos where id_curso= ?', [cursos[ii]['id']])
    cursado = await pool.query('select * from cursado where id_curso= ?', [cursos[ii]['id']])
    try {
      Obj = {
        nombre: cantidad[0]['nombre'],
        cantidad: cantidad.length,
        cupo: turnosss.length * 44,
        cursando: cursado.length,
        id: cantidad[0]['id'],
        turnos: turnosss.length
      }

    } catch (error) {
      Obj = {
        nombre: 'no',
        cantidad: 'no',
        cupo: 'no',
        cursando: 'no',
        id: 'no',
      }
    }


    listadef2.push(Obj)

  }





  listadef3 = []

  /////// inicio carga de prioridad 3
  /*
  for (ii in cursos) {

    cantidad = await pool.query('select  cursos.id,cursos.nombre,cursos.cupo  from inscripciones left join cursos on inscripciones.tres = cursos.id  left join personas on inscripciones.dni_persona = personas.dni  where inscripciones.tres = ?   ', [cursos[ii]['id']])
    
 
    Obj = {
      nombre: cantidad[0]['nombre'],
      cantidad: cantidad.length,
      cupo: cantidad[0]['cupo'],
      id: cantidad[0]['id'],
    }

    listadef3.push(Obj)

  }*/
  ////////ista de inscriptos con prioridad dos





  const pend = await pool.query('select id from inscripciones where estado = "pendiente" ')




  console.log(listadef)
  console.log(listadef2)

  //const priori2 = await pool.query('select * from inscripciones join cursos on inscripciones.dos  =cursos.id')
  // const priori3 = await pool.query('select * from inscripciones join cursos on inscripciones.tres  =cursos.id')

  res.json([listadef, listadef2, pend.length]);

})





router.post("/confirmaciondellamado", async (req, res) => {
  const { confirmacion, id_turno, id_persona, id_cursado } = req.body
  try {



    cursado = await pool.query('select * from cursado where id = ? ', [id_cursado])



    await pool.query('update cursado set inscripcion=? where id=?', [confirmacion, id_cursado])


    await pool.query('update inscripciones set estado=? where id=?', [confirmacion, cursado[0]['id_inscripcion']])
    console.log('realizado')
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('Error algo sucedio')
  }


})



router.post("/actualizarprioridades", isLoggedInn2, async (req, res) => {
  const { unounouno, unounodosuno, unounodosdos, unodosuno, unodosdosuno, unodosdosdos, dosunouno, dosunodosuno, dosunodosdos, dosdosuno, dosdosdos } = req.body

  const act = {
    uno: unounouno,
    dos: unounodosuno,
    tres: unounodosdos,

    cuatro: unodosuno,
    cinco: unodosdosuno,
    seis: unodosdosdos,
    siete: dosunouno,
    ocho: dosunodosuno,
    nueve: dosunodosdos,
    diez: dosdosuno,
    once: dosdosdos,
  }
  console.log(act)
  await pool.query('insert criterios set uno=?,dos=?,tres=?,cuatro=?,cinco=?,seis=?,siete=?,ocho=?,nueve=?,diez=?,once=? ', [unounouno, unounodosuno, unounodosdos, unodosuno, unodosdosuno, unodosdosdos, dosunouno, dosunodosuno, dosunodosdos, dosdosuno, dosdosdos,])


  res.json('realizado')
})




router.get('/actualizarcursado/', async (req, res) => {
  correjidos = 0
  cursado = await pool.query('select * from cursado')
  personas = ''

  for (ii in cursado) {
    cantidad = await pool.query('select * from cursado where id_persona = ?', [cursado[ii]['id_persona']])
    if (cantidad.length > 1) {
      pers = await pool.query('select * from personas where id = ?', [cursado[ii]['id_persona']])
      personas = personas + 'persona ' + pers[0]['nombre'] + ' inscripta mas de una vez en curso ' + cursado[ii]['id_curso']
    }

    inscripcion = await pool.query('select * from inscripciones where id = ?', [cursado[ii]['id_inscripcion']])
    if (inscripcion[0]['estado'] === 'pendiente') {

      await pool.query('update inscripciones set estado=? where id=? ', [cursado[ii]['inscripcion'], cursado[ii]['id_inscripcion']])
      correjidos += 1

    }

  }
  rta = ' SE CORRIJIERON ' + correjidos + 'estados en inscripciones'
  if (personas === '') {
    personas = 'no hay personas inscriptas mas de una vez'
  }

  res.json([rta, personas])
})





export default router;