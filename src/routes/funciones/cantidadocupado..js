

const express = require('express')
const router = express.Router()
const pool = require('../../database')


async function cantidadcategoriaporcurso(categoria, id_curso, porcentaje_creiterio, turno) {

    haylugar = true



    curso = await pool.query('select * from cursos where id = ? ', [id_curso])
    
    const cursado = await pool.query('select cursos.cupo from cursado  join cursos on cursado.id_curso=cursos.id  where cursado.id_curso= ? and  categoria =?', [id_curso, categoria])
    
 

    cuporeal = await pool.query('select * from turnos where id_curso=?', [id_curso])
    


    try {


        cuporeal = curso[0]['cupo'] / cuporeal.length
        if ((curso[0]['cupo'] * porcentaje_creiterio / 100) < (cursado.length + 1)) {
            haylugar = false
        }

    } catch (error) {

    }

    return haylugar

}



exports.cantidadcategoriaporcurso = cantidadcategoriaporcurso