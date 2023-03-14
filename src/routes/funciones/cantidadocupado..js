

const express = require('express')
const router = express.Router()
const pool = require('../../database')


async function cantidadcategoriaporcurso(categoria, id_curso, porcentaje_creiterio, id_turno) {

    haylugar = true


///
    cupo = await pool.query('select count(*) from turnos where id_curso = ? ', [id_curso])
    
    const cursado = await pool.query('select * from cursado  join cursos on cursado.id_curso=cursos.id  where cursado.id_curso= ? and  categoria =?', [id_curso, categoria])
    ////cursado son los anotados con esa caracteristicas
 

    cuporeal = await pool.query('select * from turnos where id_curso=?', [id_curso])


    try {


        cuporeal = cuporeal.length*44///////////////cambiar a 25
        ///comparacion de si el cupo / cursado.length es para ver si agedando sobrepasa
      
       
        if ((cuporeal * porcentaje_creiterio / 100) < (cursado.length + 1)) {////////+1 par aque se llene ante el redondeo
            haylugar = false
        }else{

      ////////preguntar horario antes o despues
      const curs = await pool.query('select * from cursado  join turnos on cursado.id_turno=turnos.id  where cursado.id_curso= ? and cursado.id_turno=?', [id_curso,id_turno])
     
      if ( 44 <= (curs.length )) {////////+1 par aque se llene ante el redondeo
        haylugar = false
    }


        }

    } catch (error) {
console.log(error)
    }

    return haylugar

}



exports.cantidadcategoriaporcurso = cantidadcategoriaporcurso