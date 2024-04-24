

const express = require('express')
const router = express.Router()
const pool = require('../../database')


async function asignarcategoria(persona) {

  let categoria = 'cero'
  try {

    
      if ((persona[0]['participante_anterior'] == "Sí") || (persona[0]['participante_anterior'] == "Si")) {

        /// 
        if ((persona[0]['hijos'] == "0") || (persona[0]['hijos'] == null) || (persona[0]['hijos'] == "No")|| (persona[0]['hijos'] == "nn")) {

          ///tiene hijos
          //  porcentaje_real=35.1
          if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {

            if ((persona[0]['tipo_trabajo'] === "Formal") || (persona[0]['tipo_trabajo'] === "FORMAL")  ) {

              categoria = "doce"

            } else {

              categoria = "once"
            }


          } else {
            ///No trabaja 90%

            categoria = "diez"



          }
        } else {
          ///22%  Notiene hijos
          //  porcentaje_real=9.9

          if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {

            if((persona[0]['tipo_trabajo'] === "Formal") || (persona[0]['tipo_trabajo'] === "FORMAL")  )  {

              categoria = "nueve"

            } else {

              categoria = "ocho"
            }


          } else {
            ///No trabaja 90%

            categoria = "siete"



          }



        }



      } else {


        ///////////////////////NO PARTICIPARON 
        ////55% 

        //   porcentaje_real=55
        if ((persona[0]['hijos'] == "0") || (persona[0]['hijos'] == null) || (persona[0]['hijos'] == "No")) {

          ///78% tiene hijos
          //  porcentaje_real=35.1
          if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {

            if ((persona[0]['tipo_trabajo'] === "Formal") || (persona[0]['tipo_trabajo'] === "FORMAL")  ) {

              categoria = "seis"

            } else {

              categoria = "cinco"
            }


          } else {
            ///No trabaja 90%

            categoria = "cuatro"



          }
        } else {
          ///22%  Notiene hijos
          //  porcentaje_real=9.9

          if (persona[0]['trabajo'] === "Si" || persona[0]['trabajo'] === "Si") {

            if ((persona[0]['tipo_trabajo'] === "Formal") || (persona[0]['tipo_trabajo'] === "FORMAL")  ) {

              categoria = "tres"

            } else {

              categoria = "dos"
            }


          } else {
            ///No trabaja 90%

            categoria = "uno"



          }



        }

      }
    

  } catch (error) {

  }
  return categoria

}



exports.asignarcategoria = asignarcategoria