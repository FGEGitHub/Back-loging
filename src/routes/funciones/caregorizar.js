import express from "express";


export async function asignarcategoria(persona) {
  let categoria = 'cero'

  try {
    const p = persona[0]

    const participoAntes =
      p.participante_anterior === "Sí" || p.participante_anterior === "Si"

    const noTieneHijos =
      p.hijos === "0" ||
      p.hijos === null ||
      p.hijos === "No" ||
      p.hijos === "nn"

    const trabaja = p.trabajo === "Si"
    const trabajoFormal = p.tipo_trabajo === "Formal" || p.tipo_trabajo === "FORMAL"

    if (participoAntes) {
      // PARTICIPÓ ANTERIORMENTE
      if (noTieneHijos) {
        if (trabaja) {
          categoria = trabajoFormal ? "doce" : "once"
        } else {
          categoria = "diez"
        }
      } else {
        if (trabaja) {
          categoria = trabajoFormal ? "nueve" : "ocho"
        } else {
          categoria = "siete"
        }
      }
    } else {
      // NO PARTICIPÓ ANTERIORMENTE
      if (noTieneHijos) {
        if (trabaja) {
          categoria = trabajoFormal ? "seis" : "cinco"
        } else {
          categoria = "cuatro"
        }
      } else {
        if (trabaja) {
          categoria = trabajoFormal ? "tres" : "dos"
        } else {
          categoria = "uno"
        }
      }
    }
  } catch (error) {
    // se mantiene vacío como en tu versión original
  }

  return categoria
}

