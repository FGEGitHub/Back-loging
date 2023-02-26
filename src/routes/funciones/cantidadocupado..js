

const express = require('express')
const router = express.Router()
const pool = require('../../database')


async function cantidadcategoriaporcurso(categoria, id_curso, porcentaje_creiterio,turno) {
 

const cursado = await pool.query('select cursos.cupo from cursado  join cursos on cursado.id_curso=cursos.id join turnos on cursado.id_curso =  turnos.id_curso  where cursado.id_curso= ? and  categoria =? and turnos.numero = ? ',[id_curso,categoria,turno])
console.log('cursado'+cursado)
haylugar=true
cuporeal = await pool.query('select * from turnos where id_curso=?', [id_curso])
if (cursado.length >0){

    if ((cursado[0]['cupo']* porcentaje_creiterio/100)<  (cursado.length+1 )){
        haylugar=false
    }

    
}
return haylugar
    
}



exports.cantidadcategoriaporcurso = cantidadcategoriaporcurso