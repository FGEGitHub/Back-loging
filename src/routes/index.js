import express from "express";
const router = express.Router();
import pool from "../database.js";


/// borrar despues




router.get('/', async (req, res) => {
    console.log('hola')
try {
   pipo= 'HOLA MUNDO '
   res.json(pipo);
} catch (error) {
  res.json('error')
}
   


 
//res.render('index')
})


router.get('/traercantidades', async (req, res) => {
 
  const can = await pool.query('Select * from rk where id=5' )
  res.json(can[0])
})

router.get('/sumarjugada', async (req, res) => {
 
  const can = await pool.query('UPDATE rk SET punt = punt + 1  where id=5' )
  
  res.json(can[0])
})     
router.get('/traervotos', async (req, res) => {
  id= req.params.id
   const can = await pool.query('select * from votacion' )
   
   res.json(can)
 })
 router.post('/sumarvoto/', async (req, res) => {
  const { idOpcion, idVotante } = req.body;
  console.log(idOpcion, idVotante);

  try { 
      // Incrementar el voto en la tabla 'votacion'
      await pool.query('UPDATE votacion SET votes = votes + 1 WHERE id = ?', [idOpcion]);

      // Traer la columna 'votos' del usuario desde la tabla 'rk'
      const [rkRecord] = await pool.query('SELECT votos FROM rk WHERE id = ?', [idVotante]);
      console.log(rkRecord)
      // Si no se encuentra el registro
    

      let votosArray = [];

      // Verificar si 'votos' tiene un valor no nulo   
      if (rkRecord.votos) {
          try {
              // Intentar parsear el valor como JSON (el campo votos es un string en LONGTEXT)
              votosArray = JSON.parse(rkRecord.votos);

              // Validar que el resultado sea un arreglo
              if (!Array.isArray(votosArray)) {
                  throw new Error('El campo votos no es un arreglo válido');
              }
          } catch (error) {
              console.error('Error al parsear votos:', error);
              return res.status(500).json({ mensaje: 'Error en el formato de la columna votos' });
          }
      }

      // Agregar el nuevo idOpcion al arreglo de votos (evitar duplicados)
      if (!votosArray.includes(idOpcion)) {
          votosArray.push(idOpcion);
      }

      // Actualizar la columna 'votos' en la tabla 'rk' con el nuevo arreglo de votos
      await pool.query('UPDATE rk SET votos = ? WHERE id = ?', [JSON.stringify(votosArray), idVotante]);

      // Devolver el arreglo actualizado de votos
      res.json({
          mensaje: 'Voto registrado y actualizado',
          votos: votosArray,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: 'Error al procesar el voto' });
  }
});



router.get('/tllamadoscarnaval', async (req, res) => {
 
 
  try {
    const encargados = await pool.query('select * from usuarios where nivel =6')
  
    let envio = []
    asignados = 0
    for (encargado in encargados) {
        let asignados = await pool.query('select * from inscripciones_carnaval where id_call =? ', [encargados[encargado]['id']])
  
  
        let sinc = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="Inscripto" ', [encargados[encargado]['id']])
        let asig = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="Asignadx a curso" ', [encargados[encargado]['id']])
        let rech = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="Rechazada" ', [encargados[encargado]['id']])
        let agregadoagrupo = await pool.query('select * from inscripciones_carnaval where id_call =? and agregadoagrupo="Si" ', [encargados[encargado]['id']])

        nocont = await pool.query('select * from inscripciones_carnaval where id_call =? and estado="No contesta" ', [encargados[encargado]['id']])
  
        let objeto_nuevo = {
            id: encargados[encargado]['id'],
            nombre: encargados[encargado]['nombre'],
            asignados: asignados.length,
            sinc: sinc.length,
            asig: asig.length,
            rech: rech.length,
            nocont:nocont.length,
            agregadoagrupo:agregadoagrupo.length
  
        }
        envio.push(objeto_nuevo)
    }
  
  
    console.log(envio)
    res.json([envio])
  } catch (error) {
    console.log(error)
  res.json(['error'])
  }
   
  
  
  
  //res.render('index')
  })



router.get('/todoslosencargadosllamados', async (req, res) => {
 
 
try {
  const encargados = await pool.query('select * from usuarios where nivel =6')

  let envio = []
  asignados = 0
  for (encargado in encargados) {
      let turnos = await pool.query('select * from turnos where id_call =? and etapa=5 ', [encargados[encargado]['id']])
     

      sinc= 0
      asig= 0
      rech= 0
      nocont=0
      mensaje=0
asignada=0
      for (tur in turnos) {
      
        let sinco = await pool.query('select * from inscripciones join(select id as idc, id_turno,id_inscripcion from cursado) as sel on inscripciones.id=sel.id_inscripcion  where id_turno =? and (estado="Preasignada" or estado="pendiente") ', [turnos[tur]['id']])
        let mensajeo = await pool.query('select * from inscripciones join(select id as idc, id_turno,id_inscripcion from cursado) as sel on inscripciones.id=sel.id_inscripcion  where id_turno =? and estado="Mensaje enviado" ', [turnos[tur]['id']])
        let asignadao = await pool.query('select * from inscripciones join(select id as idc, id_turno,id_inscripcion from cursado) as sel on inscripciones.id=sel.id_inscripcion  where id_turno =? and estado="Asignada a curso" ', [turnos[tur]['id']])


        let asigo = await pool.query('select * from inscripciones join(select id as idc, id_turno,id_inscripcion from cursado) as sel on inscripciones.id=sel.id_inscripcion  where id_turno =? ', [turnos[tur]['id']])
        let recho = await pool.query('select * from inscripciones join(select id as idc, id_turno,id_inscripcion from cursado) as sel on inscripciones.id=sel.id_inscripcion  where id_turno =? and estado="Rechazada" ', [turnos[tur]['id']])
         noconto = await pool.query('select * from inscripciones join(select id as idc, id_turno,id_inscripcion from cursado) as sel on inscripciones.id=sel.id_inscripcion  where id_turno =? and estado="No contesta" ', [turnos[tur]['id']])

      
   
            sinc=sinc+ sinco.length,
            asig= asig+asigo.length,
            rech=rech+ recho.length,
            mensaje=mensaje+mensajeo.length
            nocont=nocont+noconto.length
            asignada=asignada+asignadao.length
  
      
      }


      let objeto_nuevo = {
          id: encargados[encargado]['id'],
          nombre: encargados[encargado]['nombre'],
          turnos:turnos.length,
          sinc,
          asig,
          rech,
          mensaje,
          nocont,
          asignada
      }
      envio.push(objeto_nuevo)
  }


  res.json([envio])
} catch (error) {
  console.log(error)
res.json(['error'])
}
 



//res.render('index')
})
router.get('/exitosignupp', async (req, res) => {
res.json('Modificado correctamente')

})

router.get('/noexitop', async (req, res) => {
  res.json('Error algo sucedio, complete correctamente los datos')

})

router.get('/prueba', async (req, res) => {
  console.log((new Date(Date.now())).toLocaleDateString())
  console.log((new Date(Date.now())))
  console.log((new Date.now()))
try {

} catch (error) {
res.json(['error'])
}
 



//res.render('index')
})


export default router;