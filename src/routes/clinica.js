const express = require('express')
const router = express.Router()
const { isLoggedInncli } = require('../lib/auth') //proteger profile
const pool = require('../database5')
const multer = require('multer')
const path = require('path')
const fse = require('fs').promises;
const fs = require('fs');
const axios = require('axios');

///import { format } from "date-fns"; // si lo querés más cómodo
////solicitado== se suma al partido
////convocado,= s enevia a un juagdor la invitacion



router.get('/traerusuario/:cuil_cuit',isLoggedInncli, async (req, res) => {
    cuil_cuit = req.params.cuil_cuit
   console.log(cuil_cuit)
    const usuario = await pool.query('select * from usuarios where usuario= ? ', [cuil_cuit])
   
    res.json(usuario)


})




router.get('/traerpacientes',isLoggedInncli, async (req, res) => {
    cuil_cuit = req.params.cuil_cuit
   console.log(cuil_cuit)
    const usuario = await pool.query('select * from pacientes ')
   
    res.json(usuario)


})

router.post('/agregarPersona', isLoggedInncli, async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            fecha_nacimiento,
            fecha_ingreso,
            telefono,
            direccion
        } = req.body;

        const sql = `
            INSERT INTO pacientes 
            (nombre, apellido, dni, fecha_nacimiento, fecha_ingreso, telefono, direccion)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            nombre || null,
            apellido || null,
            dni || null,
            fecha_nacimiento || null,
            fecha_ingreso || null,
            telefono || null,
            direccion || null
        ];

        const resultado = await pool.query(sql, values);

        res.json({
            ok: true,
            msg: "Paciente agregado correctamente",
            id: resultado.insertId
        });

    } catch (error) {
        console.error("Error al agregar paciente:", error);
        res.status(500).json({ ok: false, error: "Error en el servidor" });
    }
});


router.get('/datospaciente/:id', async (req, res) => {
  const id = req.params.id
  const chiques = await pool.query('select * from pacientes where id =?', [id])
  try {
    
    res.json([chiques, "imagenBase64", ["vincuos"]])
  } catch (error) {
    console.log(error)
    res.json([])
  }

})
////////////////////traerusuario


module.exports = router