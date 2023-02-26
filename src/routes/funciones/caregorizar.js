

const express = require('express')
const router = express.Router()
const pool = require('../../database')


async function asignarcategoria (persona) {
    
    const caregoria =''
if ((persona[0]['participante_anterior'] === "Sí") || (persona[0]['participante_anterior'] === "Si")) {

    /// 
    if ((persona[0]['hijos'] == "0") || (persona[0]['hijos'] == null)) {
      
      ///tiene hijos
      //  porcentaje_real=35.1
      if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {
        
        if (persona[0]['tipo_trabajo'] === "Formal") {
          
          categoria = "2.2.2"

        } else {
        
          categoria = "2.2.2"
        }


      } else {
        ///No trabaja 90%
     
        categoria = "2.2.1"



      }
    } else {
      ///22%  Notiene hijos
      //  porcentaje_real=9.9
   
      if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {
     
        if (persona[0]['tipo_trabajo'] === "Formal") {
          
          categoria = "2.1.2.2"

        } else {
          
          categoria = "2.1.2.1"
        }


      } else {
        ///No trabaja 90%
       
        categoria = "2.1.1"



      }



    }



  } else {///////////////////////NO PARTICIPARON 
    ////55% 

    //   porcentaje_real=55
    if ((persona[0]['hijos'] == "0") || (persona[0]['hijos'] == null)) {
     
      ///78% tiene hijos
      //  porcentaje_real=35.1
      if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {
       
        if (persona[0]['tipo_trabajo'] === "Formal") {
         
          categoria = "1.2.2.2"

        } else {
         
          categoria = "1.2.2.1"
        }


      } else {
        ///No trabaja 90%
      
        categoria = "1.2.1"



      }
    } else {
      ///22%  Notiene hijos
      //  porcentaje_real=9.9
    
      if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {
        
        if (persona[0]['tipo_trabajo'] === "Formal") {
          
          categoria = "1.1.2.2"

        } else {
      
          categoria = "1.1.2.1"
        }


      } else {
        ///No trabaja 90%
       
        categoria = "1.1.1"



      }



    }

  }
  return categoria

}



exports.asignarcategoria = asignarcategoria