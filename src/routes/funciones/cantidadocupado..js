

const express = require('express')
const router = express.Router()
const pool = require('../../dbconnector')


async function cantidadcategoriaporcurso(categoria, id_curso, porcentaje_creiterio, id_turno) {

    haylugar = true


///
    cupo = await pool.query('select count(*) from turnos where id_curso = ? ', [id_curso])
    
    //const cursado = await pool.query('select *, id as idcursado from cursado  join (select *, id as idcurso from cursos ) as selec1 on cursado.id_curso=selec1.idcurso  where cursado.id_curso= ? and  categoria =?', [id_curso, categoria])
    ////cursado son los anotados con esa caracteristicas
    const cursado = await pool.query('select * from cursado  where cursado.id_curso= ? and  categoria =?', [id_curso, categoria])

    cuporeal = await pool.query('select * from turnos where id_curso=?', [id_curso])


    try {


        cuporeal = cuporeal.length*44///////////////cambiar a 25
        ///comparacion de si el cupo / cursado.length es para ver si agedando sobrepasa
      
       
        if ((cuporeal * porcentaje_creiterio / 100) < (cursado.length + 1)) {////////+1 par aque se llene ante el redondeo
            haylugar = false
        }else{

      ////////preguntar horario antes o despues
      const curs = await pool.query('select * from cursado  join (select id as idturno from turnos) as select1  on cursado.id_turno=select1.idturno where cursado.id_curso= ? and cursado.id_turno=?', [id_curso,id_turno])
     
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