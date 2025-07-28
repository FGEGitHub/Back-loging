const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2, isLoggedInn5 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const multer = require('multer')
const XLSX = require('xlsx')
const path = require('path')
const passport = require('passport')


const diskstorage = multer.diskStorage({
    destination: path.join(__dirname, '../Excel'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-inscrip-' + file.originalname)

    }
}) //para que almacene temporalmente la imagen
const fileUpload = multer({
    storage: diskstorage,

}).single('image')




router.get('/traerrecomendaciones', async (req, res) => {
    const mesass = await pool.query('select * from mesas_fiscales left join ( select mesa as mesaasig, dni, escuela as escualasig from asignaciones_fiscales2) as selec1 on mesas_fiscales.id= selec1.mesaasig  join (select dni as dnipersona, nombre as nombrepers, apellido, id_donde_vota, telefono, telefono2 from personas_fiscalizacion) as selec2 on selec1.dni=selec2.dnipersona join (select id as idesc, nombre as nombreesc, ubicacion from escuelas) as selec5 on selec2.id_donde_vota=selec5.idesc where id_escuela=? and selec1.escualasig != selec2.id_donde_vota ')

    console.log(mesass)

    
    const escuelas = await pool.query('select * from escuelas where etapa2="Si"')
    let enviar = []
/////




    /////
    for (esc in escuelas){

        // buscar las mesas que le faltan
         mesas = await pool.query('select * from mesas_fiscales where id_escuela=? and numero not in ("Suplente 1","Suplente 2","Suplente 3","Suplente 4","Suplente 5")',[escuelas[esc]['id']])
let cant =0
         for (mes in mesas ){
            exi = await pool.query('select * from asignaciones_fiscales2 where mesa=?',[mesas[mes]['id']])
            if (exi.length==0){
                cant+=1
            }
         }
        /// buscar los pendientes q votan ahi  
        personas =await pool.query('select * from inscripciones_fiscales2 join (select dni as dnip, id_donde_vota from personas_fiscalizacion) as selec on inscripciones_fiscales2.dni=selec.dnip where id_donde_vota=?',[escuelas[esc]['id']])
        personasno =await pool.query('select * from inscripciones_fiscales2 join (select dni as dnip, id_donde_vota from personas_fiscalizacion) as selec on inscripciones_fiscales2.dni=selec.dnip  left join (select dni as dnia from asignaciones_fiscales2) as sele2 on     inscripciones_fiscales2.dni=sele2.dnia    where id_donde_vota=? and dnia = null',[escuelas[esc]['id']])

        let nuevo={
            escuela:escuelas[esc]['nombre'],
            mesascant:mesas.length,
            mesas:cant,
            personas:personas.length,
            personasno:personasno.length
        }
        enviar.push(nuevo)

    }


res.json(enviar)


})



router.get('/verobservaciones/:id', async (req, res) => {
    const id = req.params.id
try {
       const observaciones =  await pool.query('select * from observaciones where id_ref=?',[id])
res.json(observaciones)
} catch (error) {
    console.log(error)
    res.json(['error'])
}
 

})



router.get('/traerincripcionesdealiadoadmin/:id', async (req, res) => {
    const id = req.params.id

    const inscri2 = await pool.query('select * from inscripciones_fiscales  where cargadopor =?', [id])

    let envi = []
    for (inscripcion in inscri2) {
        if (inscri2[inscripcion]['dni'] == "Sin definir") {

            if (inscri2[inscripcion]['nombre'] == undefined) {
                persona_auxiliar = await pool.query('select * from personas_fiscalizacion where apellido = ? ', [inscri2[inscripcion]['apellido']])
            } else {
                if (inscri2[inscripcion]['apellido'] == undefined) {
                    persona_auxiliar = await pool.query('select * from personas_fiscalizacion where nombre = ? ', [inscri2[inscripcion]['nombre']])

                } else {
                    persona_auxiliar = await pool.query('select * from personas_fiscalizacion where nombre = ? and apellido =? ', [inscri2[inscripcion]['nombre'], inscri2[inscripcion]['apellido']])

                }
            }






        } else {
            persona_auxiliar = await pool.query('select * from personas_fiscalizacion where dni= ? ', [inscri2[inscripcion]['dni']])
        }



        let nuev = {
            id: inscri2[inscripcion]['id'],
            dni: inscri2[inscripcion]['dni'],
            nombre: inscri2[inscripcion]['nombre'],
            apellido: inscri2[inscripcion]['apellido'],
            fecha_carga: inscri2[inscripcion]['fecha_carga'],
            telefono: persona_auxiliar[0]['telefono'],
            telefono2: persona_auxiliar[0]['telefono2'],
            id_aliado: inscri2[inscripcion]['id_aliado'],
            nombre_aliado: inscri2[inscripcion]['nombre_aliado']
        }
        envi.push(nuev)








    }

    console.log(envi)

    res.json(envi)




})


router.get('/listadealiados/', async (req, res,) => {

    try {
        let personas = await pool.query('select * from usuarios where nivel=7')
        let enviar = []
        for (recor in personas) {
            let canti = await pool.query('select * from inscripciones_fiscales where cargadopor=?', [personas[recor]['id']])

            let canti2 = await pool.query('select * from asignaciones_fiscales join (select id as idinscrip, cargadopor from inscripciones_fiscales ) as selec on asignaciones_fiscales.id_inscripcion=selec.idinscrip where cargadopor=?', [personas[recor]['id']])

            let nu = {
                id: personas[recor]['id'],
                nombre: personas[recor]['nombre'],
                cantidad: canti.length,
                cantidadasig: canti2.length
            }
            enviar.push(nu)
        }
        res.json(enviar)
    } catch (error) {
        console.log(error)
    }


})

router.get('/traerdatosdepersona/:id', async (req, res,) => {
    const id = req.params.id
    try {
        let personas = await pool.query('select * from personas_fiscalizacion  left join (select id as ide, nombre as nombreescuela from escuelas) as selec on personas_fiscalizacion.id_donde_vota=selec.ide left join (select dni as dniinscrip, observaciones from inscripciones_fiscales) as selec3 on personas_fiscalizacion.dni=selec3.dniinscrip where id=?', [id])
        res.json(personas)
    } catch (error) {
        console.log(error)
    }


})
router.get('/traerpersonas', async (req, res,) => {
    try {
        let personas = await pool.query('select * from personas_fiscalizacion left join (select id as idescuela, nombre as nombreescuela from escuelas) as selec on personas_fiscalizacion.id_donde_vota=selec.idescuela ')
        res.json(personas)
    } catch (error) {
        console.log(error)
    }


})


router.get('/traerroles', async (req, res,) => {
    try {
        let personas = await pool.query('select * from roles_fisca order by nombre')
        res.json(personas)
    } catch (error) {
        console.log(error)
    }


})



router.get('/traerpersonasdeunenc/:id', async (req, res,) => {
    const id = req.params.id
    try {
        //let personas = await pool.query('select * from personas_fiscalizacion join (select id as idins, id_encargado, dni as dni2 from inscripciones_fiscales) as selec2 on personas_fiscalizacion.dni=selec2.dni2 left join (select id as idescuela, nombre as nombreescuela from escuelas) as selec on personas_fiscalizacion.id_donde_vota=selec.idescuela where id_encargado=? ',[id])


        let personas = await pool.query('select * from personas_fiscalizacion join (select id as idins, id_encargado, dni as dni2 from inscripciones_fiscales2) as selec2 on personas_fiscalizacion.dni=selec2.dni2  where id_encargado=? and dni2<>"Sin definir"', [id])
        res.json(personas)

    } catch (error) {
        console.log(error)
    }


})



router.get('/traerobservaciones/:dni', async (req, res,) => {
    const dni = req.params.dni

    try {

        const obser = await pool.query('select * from observaciones where id_ref =? ', [dni])


        res.json(obser)
    } catch (error) {
        console.log(error)
        res.json(['error'])
    }


})


router.get('/todasincripciones', async (req, res,) => {

    //  let inscri = await pool.query('select * from inscripciones_fiscales join (select dni as dni_persona, movilidad, vegano, celiaco, telefono,telefono2 from personas_fiscalizacion ) as selec on inscripciones_fiscales.dni=selec.dni_persona left join (select id as id_aliado, nombre as nombre_aliado from usuarios)  as selec2 on inscripciones_fiscales.cargadopor=selec2.id_aliado  where inscripciones_fiscales.estado="Pendiente" ')

    //
    let inscri2 = await pool.query('select * from inscripciones_fiscales  where edicion=2025')

    //


    let envi = []

    for (inscripcion in inscri2) {

        try {
            let cargadop = [['Autoinscripcion']]

            if (inscri2[inscripcion]['cargadopor'] != "Autoinscripcion") {
                cargadop = await pool.query('select * from usuarios where id =?', [inscri2[inscripcion]['cargadopor']])
            }

            let encargado = 'Sin asignar'
            if (inscri2[inscripcion]['id_encargado'] != undefined && inscri2[inscripcion]['id_encargado'] != 0) {

                let encargado_aux = await pool.query('select * from usuarios where id = ?', [inscri2[inscripcion]['id_encargado']])
                encargado = encargado_aux[0]['nombre']
            }

            let persona_auxiliar = []
            if (inscri2[inscripcion]['dni'] == "Sin definir") {

                if (inscri2[inscripcion]['nombre'] == undefined) {
                    persona_auxiliar = await pool.query('select * from personas_fiscalizacion where apellido = ? ', [inscri2[inscripcion]['apellido']])
                } else {
                    if (inscri2[inscripcion]['apellido'] == undefined) {
                        persona_auxiliar = await pool.query('select * from personas_fiscalizacion where nombre = ? ', [inscri2[inscripcion]['nombre']])

                    } else {
                        persona_auxiliar = await pool.query('select * from personas_fiscalizacion where nombre = ? and apellido =? ', [inscri2[inscripcion]['nombre'], inscri2[inscripcion]['apellido']])

                    }
                }






            } else {

                persona_auxiliar = await pool.query('select * from personas_fiscalizacion where dni= ? ', [inscri2[inscripcion]['dni']])
            }

            let band = true
            try {
                let usua = await pool.query('select * from usuarios where id = ? ', [inscri2[inscripcion]['cargadopor']])
                if (usua[0]['nivel'] == 8) {

                    let idaux = inscri2[inscripcion]['id']
                    for (variable in envi) {

                        if (envi[variable]['id'] === idaux) {

                            band = false
                        }
                    }


                }
            } catch (error) {


            }
            try {


                if (cargadop.length == 0) {
                    cargadop = [{ nombre: "Autoinscripcion" }]
                }
            } catch (error) {
                console.log('catch2')
                cargadop = [{ nombre: "Autoinscripcion" }]
                persona_auxiliar = [{ vegano: "verificar", celiaco: "verificar", telefono: "verificar", telefono2: "verificar", id_aliado: "verificar" }]
                encargado = "verificar"

            }
            if (band) {
                let nuev = {
                    fiscalizo: inscri2[inscripcion]['asignado_ant'],
                    id: inscri2[inscripcion]['id'],
                    observaciones: inscri2[inscripcion]['observaciones'],
                    dni: inscri2[inscripcion]['dni'],
                    nombre: inscri2[inscripcion]['nombre'],
                    estado: inscri2[inscripcion]['estado'],
                    cargadopor: cargadop[0]['nombre'],
                    apellido: inscri2[inscripcion]['apellido'],
                    fecha_carga: inscri2[inscripcion]['fecha_carga'],
                    como_se_entero: inscri2[inscripcion]['como_se_entero'],
                    apellido_referido: inscri2[inscripcion]['apellido_referido'],
                    nombre_referido: inscri2[inscripcion]['nombre_referido'],
                    dni_persona: inscri2[inscripcion]['dni_persona'],
                    vegano: persona_auxiliar[0]['vegano'],
                    celiaco: persona_auxiliar[0]['celiaco'],
                    telefono: persona_auxiliar[0]['telefono'],
                    telefono2: persona_auxiliar[0]['telefono2'],
                    id_aliado: inscri2[inscripcion]['id_aliado'],
                    nombre_aliado: inscri2[inscripcion]['nombre_aliado'],
                    encargado: encargado
                }
                envi.push(nuev)
            }
        } catch (error) {

            try {
                if (cargadop.length == 0) {
                    cargadop = [{ nombre: "Autoinscripcion" }]
                }
            } catch (error) {

                cargadop = [{ nombre: "Autoinscripcion" }]
                persona_auxiliar = [{ vegano: "verificar", celiaco: "verificar", telefono: "verificar", telefono2: "verificar", id_aliado: "verificar" }]
                encargado = "verificar"

            }
            let nuev = {
                fiscalizo: inscri2[inscripcion]['asignado_ant'],
                id: inscri2[inscripcion]['id'],
                observaciones: inscri2[inscripcion]['observaciones'],
                dni: inscri2[inscripcion]['dni'],
                nombre: inscri2[inscripcion]['nombre'],
                estado: inscri2[inscripcion]['estado'],
                cargadopor: cargadop[0]['nombre'],
                apellido: inscri2[inscripcion]['apellido'],
                fecha_carga: inscri2[inscripcion]['fecha_carga'],
                como_se_entero: inscri2[inscripcion]['como_se_entero'],
                apellido_referido: inscri2[inscripcion]['apellido_referido'],
                nombre_referido: inscri2[inscripcion]['nombre_referido'],
                dni_persona: inscri2[inscripcion]['dni_persona'],

                vegano: persona_auxiliar[0]['vegano'],
                celiaco: persona_auxiliar[0]['celiaco'],
                telefono: persona_auxiliar[0]['telefono'],
                telefono2: persona_auxiliar[0]['telefono2'],
                id_aliado: inscri2[inscripcion]['id_aliado'],
                nombre_aliado: inscri2[inscripcion]['nombre_aliado'],
                encargado: encargado
            }

            envi.push(nuev)
        }


    }


    res.json([envi])
})


router.get('/todasincripciones2/:id', async (req, res,) => {
    const id = req.params.id
    //  let inscri = await pool.query('select * from inscripciones_fiscales join (select dni as dni_persona, movilidad, vegano, celiaco, telefono,telefono2 from personas_fiscalizacion ) as selec on inscripciones_fiscales.dni=selec.dni_persona left join (select id as id_aliado, nombre as nombre_aliado from usuarios)  as selec2 on inscripciones_fiscales.cargadopor=selec2.id_aliado  where inscripciones_fiscales.estado="Pendiente" ')
    console.log(id)
    //
    let inscri2 = await pool.query('select * from inscripciones_fiscales  where (inscripciones_fiscales.estado="Pendiente"  or inscripciones_fiscales.estado="No contestado")  and id_encargado=? ', [id])

    //

    let envi = []

    for (inscripcion in inscri2) {

        try {
            let cargadop = [['Autoinscripcion']]
            if (inscri2[inscripcion]['cargadopor'] != "Autoinscripcion") {
                cargadop = await pool.query('select * from usuarios where id =?', inscri2[inscripcion]['cargadopor'])
            }


            let persona_auxiliar = []
            if (inscri2[inscripcion]['dni'] == "Sin definir") {

                if (inscri2[inscripcion]['nombre'] == undefined) {
                    persona_auxiliar = await pool.query('select * from personas_fiscalizacion where apellido = ? ', [inscri2[inscripcion]['apellido']])
                } else {
                    if (inscri2[inscripcion]['apellido'] == undefined) {
                        persona_auxiliar = await pool.query('select * from personas_fiscalizacion where nombre = ? ', [inscri2[inscripcion]['nombre']])

                    } else {
                        persona_auxiliar = await pool.query('select * from personas_fiscalizacion where nombre = ? and apellido =? ', [inscri2[inscripcion]['nombre'], inscri2[inscripcion]['apellido']])

                    }
                }






            } else {
                persona_auxiliar = await pool.query('select * from personas_fiscalizacion where dni= ? ', [inscri2[inscripcion]['dni']])
            }

            let band = true
            try {
                let usua = await pool.query('select * from usuarios where id = ? ', [inscri2[inscripcion]['cargadopor']])
                if (usua[0]['nivel'] == 8) {

                    let idaux = inscri2[inscripcion]['id']
                    for (variable in envi) {

                        if (envi[variable]['id'] === idaux) {
                            console.log('igual')
                            band = false
                        }
                    }


                }
            } catch (error) {

            }


            if (band) {
                let nuev = {
                    id: inscri2[inscripcion]['id'],
                    observaciones: inscri2[inscripcion]['observaciones'],
                    dni: inscri2[inscripcion]['dni'],
                    nombre: inscri2[inscripcion]['nombre'],
                    estado: inscri2[inscripcion]['estado'],
                    cargadopor: cargadop[0]['nombre'],
                    apellido: inscri2[inscripcion]['apellido'],
                    fecha_carga: inscri2[inscripcion]['fecha_carga'],
                    como_se_entero: inscri2[inscripcion]['como_se_entero'],
                    apellido_referido: inscri2[inscripcion]['apellido_referido'],
                    nombre_referido: inscri2[inscripcion]['nombre_referido'],
                    dni_persona: inscri2[inscripcion]['dni_persona'],
                    vegano: persona_auxiliar[0]['vegano'],
                    celiaco: persona_auxiliar[0]['celiaco'],
                    telefono: persona_auxiliar[0]['telefono'],
                    telefono2: persona_auxiliar[0]['telefono2'],
                    id_aliado: inscri2[inscripcion]['id_aliado'],
                    nombre_aliado: inscri2[inscripcion]['nombre_aliado']
                }
                envi.push(nuev)
            }
        } catch (error) {
            console.log(error)
            let nuev = {
                id: inscri2[inscripcion]['id'],
                observaciones: inscri2[inscripcion]['observaciones'],
                dni: inscri2[inscripcion]['dni'],
                nombre: inscri2[inscripcion]['nombre'],
                estado: inscri2[inscripcion]['estado'],
                cargadopor: cargadop[0]['nombre'],
                apellido: inscri2[inscripcion]['apellido'],
                fecha_carga: inscri2[inscripcion]['fecha_carga'],
                como_se_entero: inscri2[inscripcion]['como_se_entero'],
                apellido_referido: inscri2[inscripcion]['apellido_referido'],
                nombre_referido: inscri2[inscripcion]['nombre_referido'],
                dni_persona: inscri2[inscripcion]['dni_persona'],

                vegano: persona_auxiliar[0]['vegano'],
                celiaco: persona_auxiliar[0]['celiaco'],
                telefono: persona_auxiliar[0]['telefono'],
                telefono2: persona_auxiliar[0]['telefono2'],
                id_aliado: inscri2[inscripcion]['id_aliado'],
                nombre_aliado: inscri2[inscripcion]['nombre_aliado']
            }
            envi.push(nuev)
        }


    }


    res.json([envi])
})


router.get('/traerincripcionesdealiado/:id', async (req, res) => {
    const id = req.params.id

    try {
        const etc = await pool.query('select id, dni, apellidoo, nombree, telefono, telefono2 from inscripciones_fiscales join (select dni as dni_pers, nombre as nombree, apellido as apellidoo, telefono, telefono2 from personas_fiscalizacion)as selec on dni=dni_pers where cargadopor =?', [id])

        res.json(etc);
    } catch (error) {
        console.log(error)
        res.json([]);
    }



})


router.get('/datosusuarioporid/:dni', async (req, res) => {
    const dni = req.params.dni


    const etc = await pool.query('select * from personas where dni =?', [dni])

    res.json(['ficha', 'porcentaje', 'cat']);




})


router.get('/traerinscripcionesenc/:id', async (req, res) => {
    const id = req.params.id


    const etc = await pool.query('select * from inscripciones_fiscales left join (select dni as dnip, id_donde_vota from personas_fiscalizacion) as selec on inscripciones_fiscales.dni=selec.dnip left join (select id as idesc, nombre as nombreesc,etapa2 from escuelas) as selec2 on selec.id_donde_vota=selec2.idesc  where  (id_encargado is null or id_encargado= 0) and inscripciones_fiscales.estado="Pendiente" and edicion=2025 order by nombreesc', [id])

    res.json(etc);




})


// router.get('/traerinscripcionesenc/:id', async (req, res) => {
//     const id = req.params.id


//     const etc = await pool.query('select * from inscripciones_fiscales where  id_encargado is null or id_encargado= 0 ', [id])
//     console.log(etc)

//     res.json(etc);




// })

router.get('/traercircuitos', async (req, res) => {
    const dni = req.params.dni


    const etc = await pool.query('select circuito from escuelas  group by circuito ')

    res.json(etc);

})


router.get('/traerescuelas', async (req, res) => {
    const dni = req.params.dni


    const etc = await pool.query('select * from escuelas  order by nombre ')

    res.json(etc);

})
router.get('/traerescuelas2', async (req, res) => {
    


    const etc = await pool.query('select * from escuelas  order by nombre ')
    const etc2 = await pool.query('select * from escuelas   order by nombre')
    res.json([etc,etc2]);

}) 


router.get('/traerescuelas3', async (req, res) => {
    


    const etc = await pool.query('select * from escuelas  order by nombre ')
    const etc2 = await pool.query('select * from escuelas   where etapa2="Si" order by nombre')


    res.json([etc,etc2]);

})


router.get('/traerescuelasfalt', async (req, res) => {



    const etc = await pool.query('select * from escuelas  order by nombre ')

    let envioo = []
    for (axilliarmesas in etc) {

        let mesass = await pool.query('select * from mesas_fiscales left join (select mesa as mesaa, edicion from asignaciones_fiscales) as selec2 on mesas_fiscales.id=selec2.mesaa where selec2.mesaa IS NULL and id_escuela=? and edicion=2025', [etc[axilliarmesas]['id']])

        if (mesass.length > 0) {
            envioo.push(etc[axilliarmesas])
        }

    }





    res.json(envioo);




})

router.get('/traerescuelasymesas/:id', async (req, res) => {
    const id = req.params.id


    const etc = await pool.query('select * from escuelas  ')
    const mesas = await pool.query('select * from mesas_fiscales where id_escuela=?  ', [id])

    res.json([etc, mesas]);




})


router.get('/todaslasinscripcionesescuelas', async (req, res,) => {


    try {
        estr = await pool.query('select * from excelescuelas ')
        console.log(estr)
        res.json(estr)
    } catch (error) {
        res.send('algo salio mal')
    }


})

router.get('/todaslasinscripciones', async (req, res,) => {


    try {
        estr = await pool.query('select * from excelfiscalizacion ')
        console.log(estr)
        res.json(estr)
    } catch (error) {
        res.send('algo salio mal')
    }


})



router.get('/listademesassuplentes', async (req, res,) => {


    try {
        estr = await pool.query('select * from mesas_fiscales left join (select id as id_esc, nombre from escuelas) as selec1 on mesas_fiscales.id_escuela=selec1.id_esc left join (select mesa as mesaf, dni,checkk,capacitado from asignaciones_fiscales2) as selec2 on mesas_fiscales.id=selec2.mesaf  join (select dni as dnipers, apellido, nombre as nombrepers,id_donde_vota, telefono, telefono2 from personas_fiscalizacion) as selec3 on selec2.dni=selec3.dnipers left join (select id as idescuelaa, nombre as nombredondevota from escuelas) as selec5 on selec3.id_donde_vota=selec5.idescuelaa where numero = "Suplente 1" or numero = "Suplente 2" or numero = "Suplente 3" or numero = "Suplente 4" or numero = "Suplente 5" or numero = "Suplente 6" or numero = "Suplente 7"')

        res.json(estr)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }


})


router.get('/verlogueo', isLoggedInn5, async (req, res,) => {


    try {
        estr = await pool.query('select * from mesas_fiscales left join (select id as id_esc, nombre from escuelas) as selec1 on mesas_fiscales.id_escuela=selec1.id_esc left join (select mesa as mesaf, dni from asignaciones_fiscales) as selec2 on mesas_fiscales.id=selec2.mesaf left join (select dni as dnipers, apellido, nombre as nombrepers,id_donde_vota, telefono, telefono2 from personas_fiscalizacion) as selec3 on selec2.dni=selec3.dnipers left join (select id as idescuelaa, nombre as nombredondevota from escuelas) as selec5 on selec3.id_donde_vota=selec5.idescuelaa')

        res.json(estr)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }


})


router.get('/listademesas', async (req, res,) => {


    try {
        estr = await pool.query('select * from mesas_fiscales left join (select id as id_esc,circuito, nombre, etapa2 from escuelas) as selec1 on mesas_fiscales.id_escuela=selec1.id_esc left join (select mesa as mesaf, dni from asignaciones_fiscales2) as selec2 on mesas_fiscales.id=selec2.mesaf left join (select dni as dnipers, apellido, nombre as nombrepers,id_donde_vota, telefono, telefono2 from personas_fiscalizacion) as selec3 on selec2.dni=selec3.dnipers left join (select id as idescuelaa, nombre as nombredondevota from escuelas) as selec5 on selec3.id_donde_vota=selec5.idescuelaa')

        res.json(estr)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }


})

router.get('/listadeescuelas', async (req, res,) => {


    try {
        estr = await pool.query('select * from escuelas where etapa2="Si"')
        let escuelastodas = []

        for (auxiescuela in estr) {
            let cantidad_mesas = await pool.query('select * from mesas_fiscales where id_escuela=? and numero != "Suplente 1" and numero != "Suplente 2" and numero != "Suplente 3" and numero != "Suplente 4" and numero != "Suplente 5" and numero != "Suplente 6"  and numero != "Suplente 7"', [estr[auxiescuela]['id']])
            let cantidad_asig = await pool.query('select * from asignaciones_fiscales2 join (select id as idmesa, id_escuela, numero from mesas_fiscales ) as selec1 on asignaciones_fiscales2.mesa=selec1.idmesa where id_escuela=? and numero != "Suplente 1" and numero != "Suplente 2" and numero != "Suplente 3" and numero != "Suplente 4" and numero != "Suplente 5" and numero != "Suplente 6"  and numero != "Suplente 7"', [estr[auxiescuela]['id']])
            let cantidad_veg = await pool.query('select * from asignaciones_fiscales2 join (select id as idmesa, id_escuela, numero from mesas_fiscales ) as selec1 on asignaciones_fiscales2.mesa=selec1.idmesa join (select dni as dnipers, vegano from personas_fiscalizacion) as selec5 on asignaciones_fiscales2.dni=selec5.dnipers where vegano ="Si" and id_escuela=? ', [estr[auxiescuela]['id']])
            let cantidad_cel = await pool.query('select * from asignaciones_fiscales2 join (select id as idmesa, id_escuela, numero from mesas_fiscales ) as selec1 on asignaciones_fiscales2.mesa=selec1.idmesa join (select dni as dnipers, celiaco from personas_fiscalizacion) as selec5 on asignaciones_fiscales2.dni=selec5.dnipers where celiaco ="Si" and id_escuela=? ', [estr[auxiescuela]['id']])
            let cantidad_pres = await pool.query('select * from asignaciones_fiscales2 join (select id as idmesa, id_escuela, numero from mesas_fiscales ) as selec1 on asignaciones_fiscales2.mesa=selec1.idmesa join (select dni as dnipers, celiaco from personas_fiscalizacion) as selec5 on asignaciones_fiscales2.dni=selec5.dnipers where dato1 ="Si" and id_escuela=? ', [estr[auxiescuela]['id']])
            let cantidad_aus = await pool.query('select * from asignaciones_fiscales2 join (select id as idmesa, id_escuela, numero from mesas_fiscales ) as selec1 on asignaciones_fiscales2.mesa=selec1.idmesa join (select dni as dnipers, celiaco from personas_fiscalizacion) as selec5 on asignaciones_fiscales2.dni=selec5.dnipers where dato1 ="No" and id_escuela=? ', [estr[auxiescuela]['id']])
            let cantidad_movil = 0
            let cantidad_suplentes = await pool.query('select * from asignaciones_fiscales2 join (select id as idmesa, id_escuela, numero from mesas_fiscales ) as selec1 on asignaciones_fiscales2.mesa=selec1.idmesa where id_escuela=? and (numero = "Suplente 1" or numero = "Suplente 2" or numero = "Suplente 3" or numero = "Suplente 4" or numero = "Suplente 5" or numero = "Suplente 6" or numero = "Suplente 7")', [estr[auxiescuela]['id']])
            let lestr = await pool.query('select * from mesas_fiscales left join (select mesa as mesaa from asignaciones_fiscales2) as selec2 on mesas_fiscales.id=selec2.mesaa join (select id as idescuela, nombre as nombre_escuela from escuelas) as selec4 on mesas_fiscales.id_escuela=selec4.idescuela  where selec2.mesaa IS NULL and (numero = "Suplente 1" or numero = "Suplente 2" or numero = "Suplente 3" or numero = "Suplente 4" or numero = "Suplente 5" or numero = "Suplente 6" or numero = "Suplente 7")and id_escuela=?', [estr[auxiescuela]['id']])
            for (auximesa in cantidad_mesas) {
                // let mesarecorrido = await pool.query('select * from mesas_fiscales join (select mesa as mesaa, dni  from asignaciones_fiscales) as selec1 on mesas_fiscales.id=selec1.mesaa join (select dni as dnipers, id_donde_vota from personas_fiscalizacion) as selec2 on selec1.dni=selec2.dnipers where id=? ',[cantidad_mesas[auximesa]['id']])
                //  let escuelarecorrido = await pool.query('select * from mesas_fiscales  where id=? ',[cantidad_mesas[auximesa]['id']])


                let dondevota = await pool.query('select * from asignaciones_fiscales2 join (select dni as dnipers, id_donde_vota from personas_fiscalizacion) as selec on asignaciones_fiscales2.dni=selec.dnipers where mesa =?', cantidad_mesas[auximesa]['id'])

                if (dondevota.length == 0) {


                } else {
                    if ((dondevota[0]['id_donde_vota'] != estr[auxiescuela]['id'])) {

                        cantidad_movil += 1
                    }

                }

            }




            //////////



            ////



            let enviaraux = {
                cantidad_mesas: cantidad_mesas.length,
                cantidad_asig: cantidad_asig.length,
                id: estr[auxiescuela]['id'],
                nombre: estr[auxiescuela]['nombre'],
                circuito: estr[auxiescuela]['circuito'],
                dato1: estr[auxiescuela]['dato1'],
                dato2: estr[auxiescuela]['dato2'],
                cantidad_suplentes: cantidad_suplentes.length,
                cantidad_veg: cantidad_veg.length,
                cantidad_cel: cantidad_cel.length,
                cantidad_movil,
                suplentes_falt: lestr.length,
                cantidad_pres: cantidad_pres.length,
                cantidad_aus: cantidad_aus.length
            }
            escuelastodas.push(enviaraux)
        }


        res.json(escuelastodas)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }


})



router.get('/rechazarcapacitacionmesa/:id', async (req, res,) => {
    const id = req.params.id

    try {
        const asignacionm = await pool.query('select * from asignaciones_fiscales2 where mesa =?', [id])

        await pool.query('update asignaciones_fiscales2 set capacitado="No"  where id=?', [asignacionm[0]['id']])


        res.json('realizado con exito')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})
router.get('/rechazarcapacitacion/:id', async (req, res,) => {
    const id = req.params.id

    try {


        await pool.query('update asignaciones_fiscales2 set capacitado="No"  where id=?', [id])


        res.json('realizado con exito')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})




router.get('/Confirmarcapasupl/:id', async (req, res,) => {
    const id = req.params.id
    console.log('no')
    console.log(id)
    const asignacionm = await pool.query('select * from asignaciones_fiscales2 where mesa =?', [id])
    try {


        await pool.query('update asignaciones_fiscales set capacitado="Si"  where id=?', [asignacionm[0]['id']])


        res.json('realizado con exito')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})

router.get('/confirmarcapa/:id', async (req, res,) => {
    const id = req.params.id
    console.log('no')
    console.log(id)
    try {


        await pool.query('update asignaciones_fiscales2 set capacitado="Si"  where id=?', [id])


        res.json('realizado con exito')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})

router.get('/traerdetallesdeunaescuelatraslado/:id_escuela', async (req, res,) => {
    const { id_escuela } = req.params

    const mesass = await pool.query('select * from mesas_fiscales left join ( select mesa as mesaasig, dni, escuela as escualasig from asignaciones_fiscales2) as selec1 on mesas_fiscales.id= selec1.mesaasig  join (select dni as dnipersona, nombre as nombrepers, apellido, id_donde_vota, telefono, telefono2 from personas_fiscalizacion) as selec2 on selec1.dni=selec2.dnipersona join (select id as idesc, nombre as nombreesc, ubicacion from escuelas) as selec5 on selec2.id_donde_vota=selec5.idesc where id_escuela=? and selec1.escualasig != selec2.id_donde_vota ', [id_escuela])
    console.log(mesass)
    res.json(mesass)


})
router.get('/traerdetallesdeunaescuela/:id_escuela', async (req, res,) => {
    const { id_escuela } = req.params

    const mesass = await pool.query('select * from mesas_fiscales left join ( select mesa as mesaasig, dni,dato1,nuevo from asignaciones_fiscales2) as selec1 on mesas_fiscales.id= selec1.mesaasig  join (select dni as dnipersona, nombre as nombrepers, apellido, id_donde_vota, telefono, telefono2 from personas_fiscalizacion) as selec2 on selec1.dni=selec2.dnipersona join (select id as idesc, nombre as nombreesc from escuelas) as selec5 on selec2.id_donde_vota=selec5.idesc where id_escuela=? ', [id_escuela])

    res.json(mesass)


})

router.get('/traermesas/:id_escuela', async (req, res,) => {
    const { id_escuela } = req.params
    console.log(id_escuela)
    const mesas = await pool.query('select * from mesas_fiscales where id_escuela=?', [id_escuela])
    let evi = []
    const escuela = await pool.query('select * from escuelas where id=?', [id_escuela])
    for (mes in mesas) {
        let disponibilidad = 'Libre'
        let mesaux = await pool.query('select * from asignaciones_fiscales where mesa=? and edicion=2025', [mesas[mes]['id']])
        if (mesaux.length > 0) {
            disponibilidad = 'Ocupada'
        }
       
         
        
    /*     console.log(escuela[0]['nombre'])
        if ((escuela[0]['nombre'] == 'ESC. Nº 34 "EL SANTO DE LA ESPADA"') || (escuela[0]['nombre'] == 'COLEGIO "MANUEL VICENTE FIGUERERO"' || (escuela[0]['nombre'] == 'ESCUELA TECNICA U.O.C.R.A.'))) {
            disponibilidad = 'Ocupada'
        } */




        nuevo = {
            disponibilidad,
            id: mesas[mes]['id'],
            numero: mesas[mes]['numero'],
            id_escuela: mesas[mes]['id_escuela'],
            cantidad: mesas[mes]['cantidad'],

        }
        evi.push(nuevo)
    }


    res.json(evi)


})


router.get('/datosdemesas', async (req, res) => {
    //////  traer cantidad de mesas, mesas libres mesas ocupadas, 

    try {
        let cant = await pool.query('select * from mesas_fiscales join (select id as ides, etapa2 from escuelas) as selec on mesas_fiscales.id_escuela=selec.ides where numero != "Suplente 1" and numero != "Suplente 2" and numero != "Suplente 3" and numero != "Suplente 4" and numero != "Suplente 5" and numero != "Suplente 6" and numero != "Suplente 7"')
        console.log(cant.length)
        let asig = await pool.query('select * from asignaciones_fiscales left join (select id as idmesa, numero, id_escuela from mesas_fiscales) as selec on asignaciones_fiscales.mesa=selec.idmesa left join (select id as idescuela, etapa2 from escuelas) as selec2 on selec.id_escuela=selec2.idescuela where (numero != "Suplente 1" and numero != "Suplente 2" and numero != "Suplente 3" and numero != "Suplente 4" and numero != "Suplente 5" and numero != "Suplente 6"  and numero != "Suplente 7") and edicion=2025')
        let esc = await pool.query('select * from escuelas ')
       // let yassig = await pool.query('select * from mesas_fiscales join (select id as ide, circuito, nombre from escuelas) as sele on mesas_fiscales.id_escuela=sele.ide where circuito ="2" or nombre=? or nombre=? or nombre=? ', ['COLEGIO "MANUEL VICENTE FIGUERERO"', 'ESC. Nº 34 "EL SANTO DE LA ESPADA"', "ESCUELA TECNICA U.O.C.R.A."])
        console.log("yasig")
        let yassig = await pool.query('select * from mesas_fiscales join (select id as ide, circuito, nombre from escuelas) as sele on mesas_fiscales.id_escuela=sele.ide ')
        let capaacitados = await pool.query('select * from asignaciones_fiscales where capacitado="Si"and edicion=2025')

        console.log(yassig.length)
        let mesas_sin_asignar = []

        for (const index_mesas in cant) {
            let existe_aux = await pool.query('select * from inscripciones_fiscales where id_escuela =? and edicion=2025', [cant[index_mesas]['id']])
            if (existe_aux.length === 0) {
                mesas_sin_asignar.push(cant[index_mesas])
            }
        }


        res.json([cant.length, asig.length, cant.length - asig.length, esc.length, capaacitados.length])
    } catch (error) {
        console.log(error)
        res.send('algo salio mal')
    }


})

router.get('/estadisticasescuelas', async (req, res,) => {
    let cien = 0
    let ochenta = 0
    let cincuenta = 0
    let veinte = 0
    let menos = 0

    const escuelasrecorrido = await pool.query('select * from escuelas where etapa2="Si"')
    for (indice in escuelasrecorrido) {

        let canmesas = await pool.query('select * from mesas_fiscales where id_escuela=? ', [escuelasrecorrido[indice]['id']])
        let cantidadocup = 0
        for (indice2 in canmesas) {

            let exiss = await pool.query('select * from asignaciones_fiscales2 where mesa=? ', [canmesas[indice2]['id']])

            if (exiss.length > 0) {

                cantidadocup = cantidadocup + 1
            }
        }
    
           
            if ((cantidadocup / canmesas.length) > 0.99) {
                cien = cien + 1
                ochenta = ochenta + 1
                cincuenta = cincuenta + 1
                veinte = veinte + 1
            } else {
                if ((cantidadocup / canmesas.length) > 0.75) {
                    ochenta = ochenta + 1
                    cincuenta = cincuenta + 1
                    veinte = veinte + 1
                } else {
                    if ((cantidadocup / canmesas.length) > 0.49) {

                        cincuenta = cincuenta + 1
                        veinte = veinte + 1
                    } else {
                        if ((cantidadocup / canmesas.length) > 0.19) {


                            veinte = veinte + 1
                        } else {
                            menos += 1
                        }

                    }

                }


            }
        
    }

    res.json({ cien, ochenta, cincuenta, veinte, menos })
}


)




router.get('/estadisticas1', async (req, res,) => {
    const insc = await pool.query('select * from inscripciones_fiscales where edicion=2025')

    let Pagw = 0
    let Fly = 0
    let Amigo = 0
    let Autoin = 0
    let aliado = 0

    let celiaco = await pool.query('select * from asignaciones_fiscales join (select dni as dnip,celiaco from personas_fiscalizacion) as selec on asignaciones_fiscales.dni=selec.dnip where celiaco="Si"and edicion=2025')
    let vegano = await pool.query('select * from asignaciones_fiscales join (select dni as dnip,vegano from personas_fiscalizacion) as selec on asignaciones_fiscales.dni=selec.dnip where vegano="Si"and edicion=2025')

    let contactado = await pool.query('select * from inscripciones_fiscales where estado !="Pendiente"and edicion=2025')
    let asigna = await pool.query('select * from asignaciones_fiscales join (select id as idmesa, numero from mesas_fiscales) as selec on asignaciones_fiscales.mesa=selec.idmesa where numero != "Suplente 1" and numero != "Suplente 2" and numero != "Suplente 3" and numero != "Suplente 4" and numero != "Suplente 5"and numero != "Suplente 6"  and numero != "Suplente 7" and edicion=2025')
    let asigna2 = await pool.query('select * from asignaciones_fiscales join (select id as idmesa, numero from mesas_fiscales) as selec on asignaciones_fiscales.mesa=selec.idmesa where numero = "Suplente 1" or numero = "Suplente 2" or numero = "Suplente 3" or numero = "Suplente 4" or numero = "Suplente 5" or numero = "Suplente 6" or numero = "Suplente 7" and edicion=2025')

    let recha = await pool.query('select * from inscripciones_fiscales where estado ="Rechazado" and edicion=2025')
    let nocont = await pool.query('select * from inscripciones_fiscales where estado ="No contestado" and edicion=2025')
    let pend = await pool.query('select * from inscripciones_fiscales where estado ="Pendiente" and edicion=2025')
    for (indexx in insc) {

        switch (insc[indexx]['como_se_entero']) {
            case 'Pagina web':

                Pagw += 1
                //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
                break;
            case 'Flyer':

                Fly += 1
                //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
                break;
            case 'Amigo':

                Amigo += 1
                //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
                break;

            default:
                break;
        }
        switch (insc[indexx]['cargadopor']) {
            case 'Autoinscripcion':
                Autoin += 1
                //Declaraciones ejecutadas cuando el resultado de expresión coincide con Autoinscripcion
                break;
            case '87':
                Autoin += 1
                //Declaraciones ejecutadas cuando el resultado de expresión coincide con el 87
                break;
            case 87:
                Autoin += 1
                //Declaraciones ejecutadas cuando el resultado de expresión coincide con el valor1
                break;

            default:
                aliado += 1
                break;
        }
    }
    const respuesta = {
        cantidad: insc.length,
        pagina: Pagw,
        Fly: Fly,
        Amigo: Amigo,
        Autoinscripcion: Autoin,
        aliado: aliado,
        contactado: contactado.length,
        asigna: asigna.length,
        asigna2: asigna2.length,
        recha: recha.length,
        nocont: nocont.length,
        celiaco: celiaco.length,
        vegano: vegano.length,
        pend:pend.length

    }
    res.json(respuesta)

})




router.get('/veramigos', async (req, res,) => {
    const amigos = await pool.query('select * from inscripciones_fiscales where como_se_entero = "Amigo"')

    res.json(amigos)

})
router.get('/traerinscripcionesdeunencargado/:id', async (req, res,) => {
    const id = req.params.id
    console.log(91)
    try {
        estr = await pool.query('select * from inscripciones_fiscales  where  id_encargado =? and edicion=2025', [id])

        res.json(estr)
    } catch (error) {
        console.log(error)
        res.send(['algo salio mal'])
    }


})





router.get('/desasignarencargado/:id', async (req, res,) => {
    const id = req.params.id

    try {
        await pool.query('update inscripciones_fiscales2 set id_encargado = 0  where  id = ?', [id])


        res.json('realizado')
    } catch (error) {
        console.log(error)
        res.send(['algo salio mal'])
    }


})
router.get('/traerpaso2inscrip2/:id', async (req, res,) => {
    const id = req.params.id

    try {
        estr = await pool.query('select * from inscripciones_fiscales join (select dni as dniper,telefono, nombre as nombrepersona, apellido as apellidopersona,id_donde_vota from personas_fiscalizacion) as selec1 on inscripciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on inscripciones_fiscales.id_escuela=selec2.idescuela join (select id as idescuela2, nombre as nombreescuela2 from escuelas) as selec3 on inscripciones_fiscales.id_escuela2=selec3.idescuela2    join (select id as idescuelavota, nombre as donde_vota from escuelas) as selec4 on selec1.id_donde_vota=selec4.idescuelavota where estado="Contactado" and id_encargado =?', [id])

        console.log(estr)
        res.json(estr)
    } catch (error) {
        console.log(error)
        res.send(['algo salio mal'])
    }


})

router.get('/traerpaso2inscrip', async (req, res,) => {


    try {
        estr = await pool.query('select * from inscripciones_fiscales join (select dni as dniper,telefono, nombre as nombrepersona, apellido as apellidopersona,id_donde_vota from personas_fiscalizacion) as selec1 on inscripciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on inscripciones_fiscales.id_escuela=selec2.idescuela join (select id as idescuela2, nombre as nombreescuela2 from escuelas) as selec3 on inscripciones_fiscales.id_escuela2=selec3.idescuela2    join (select id as idescuelavota, nombre as donde_vota from escuelas) as selec4 on selec1.id_donde_vota=selec4.idescuelavota where estado="Contactado"')


        res.json(estr)
    } catch (error) {
        console.log(error)
        res.send(['algo salio mal'])
    }


})




router.get('/verfaltantesescuelassuplentes/', async (req, res,) => {


    try {

        let estr = await pool.query('select * from mesas_fiscales left join (select mesa as mesaa from asignaciones_fiscales) as selec2 on mesas_fiscales.id=selec2.mesaa join (select id as idescuela, nombre as nombre_escuela from escuelas) as selec4 on mesas_fiscales.id_escuela=selec4.idescuela  where selec2.mesaa IS NULL and (numero = "Suplente 1" or numero = "Suplente 2" or numero = "Suplente 3" or numero = "Suplente 4" or numero = "Suplente 5" or numero = "Suplente 6" or numero = "Suplente 7")')
        console.log(estr)
        res.json(estr)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }

})
/* 
router.get('/asignarsi/', async (req, res) => {
const todas = await pool.query('select * from asignaciones_fiscales2')


for (a in todas ){
    await pool.query('update asignaciones_fiscales2 set nuevo="No"  where id =?', [todas[a]['id']])

}

res.send('listo')
})
 */




router.get('/verfaltantesescuelas/', async (req, res,) => {


    try {

        let estr = await pool.query('select * from mesas_fiscales left join (select mesa as mesaa from asignaciones_fiscales where edicion=2025) as selec2 on mesas_fiscales.id=selec2.mesaa join (select id as idescuela, nombre as nombre_escuela, etapa2 from escuelas) as selec4 on mesas_fiscales.id_escuela=selec4.idescuela  where selec2.mesaa IS NULL and numero != "Suplente 1" and numero != "Suplente 2" and numero != "Suplente 3" and numero != "Suplente 4" and numero != "Suplente 5" and numero != "Suplente 6"  and numero != "Suplente 7" and etapa2="Si"')
        res.json(estr)
    } catch (error) {
        console.log(error)
        res.json(['algo salio mal'])
    }

})





router.get('/revisto/:id', async (req, res,) => {
    const id = req.params.id
    mesas = await pool.query('select * from mesas_fiscales join(select id as  idme, id_usuario from escuelas) as sele on mesas_fiscales.id_escuela=sele.idme where id_usuario=? ',[id])
    console.log(mesas)

for (aus in mesas){
    await pool.query('update asignaciones_fiscales2 set nuevo="No"  where mesa=?', [mesas[aus]['id']])
}
res.json('Visto')
})

router.get('/todaslasasignacionesdeunaescuela/:id', async (req, res,) => {
    const id = req.params.id
    console.log(id)
    try {

        estr = await pool.query('select * from asignaciones_fiscales2 join (select dni as dniper,telefono,telefono2, nombre, apellido,id as idpersona from personas_fiscalizacion) as selec1 on asignaciones_fiscales2.dni=selec1.dniper  left join (select id as idinscrip, id_encargado from inscripciones_fiscales ) as selec3 on asignaciones_fiscales2.id_inscripcion=selec3.idinscrip left join (select id as idmesa, numero, id_escuela as idescc from mesas_fiscales) as sele on asignaciones_fiscales2.mesa=sele.idmesa left join (select id as idescuela, nombre as nombreescuela,id_usuario from escuelas) as selec2 on sele.idescc=selec2.idescuela where  id_usuario =? order by numero', [id])

        cant = await pool.query('select * from mesas_fiscales join (select id_usuario, id as idescuela from escuelas) as sele on mesas_fiscales.id_escuela=sele.idescuela where id_usuario=? and numero not in ("Suplente 1","Suplente 2","Suplente 3","Suplente 4","Suplente 5","Suplente 6","Suplente 7")',[id])
const esc =  await pool.query('select * from asignaciones_fiscales2 join (select dni as dniper,telefono,telefono2, nombre, apellido,id as idpersona from personas_fiscalizacion) as selec1 on asignaciones_fiscales2.dni=selec1.dniper  left join (select id as idinscrip, id_encargado from inscripciones_fiscales ) as selec3 on asignaciones_fiscales2.id_inscripcion=selec3.idinscrip left join (select id as idmesa, numero, id_escuela as idescc from mesas_fiscales) as sele on asignaciones_fiscales2.mesa=sele.idmesa left join (select id as idescuela, nombre as nombreescuela,id_usuario from escuelas) as selec2 on sele.idescc=selec2.idescuela where  id_usuario =? and nuevo="Si"', [id])




supl = await pool.query('select * from asignaciones_fiscales2 join (select dni as dniper,telefono,telefono2, nombre, apellido,id as idpersona from personas_fiscalizacion) as selec1 on asignaciones_fiscales2.dni=selec1.dniper  left join (select id as idinscrip, id_encargado from inscripciones_fiscales ) as selec3 on asignaciones_fiscales2.id_inscripcion=selec3.idinscrip left join (select id as idmesa, numero, id_escuela as idescc from mesas_fiscales) as sele on asignaciones_fiscales2.mesa=sele.idmesa left join (select id as idescuela, nombre as nombreescuela,id_usuario from escuelas) as selec2 on sele.idescc=selec2.idescuela where  id_usuario =? and numero in ("Suplente 1","Suplente 2","Suplente 3","Suplente 4","Suplente 5","Suplente 6","Suplente 7")', [id])

        res.json([estr,cant.length,supl.length,esc.length])
    } catch (error) {
        console.log(error)
        res.send('algo salio mal')
    }


})

router.get('/traerasistenciasporescuela/', async (req, res,) => {

    try {

        estr = await pool.query('select * from escuelas ')
        let enviar = []
        for (auxipres in estr) {

            let pres = await pool.query(`select * from asignaciones_fiscales join (select id as id_mesa, id_escuela from mesas_fiscales) as selec1 on asignaciones_fiscales.mesa=selec1.id_mesa join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on selec1.id_escuela=selec2.idescuela where idescuela=? and dato1="Si" `, [estr[auxipres]['id']])
            let aus = await pool.query(`select * from asignaciones_fiscales join (select id as id_mesa, id_escuela from mesas_fiscales) as selec1 on asignaciones_fiscales.mesa=selec1.id_mesa join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on selec1.id_escuela=selec2.idescuela where idescuela=? and dato1="No" `, [estr[auxipres]['id']])
            let sd = await pool.query(`select * from asignaciones_fiscales join (select id as id_mesa, id_escuela from mesas_fiscales) as selec1 on asignaciones_fiscales.mesa=selec1.id_mesa join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on selec1.id_escuela=selec2.idescuela where idescuela=? and dato1 is null `, [estr[auxipres]['id']])
            let cantidad_mesas = await pool.query('select * from mesas_fiscales where id_escuela=?', [estr[auxipres][`id`]])
            let cantidad_supl = await pool.query('select * from mesas_fiscales where id_escuela=? and numero in ("Suplente 1","Suplente 2","Suplente 3","Suplente 4","Suplente 5","Suplente 6","Suplente 7")', [estr[auxipres][`id`]])

            console.log(cantidad_mesas.length)
            let nuevo_escuela = {
                presentes: pres.length,
                nombre: estr[auxipres][`nombre`],
                ausentes: aus.length,
                sin_det: sd.length,
                cantidad_mesas: cantidad_mesas.length,
                cantidad_supl: cantidad_supl.length
            }
            enviar.push(nuevo_escuela)
        }

        res.json(enviar)
    } catch (error) {
        console.log(error)
        res.send('algo salio mal')
    }


})


router.get('/todaslasasignacionesdeun/:id', async (req, res,) => {
    const id = req.params.id

    try {
        estr = await pool.query('select * from asignaciones_fiscales join (select dni as dniper,telefono, nombre, apellido,id as idpersona from personas_fiscalizacion) as selec1 on asignaciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on asignaciones_fiscales.escuela=selec2.idescuela join (select id as idinscrip, id_encargado from inscripciones_fiscales ) as selec3 on asignaciones_fiscales.id_inscripcion=selec3.idinscrip join (select id as idmesa, numero from mesas_fiscales) as sele on asignaciones_fiscales.mesa=sele.idmesa where id_encargado =? ', [id])

        res.json([estr])
    } catch (error) {
        res.send('algo salio mal')
    }


})





router.get('/checksuplente/:id', async (req, res,) => {
    const id = req.params.id
    try {



        const asignacion = await pool.query('select * from asignaciones_fiscales where mesa =? ', [id])
        console.log(asignacion)
        if (asignacion[0]['checkk'] == null || asignacion[0]['checkk'] == 'No') {
            await pool.query('update asignaciones_fiscales set checkk="Si"  where mesa=?', [id])

        } else {
            console.log('no')
            await pool.query('update asignaciones_fiscales set checkk="No"  where mesa=?', [id])
        }
        res.json('realizado')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})

router.get('/contactada/:id', async (req, res,) => {
    const id = req.params.id
    try {
        const asignacion = await pool.query('select * from asignaciones_fiscales2 where id =? ', [id])
        if (asignacion[0]['dato1'] == null || asignacion[0]['dato1'] == 'No') {
            await pool.query('update asignaciones_fiscales2 set dato1="Si"  where id=?', [id])

        } else {
            console.log('no')
            await pool.query('update asignaciones_fiscales2 set dato1="No"  where id=?', [id])
        }
        res.json('realizado')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})


router.get('/contactada2/:id', async (req, res,) => {
    const id = req.params.id
    try {
        const asignacion = await pool.query('select * from asignaciones_fiscales where id =? ', [id])
        if (asignacion[0]['checkk'] == null || asignacion[0]['checkk'] == 'No') {
            await pool.query('update asignaciones_fiscales set checkk="Si"  where id=?', [id])

        } else {
            console.log('no')
            await pool.query('update asignaciones_fiscales set checkk="No"  where id=?', [id])
        }
        res.json('realizado')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})
router.get('/listadecircuitos/', async (req, res,) => {
    const id = req.params.id
    try {
        const Circuitos = await pool.query('select circuito  from escuelas group by circuito ')
      let Respuesta = []

      for (circ in Circuitos){

        let cantidad_datos =  await pool.query('select * from inscripciones_fiscales2 join (select id as id_esc, circuito from escuelas) as selec on inscripciones_fiscales2.id_escuela = selec.id_esc  where circuito=?',[Circuitos[circ]['circuito']])
        let cantidad_mesas =  await pool.query('select * from mesas_fiscales join (select id as id_e, circuito from escuelas) as selec on mesas_fiscales.id_escuela=selec.id_e where circuito = ? and numero not in ("Suplente 1","Suplente 2","Suplente 3","Suplente 4","Suplente 5","Suplente 6","Suplente 7","Suplente 8","Suplente 9")',[Circuitos[circ]['circuito']])
        let env_a = {
            circuito:Circuitos[circ]['circuito'],
            cantidad:cantidad_datos.length,
            cantidad_m:cantidad_mesas.length,
            dif:cantidad_mesas.length-cantidad_datos.length,
            porc:cantidad_datos.length/cantidad_mesas.length*100
        }
        Respuesta.push(env_a)
      }



        res.json(Respuesta)
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})
/* router.get('/determinardecero', async (req, res) => {

    try {
        await pool.query('update asignaciones_fiscales set dato1="No"')

        res.send('re si')
    } catch (error) {
        console.log(error)
        res.send('re no')
    }
    
})
 */






router.get('/todaslasasignaciones22/:id', async (req, res,) => {
const id = req.params.id

    try {
        estr = await pool.query('select * from asignaciones_fiscales join (select dni as dniper,telefono, nombre, apellido,id as idpersona from personas_fiscalizacion) as selec1 on asignaciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on asignaciones_fiscales.escuela=selec2.idescuela join (select id as idinscrip, id_encargado from inscripciones_fiscales where edicion=2025 ) as selec3 on asignaciones_fiscales.id_inscripcion=selec3.idinscrip join (select id as idmesa, numero from mesas_fiscales) as sele on asignaciones_fiscales.mesa=sele.idmesa where id_encargado =? and edicion=2025 ', [id])

        res.json([estr])
    } catch (error) {
        console.log(error)
        res.send('algo salio mal')
    }


})

router.get('/todaslasasignaciones2', async (req, res,) => {


    try {
        estr = await pool.query('select * from asignaciones_fiscales join (select dni as dniper,telefono, nombre, apellido,id as idpersona, id_donde_vota from personas_fiscalizacion) as selec1 on asignaciones_fiscales.dni=selec1.dniper  join (select id as idmesa, numero, id_escuela as idescuelamesa from mesas_fiscales) as sele on asignaciones_fiscales.mesa=sele.idmesa join (select id as id_auxesc,nombre as nombredondevota from escuelas ) as selec3 on selec1.id_donde_vota=selec3.id_auxesc join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on sele.idescuelamesa=selec2.idescuela where asignaciones_fiscales.edicion=2025')

        res.json([estr])
    } catch (error) {
        console.log(error)
        res.send('algo salio mal')
    }


})

router.get('/todaslasasignaciones', async (req, res,) => {


    try {
        estr = await pool.query('select * from asignaciones_fiscales join (select dni as dniper,telefono, nombre, apellido,id as idpersona, id_donde_vota from personas_fiscalizacion) as selec1 on asignaciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on asignaciones_fiscales.escuela=selec2.idescuela join (select id as idmesa, numero from mesas_fiscales) as sele on asignaciones_fiscales.mesa=sele.idmesa join (select id as id_auxesc,nombre as nombredondevota from escuelas ) as selec3 on selec1.id_donde_vota=selec3.id_auxesc left join (select dni as dni2 from inscripciones_fiscales2) as selectaux on asignaciones_fiscales.dni=selectaux.dni2')

        res.json([estr])
    } catch (error) {
        console.log(error)
        res.send('algo salio mal')
    }


})

router.get('/asignarautolasetc', async (req, res,) => {

    const asignaciones = await pool.query('select * from asignaciones_fiscales')

    for (asignacion in asignaciones) {
        let se_encuentra = await pool.query('select * from inscripciones_fiscales2 where dni =?', [asignaciones[asignacion]['dni']])
        if (se_encuentra.length > 0) {
            console.log('ya esta')
        } else {
            fecha_carga=(new Date(Date.now())).toLocaleDateString()
            if (asignaciones[asignacion]['dato1'] == "Si") {
                let donde = await pool.query('select * from personas_fiscalizacion where dni =?', [asignaciones[asignacion]['dni']])
                if (asignaciones[asignacion]['escuela'] == donde[0]['id_donde_vota']) {/////redundante
                    await pool.query('insert into inscripciones_fiscales2 set dni=?, id_escuela=? ,nombre=?,apellido=?,fecha_carga=? ', [asignaciones[asignacion]['dni'], asignaciones[asignacion]['escuela'], donde[0]['nombre'], donde[0]['apellido'],fecha_carga])
                }else {
                    
                    await pool.query('insert into inscripciones_fiscales2 set dni=?, id_escuela=? ,nombre=?,apellido=?,fecha_carga=?', [asignaciones[asignacion]['dni'], asignaciones[asignacion]['escuela'], donde[0]['nombre'], donde[0]['apellido'],fecha_carga])
                    await pool.query('insert into observaciones set id_ref=?, fecha=? ,detalle=? ', [asignaciones[asignacion]['dni'], fecha_carga, 'Fiscalizo enescuela distinta'])
                }
            }
        }
    }
res.json('ok')

})

router.get('/asignarautolasetc2', async (req, res,) => {

    const asignaciones = await pool.query('select * from asignaciones_fiscales')

    for (asignacion in asignaciones) {
      try {
        
    
       
      
            fecha_carga=(new Date(Date.now())).toLocaleDateString()
         
                let donde = await pool.query('select * from personas_fiscalizacion where dni =?', [asignaciones[asignacion]['dni']])
                if (asignaciones[asignacion]['escuela'] == donde[0]['id_donde_vota']) {/////redundante
                   // await pool.query('update inscripciones_fiscales2 set    where id=?', [ observaciones,id_inscripcion])
                console.log('misma')
                }else {
                    
                    await pool.query('update inscripciones_fiscales2 set  id_escuela=?, id_escuela2=? where dni=?', [ donde[0]['id_donde_vota'],asignaciones[asignacion]['escuela'],donde[0]['dni']])
                    console.log('cambio '+donde[0]['dni']+' '+donde[0]['id_donde_vota'])
                }
            } catch (error) {
        
            }
        
    }
res.json('ok')

})


router.get('/todaspaso42/:id', async (req, res,) => {
const id = req.params.id
    //  estr = await pool.query('select * from asignaciones_fiscales join (select dni as dniper,telefono, nombre, apellido,id as idpersona, id_donde_vota from personas_fiscalizacion) as selec1 on asignaciones_fiscales.dni=selec1.dniper join (select id as idescuela, nombre as nombreescuela from escuelas) as selec2 on asignaciones_fiscales.escuela=selec2.idescuela join (select id as idmesa, numero from mesas_fiscales) as sele on asignaciones_fiscales.mesa=sele.idmesa join (select id as id_auxesc,nombre as nombredondevota from escuelas ) as selec3 on selec1.id_donde_vota=selec3.id_auxesc ')

   //  estr = await pool.query('select * from inscripciones_fiscales2 left join (select dni as dniper,telefono,id as idpersona, id_donde_vota from personas_fiscalizacion) as selec1 on inscripciones_fiscales2.dni=selec1.dniper   left join (select id_ref, detalle from observaciones) as selec4 on inscripciones_fiscales2.dni = id_ref left join (select id as  id_es, nombre as donde_vota from escuelas) as selec5 on selec1.id_donde_vota = selec5.id_es  left join (select id as idant,escuela as id_don from asignaciones_fiscales) as selec6 on inscripciones_fiscales2.dni=selec6.idant left join (select id as idescant, nombre as dondefiscal from escuelas) as selec7 on selec6.id_don=selec7.idescant where id_encargado=?',[id])
     estr = await pool.query('select * from inscripciones_fiscales left join (select id as idper, dni as dniper,telefono,id as idpersona, id_donde_vota from personas_fiscalizacion) as selec1 on inscripciones_fiscales.dni=selec1.dniper   left join (select id as  id_es, nombre as donde_vota, etapa2 from escuelas) as selec5 on selec1.id_donde_vota = selec5.id_es  left join (select id as idant,escuela as id_don from asignaciones_fiscales) as selec6 on inscripciones_fiscales.dni=selec6.idant left join (select id as idescant, nombre as dondefiscal from escuelas) as selec7 on selec6.id_don=selec7.idescant where id_encargado=? and edicion=2025',[id])


     //const tod = await pool.query('select * from inscripciones_fiscales2 join (select id as idp from personas )as selec on ')
  res.json([estr])
  
  })     

  
router.get('/todaspaso4', async (req, res,) => {

   estr = await pool.query('select * from inscripciones_fiscales2 left join (select id as idpers, dni as dniper,telefono,id as idpersona, id_donde_vota, nombre as nombree from personas_fiscalizacion) as selec1 on inscripciones_fiscales2.dni=selec1.dniper  left join (select id as  id_es, nombre as donde_vota, etapa2,circuito from escuelas) as selec5 on selec1.id_donde_vota = selec5.id_es  left join (select id as idant,escuela as id_don from asignaciones_fiscales) as selec6 on inscripciones_fiscales2.dni=selec6.idant left join (select id as idescant, nombre as dondefiscal from escuelas) as selec7 on selec6.id_don=selec7.idescant left join (select id as idencar, nombre as nombrequienllama from usuarios) as sele8 on inscripciones_fiscales2.id_encargado=sele8.idencar left join (select dni as idasig, mesa as mesaasig from asignaciones_fiscales2) as selec90 on inscripciones_fiscales2.dni=selec90.idasig left join (select id as idm, id_escuela as id_escuelaaa from mesas_fiscales) as selec91 on selec90.mesaasig=selec91.idm left join (select id as idescuelaultimo,nombre as nombrevota from escuelas) as selec92 on selec91.id_escuelaaa=selec92.idescuelaultimo ')
console.log(estr.length)
estr2 = await pool.query('select * from inscripciones_fiscales2')
console.log(estr2.length)

res.json([estr])

})



router.post("/modificardondevota", async (req, res) => {
    const { id_donde_vota,id } = req.body
try {

    console.log(id_donde_vota)
    console.log(id)
 await pool.query('update personas_fiscalizacion set id_donde_vota=? where id=?  ', [id_donde_vota, id])
    res.json('realizado')
} catch (error) {
    console.log(error)
    res.json('error')
}

 
})

router.post("/guardarmapa", async (req, res) => {
    const { seleccion,id } = req.body
try {


 await pool.query('update escuelas set mapa1=? where id=?  ', [seleccion, id])
    res.json('realizado')
} catch (error) {
    console.log(error)
    res.json('error')
}

 
})



router.post("/enviarobservacionnueva", async (req, res) => {
    const { id,detalle } = req.body
try {
    await pool.query('insert into observaciones set detalle=?, id_ref=?  ', [detalle, id])
    res.json('realizado')
} catch (error) {
    console.log(error)
    res.json('error')
}

 
})
router.post("/rechazarincrip", async (req, res) => {
    let { id_inscripcion, observaciones, id_donde_vota, dni } = req.body

    try {
        if (dni == undefined) {
            dni = "Sin definir"
        }

        exi = await pool.query('select * from personas_fiscalizacion where dni =?', [dni])
        //  await pool.query('update inscripciones_fiscales set estado="Pendiente" and observaciones = ? where id=?', [ observaciones,id_inscripcion])
        await pool.query('update inscripciones_fiscales set estado="Rechazado", observaciones = ? where  id = ?', [observaciones, id_inscripcion])



        res.json("Rechazado")
    } catch (error) {
        console.log(error)
        res.json("Error")
    }

})


router.post("/modificarpersonafisca", async (req, res) => {
    let { id, dni, nombre, apellido, celiaco, vegano, movilidad, domicilio, telefono, telefono2 } = req.body
    console.log(id, dni, nombre, apellido, celiaco, vegano, movilidad, domicilio, telefono, telefono2)
    if (movilidad == undefined) {
        movilidad = 'sin definir'
    }
    if (domicilio == undefined) {
        domicilio = 'sin definir'
    }
    if (telefono == undefined) {
        telefono = 'sin definir'
    }
    if (telefono2 == undefined) {
        telefono2 = 'sin definir'
    }
    if (vegano == undefined) {
        vegano = 'sin definir'
    }
    if (celiaco == undefined) {
        celiaco = 'sin definir'
    }

    try {
        await pool.query('update personas_fiscalizacion set  dni=?, nombre=?, apellido=?, celiaco=?, vegano=?, movilidad=?, domicilio=?,telefono=?,telefono2=? where  id = ?', [dni, nombre, apellido, celiaco, vegano, movilidad, domicilio, telefono, telefono2, id])
        console.log('realizado')
        res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')

    }


})


router.post("/volverapaso1", async (req, res) => {
    let { id } = req.body

    try {
        await pool.query('update inscripciones_fiscales set estado="Pendiente" where  id = ?', [id])
        res.json("Modificado")
    } catch (error) {
        console.log(error)
        res.json("No modificado")
    }

})



router.post("/asignarcircuitos", async (req, res) => {
    let { id, inscrip } = req.body


    for (ins in inscrip) {

        console.log(ins)

        await pool.query('update escuelas set etapa2 =?  where  circuito= ?', ["Si", inscrip[ins]])
    }
    res.json('realizado')

})


router.post("/asignarinscripciones", async (req, res) => {
    let { id, inscrip } = req.body


    for (ins in inscrip) {

        console.log(ins)

        await pool.query('update inscripciones_fiscales2 set id_encargado =?  where  id = ?', [id, inscrip[ins]])
    }
    res.json('realizado')

})



router.post("/modificarestadodeinscrip", async (req, res) => {
    let { id, estado, observaciones } = req.body

    try {
        console.log(estado)
        await pool.query('update inscripciones_fiscales set estado =?  where  id = ?', [estado, id])
if (observaciones!= undefined){
    const ins =  await pool.query('select * from inscripciones_fiscales where id =?', [id])
    await pool.query('insert into observaciones set detalle=?,id_ref=? ', [observaciones, ins[0]['dni']])
}

        res.json('Cambiado el estado')
    } catch (error) {
        console.log(error)
        res.json('error')
    }
})

router.post("/modificarobservaciones", async (req, res) => {
    let { id, observaciones } = req.body

    try {
        await pool.query('update inscripciones_fiscales set observaciones =?  where  id = ?', [observaciones, id])
        res.json('Cambiada las observaciones')
    } catch (error) {
        console.log(error)
        res.json('error')
    }
})

router.post("/crearescuela", async (req, res) => {
    let { nombre, circuito, observacion } = req.body

    if (observacion === undefined) {

        observacion = "Ninguna"
    }
    try {
        await pool.query('insert into escuelas set nombre=?, circuito=? ,observacion=? ', [nombre, circuito, observacion])
        res.json("Cargado")
    } catch (error) {
        console.log(error)
        res.json("No Cargado")
    }

})




router.post("/borrarmesa", async (req, res) => {
    let { id } = req.body
    try {
        await pool.query('delete  from  mesas_fiscales where id = ?', [id])
        res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('Realizado')
    }


})


router.post("/traerestadisticasdeescuelas", async (req, res) => {
    let { id1, id2 } = req.body

    if (id2 == undefined) {
        id2 = 1
    }

    const total = await pool.query('select sum(cantidad) from mesas_fiscales ')
    const escuelas = await pool.query('select * from escuelas ')
    const escuelas_1 = await pool.query('select * from escuelas where id=?', [id1])
    const promedio = await pool.query('select AVG(cantidad), id_escuela from mesas_fiscales group by id_escuela')
    ///total es la cantidad
    ////
    const cantid1 = await pool.query('select sum(cantidad) from mesas_fiscales where id_escuela=?', [id1])

    const cantid2 = await pool.query('select sum(cantidad) from mesas_fiscales where id_escuela=?', [id2])

    const mesas = await pool.query('select * from mesas_fiscales where id_escuela=? ', [id1])

    const suplentes = await pool.query('select * from mesas_fiscales where id_escuela=? and (numero = "Suplente 1" or numero = "Suplente 2" or numero = "Suplente 3" or numero = "Suplente 4" or numero = "Suplente 5" or numero = "Suplente 6" or numero = "Suplente 7")', [id1])
    let libres = 0

        for (mesa in mesas) {
            let auxcont = await pool.query('select * from asignaciones_fiscales2  where mesa=? ', [mesas[mesa]['id']])

            if (auxcont.length == 0) {
                console.log(mesas[mesa]['numero'])
                libres += 1
            }
        }

    

    let cantidad_escuela1 = 0
    let cantidad_escuela2 = 0
    if (cantid1.length > 0) {
        cantidad_escuela1 = cantid1[0]['sum(cantidad)']
    }
    if (cantid2.length > 0) {
        cantidad_escuela2 = cantid2[0]['sum(cantidad)']
    }

    // const cant1 = await pool.query('select * from mesas_fiscales where id_escuela=?', [id1])
    //  const cant2 = await pool.query('select * from mesas_fiscales where id_escuela=?', [id2])
    const datos_escuelas = {
        cantidad_escuela1,
        cantidad_escuela2,
        prom: total[0]['sum(cantidad)'] / escuelas.length,
        mesas: mesas.length,
        libres: libres,
        Encargado: escuelas_1[0]['dato1'],
        ubicacion: escuelas_1[0]['ubicacion'],
        tel: escuelas_1[0]['dato2'],
        suplentes: suplentes.length,
    }

    res.json(datos_escuelas)

    // mostrar  cuantas mesas tiene, cuantas ya se asignaron 


})


router.post("/modificardatosdemesa", async (req, res) => {
    let { numero, id, id_escuela } = req.body
    try {
        await pool.query('update mesas_fiscales set numero=?, id_escuela =? where  id = ?', [numero, id_escuela, id])
        res.json("Modificado")
    } catch (error) {
        console.log(error)
        res.json("No modificado")
    }

})


router.post("/modificarescuelaubicacion", async (req, res) => {
    let { ubicacion, id } = req.body


    try {

        await pool.query('update escuelas set ubicacion=? where  id = ?', [ubicacion, id])
        res.json("Modificado")
    } catch (error) {
        console.log(error)
        res.json("No modificado")
    }

})

router.post("/modificarescuela", async (req, res) => {
    let { nombre, circuito, id, dato1, dato2 } = req.body


    try {
        if (dato1 == undefined) {
            dato1 = "Sin definir"
        }
        if (dato2 == undefined) {
            dato1 = "Sin definir"
        }
        await pool.query('update escuelas set nombre=?, circuito =?,dato1=? ,dato2=? where  id = ?', [nombre, circuito, dato1, dato2, id])
        res.json("Modificado")
    } catch (error) {
        console.log(error)
        res.json("No modificado")
    }

})


router.post("/borrarescuela", async (req, res) => {
    let { decision, id, id_escuela } = req.body
    console.log(decision)
    console.log(id)
    console.log(id_escuela)


    await pool.query('delete  from  escuelas where id = ?', [id])

    res.json('Realizado')




})




router.post("/enviarinscripcionadmin", async (req, res) => {
    let { dni, como_se_entero, nombre_referido, apellido_referido, nombre, telefono, telefono2, apellido, id_aliado } = req.body


    try {
        ///////
        if (dni == undefined) {
            dni = 'Sin definir'
        }
        if (apellido_referido == undefined) {
            apellido_referido = 'Sin definir'
        }

        existe = await pool.query('select * from personas_fiscalizacion where dni = ? ', [dni])
     
        if (id_aliado == undefined) {
            id_aliado = 'Autoinscripcion'
        }

        if (como_se_entero == undefined) {
            como_se_entero = 'Sin definir'
        }


        if (apellido === undefined) {
            apellido = 'No brinda'
        }
        if (nombre_referido == undefined) {
            nombre_referido = 'Sin definir'
        }
        if (existe.length === 0 || dni == "Sin definir") {//////si existe la personas


            ///crear nueva persona 


            if (telefono === undefined) {
                telefono = 'No'
            }
            if (telefono2 === undefined) {
                telefono2 = 'No'
            }



            await pool.query('INSERT INTO personas_fiscalizacion set nombre=?,apellido =?,telefono=?,telefono2=?,dni=?', [nombre, apellido, telefono, telefono2, dni]);
        }
        /////////¿Actualmente  se encuentra estudiando? actividad adicional
        /////////////Tipo de empleo


        let telefonoregistrado = await pool.query('select * from inscripciones_fiscales join (select dni as dni_pers, telefono, telefono2 from personas_fiscalizacion) as selec on inscripciones_fiscales.dni = selec.dni_pers where  telefono=? ', [telefono])
        if (telefonoregistrado.length > 0 && dni != "Sin definir") {
            let dnicodif = telefonoregistrado[0]['dni']
            dnicodif = '****' + dnicodif[dnicodif.length - 3] + dnicodif[dnicodif.length - 2] + dnicodif[dnicodif.length - 1]
            res.json('Error ya se posee ese numero de telefono, pertenece a ' + dnicodif)
        } else {
            let exisinscrip = await pool.query('select * from inscripciones_fiscales where  dni=? and edicion=2025 ', [dni])
console.log(exisinscrip)
            if (exisinscrip.length > 0 && dni != "Sin definir") {
                res.json('Error fiscal ya inscripto')
            } else {

                await pool.query('INSERT INTO inscripciones_fiscales set  nombre=?,apellido=?, dni=?, cargadopor=?, fecha_carga=?,como_se_entero=?,apellido_referido=?,nombre_referido=?,edicion=2025', [nombre, apellido, dni, id_aliado, (new Date(Date.now())).toLocaleDateString(), como_se_entero, apellido_referido, nombre_referido])
                res.json('inscripto correctamente, muchas gracias por completar, por favor aguarda en unos dias nos comunicaremos al numero de telefono registrado')
            }
        }




    } catch (e) {
        console.log(e)
        res.json('Error, algo sucedio')
    }



})





router.post("/buscarestadopordni", async (req, res) => {
    let { dni, edicion } = req.body
    try {

        if (edicion == "junio"){
        let asi = await pool.query('select * from inscripciones_fiscales left join (select  id as idasig, dni as dniasig,mesa, dato1 as presente from asignaciones_fiscales ) as selec on inscripciones_fiscales.dni = selec.dniasig  left join (select id as idmesa, numero,id_escuela as id_esc  from mesas_fiscales) as selec2 on selec.mesa=selec2.idmesa left join (select id as idesc, nombre as nombreesc from escuelas) as selec3 on selec2.id_esc=selec3.idesc    where dni like ?', ['%' + dni + '%'])
        res.json(asi)
        }else{
            let asi = await pool.query('select * from inscripciones_fiscales2 left join (select  id as idasig, dni as dniasig,mesa, dato1 as presente from asignaciones_fiscales2 ) as selec on inscripciones_fiscales2.dni = selec.dniasig  left join (select id as idmesa, numero,id_escuela as id_esc  from mesas_fiscales) as selec2 on selec.mesa=selec2.idmesa left join (select id as idesc, nombre as nombreesc from escuelas) as selec3 on selec2.id_esc=selec3.idesc    where dni like ?', ['%' + dni + '%'])
            res.json(asi)
        }


    } catch (error) {
        console.log(error)
        res.json([{ nombre: 'error' }])
    }





})

router.post("/buscarestadopornombre", async (req, res) => {
    let { nombre, edicion } = req.body
    try {

        if (edicion =="junio"){
        const asi = await pool.query('select * from inscripciones_fiscales left join (select  id as idasig, dni as dniasig,mesa, dato1 as presente from asignaciones_fiscales ) as selec on inscripciones_fiscales.dni = selec.dniasig left join (select id as idmesa, numero, id_escuela as id_esc from mesas_fiscales) as selec2 on selec.mesa=selec2.idmesa left join (select id as idesc, nombre as nombreesc from escuelas) as selec3 on selec2.id_esc=selec3.idesc   where nombre like ? or apellido like ?', ['%' + nombre + '%', '%' + nombre + '%'])

        res.json(asi)}else {
            const asi = await pool.query('select * from inscripciones_fiscales2 left join (select  id as idasig, dni as dniasig,mesa, dato1 as presente from asignaciones_fiscales2 ) as selec on inscripciones_fiscales2.dni = selec.dniasig left join (select id as idmesa, numero, id_escuela as id_esc from mesas_fiscales) as selec2 on selec.mesa=selec2.idmesa left join (select id as idesc, nombre as nombreesc from escuelas) as selec3 on selec2.id_esc=selec3.idesc   where nombre like ? or apellido like ?', ['%' + nombre + '%', '%' + nombre + '%'])

        res.json(asi)
        }


    } catch (error) {
        console.log(error)
        res.json([{ nombre: 'error' }])
    }
})

router.post("/modificarmesa", async (req, res) => {
    let { id, cantidad } = req.body
    console.log(cantidad)
    try {
        await pool.query('update mesas_fiscales set cantidad=?  where id=?', [cantidad, id])
        res.json('Realizado')
    } catch (error) {
        console.log(error)
        res.json('No Realizado')
    }

})







router.post("/enviarinscripcioninterna", async (req, res) => {
    let { dni, como_se_entero, nombre_referido, apellido_referido, nombre, telefono, telefono2, apellido, id_aliado, asignado_ant, referente, funcion } = req.body

    try {
    
        ///////

        existe = await pool.query('select * from personas_fiscalizacion where dni = ?', [dni])
        let nombre_aliado = ''
        if (id_aliado == undefined) {
            id_aliado = 'Autoinscripcion'
        }
        if (como_se_entero == undefined) {
            como_se_entero = 'Sin definir'
        }
        if (apellido_referido == undefined) {
            apellido_referido = 'Sin definir'
        }

        if (nombre_referido == undefined) {
            nombre_referido = 'Sin definir'
        }
        if (existe.length === 0) {//////si existe la personas


            ///crear nueva persona 

            if (nombre === undefined) {
                nombre = 'No'
            }

            if (telefono === undefined) {
                telefono = 'No'
            }
            if (telefono2 === undefined) {
                telefono2 = 'No'
            }



            await pool.query('INSERT INTO personas_fiscalizacion set nombre=?,apellido =?,telefono=?,telefono2=?,dni=?', [nombre, apellido, telefono, telefono2, dni]);
        }
        /////////¿Actualmente  se encuentra estudiando? actividad adicional
        /////////////Tipo de empleo


        let telefonoregistrado = await pool.query('select * from inscripciones_fiscales join (select dni as dni_pers, telefono, telefono2 from personas_fiscalizacion) as selec on inscripciones_fiscales.dni = selec.dni_pers where  telefono = ? and edicion=2025 ', [telefono])
        if (telefonoregistrado.length > 0) {
            let dnicodif = telefonoregistrado[0]['dni']
            dnicodif = '****' + dnicodif[dnicodif.length - 3] + dnicodif[dnicodif.length - 2] + dnicodif[dnicodif.length - 1]
            res.json('Error ya se posee ese numero de telefono, pertenece a ' + dnicodif)
        } else {
            let exisinscrip = await pool.query('select * from inscripciones_fiscales where  dni=? and edicion=2025 ', [dni])

            if (exisinscrip.length > 0) {
                res.json('Error fiscal ya inscripto')
            } else {
                /// verificar si relamente estba isncripto
                let participante_antt = await pool.query('select * from inscripciones_fiscales where  dni=? ', [dni])
                letparticipante_ant = 'No'
                if (participante_antt.length > 0) {
                    participante_ant = 'Si'

                }
                let asignadoo = await pool.query('select * from asignaciones_fiscales where  dni=? ', [dni])


                if (asignado_ant == 'Si' && asignadoo.length == 0) {
                    let detalle = 'Selecciono que fiscalizo pero no se encuentra en la lista'
                    await pool.query('INSERT INTO observaciones set detalle=?,id_ref=?', [detalle, dni]);



                }
                let press = 'Sin definir'
                if (asignadoo.length > 0) {
                    press = asignadoo[0]['dato1']

                }

                await pool.query('INSERT INTO inscripciones_fiscales set  nombre=?,apellido=?, dni=?, cargadopor=?, fecha_carga=?,como_se_entero=?,apellido_referido=?,nombre_referido=?,edicion=2025,referente=?,funcion=?', [nombre, apellido, dni, id_aliado, (new Date(Date.now())).toLocaleDateString(), como_se_entero, apellido_referido, nombre_referido,referente,funcion])
                res.json('Recibimos tu insctipción. Pronto nos ponemos en contacto con vos. Gracias!')
            }
        }




    } catch (e) {
        console.log(e)
        res.json('Error, algo sucedio')
    }



})

router.post("/enviarinscripcion", async (req, res) => {
    let { dni, como_se_entero, nombre_referido, apellido_referido, nombre, telefono, telefono2, apellido, id_aliado, asignado_ant } = req.body;

    try {
        let id_persona = null;

        // Verificar si ya existe la persona
        const existe = await pool.query('SELECT * FROM personas_fiscalizacion WHERE dni = ?', [dni]);

        if (id_aliado == undefined) id_aliado = 'Autoinscripcion';
        if (como_se_entero == undefined) como_se_entero = 'Sin definir';
        if (apellido_referido == undefined) apellido_referido = 'Sin definir';
        if (nombre_referido == undefined) nombre_referido = 'Sin definir';

        if (existe.length === 0) {
            if (nombre === undefined) nombre = 'No';
            if (telefono === undefined) telefono = 'No';
            if (telefono2 === undefined) telefono2 = 'No';

            // Crear nueva persona y guardar el insertId
            const result = await pool.query('INSERT INTO personas_fiscalizacion (nombre, apellido, telefono, telefono2, dni) VALUES (?, ?, ?, ?, ?)', [nombre, apellido, telefono, telefono2, dni]);
            id_persona = result.insertId;
        } else {
            // Persona ya existe, tomar el id
            id_persona = existe[0].id;
            try {
                  await pool.query(
                'UPDATE personas_fiscalizacion SET nombre = ?, apellido = ?,telefono=?  WHERE id = ?',
                [nombre, apellido, telefono,id_persona]
            );
            } catch (error) {
                console.error('Error al obtener el id de la persona:', error);
            }
        }

        const telefonoregistrado = await pool.query('SELECT * FROM inscripciones_fiscales JOIN (SELECT dni AS dni_pers, telefono, telefono2 FROM personas_fiscalizacion) AS selec ON inscripciones_fiscales.dni = selec.dni_pers WHERE telefono = ? AND edicion = 2025', [telefono]);

        if (telefonoregistrado.length > 0) {
            let dnicodif = telefonoregistrado[0]['dni'];
            dnicodif = '****' + dnicodif[dnicodif.length - 3] + dnicodif[dnicodif.length - 2] + dnicodif[dnicodif.length - 1];
            return res.json('Error ya se posee ese número de teléfono, pertenece a ' + dnicodif);
        }

        const exisinscrip = await pool.query('SELECT * FROM inscripciones_fiscales WHERE dni = ? AND edicion = 2025', [dni]);

        if (exisinscrip.length > 0) {
            return res.json('Error fiscal ya inscripto');
        } else {
            const participante_antt = await pool.query('SELECT * FROM inscripciones_fiscales WHERE dni = ?', [dni]);
            let participante_ant = participante_antt.length > 0 ? 'Si' : 'No';

            const asignadoo = await pool.query('SELECT * FROM asignaciones_fiscales WHERE dni = ?', [dni]);

            if (asignado_ant == 'Si' && asignadoo.length == 0) {
                let detalle = 'Seleccionó que fiscalizó pero no se encuentra en la lista';
                await pool.query('INSERT INTO observaciones (detalle, id_ref) VALUES (?, ?)', [detalle, dni]);
            }

            let press = 'Sin definir';
            if (asignadoo.length > 0) {
                press = asignadoo[0]['dato1'];
            }

            // Insertar en inscripciones_fiscales incluyendo el id_persona
            await pool.query(
                'INSERT INTO inscripciones_fiscales (nombre, apellido, dni, cargadopor, fecha_carga, como_se_entero, apellido_referido, nombre_referido, edicion, id_persona) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2025, ?)',
                [nombre, apellido, dni, id_aliado, (new Date(Date.now())).toLocaleDateString(), como_se_entero, apellido_referido, nombre_referido, id_persona]
            );

            return res.json('Recibimos tu inscripción. Pronto nos ponemos en contacto con vos. ¡Gracias!');
        }
    } catch (e) {
        console.log(e);
        res.json('Error, algo sucedió');
    }
});


router.post("/volverapaso3", async (req, res) => {
    const { id } = req.body

    try {
        const asignacion = await pool.query('select * from asignaciones_fiscales where id =?', [id])

        await pool.query('update inscripciones_fiscales set estado="Pendiente" where id=?', [asignacion[0]['id_inscripcion']])
        await pool.query('delete  from  asignaciones_fiscales where id = ?', [id])
        res.json('realizado')
    } catch (error) {
        res.json('Error ')
    }

})


router.post("/asignarmesaafiscal", async (req, res) => {
    let {
        dni, id_inscripcion, id_escuela, id_donde_vota, mesa, celiaco, vegano,
        movilidad, domicilio, fiscal_antes, observaciones, nombre, apellido,
        telefono, telefono2, como_se_entero, nombre_referido, apellido_referido, asignadopor // ✅ agregado
    } = req.body;
   if (!asignadopor) asignadopor = 'sin definir';
    try {
        let exi = await pool.query('select * from personas_fiscalizacion where dni =?', [dni]);

        if (!domicilio) domicilio = exi[0]?.domicilio || 'sin definir';
        if (!celiaco) celiaco = exi[0]?.celiaco || 'sin definir';
        if (!vegano) vegano = exi[0]?.vegano || 'sin definir';
        if (!fiscal_antes) fiscal_antes = exi[0]?.fiscal_antes || 'sin definir';
        if (!movilidad) movilidad = exi[0]?.movilidad || 'sin definir';

        if (exi.length > 0) {
            await pool.query(
                'update personas_fiscalizacion set vegano=?,celiaco=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?, id_donde_vota=? where id=?',
                [vegano, celiaco, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']]
            );
        } else {
            exi = await pool.query('select * from personas_fiscalizacion where nombre = ? and apellido = ? and dni = "Sin definir"', [nombre, apellido]);
            if (exi.length > 0) {
                await pool.query('update personas_fiscalizacion set nombre=?, apellido=?,celiaco=?, vegano=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?,id_donde_vota=?  where id=?',
                    [nombre, apellido, celiaco, vegano, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']]
                );
            } else {
                exi = await pool.query('select * from personas_fiscalizacion where apellido = ? and dni = "Sin definir"', [apellido]);
                if (exi.length > 0) {
                    await pool.query('update personas_fiscalizacion set nombre=?, apellido=?,celiaco=?, vegano=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?,id_donde_vota=? where id=?',
                        [nombre, apellido, celiaco, vegano, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']]
                    );
                } else {
                    exi = await pool.query('select * from personas_fiscalizacion where nombre = ? and dni = "Sin definir"', [nombre]);
                    if (exi.length > 0) {
                        await pool.query('update personas_fiscalizacion set nombre=?, apellido=?,vegano=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?,id_donde_vota=?  where id=?',
                            [nombre, apellido, vegano, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']]
                        );
                    } else {
                        await pool.query('insert into personas_fiscalizacion set vegano=?,celiaco=?, movilidad=?,domicilio=?, fiscal_antes=?, dni=?, nombre=?, apellido=?, telefono=?, telefono2=?, id_donde_vota=?',
                            [vegano, celiaco, movilidad, domicilio, fiscal_antes, dni, nombre, apellido, telefono, telefono2, id_donde_vota]
                        );
                    }
                }
            }
        }

        // ✅ ACTUALIZAR INSCRIPCIÓN con campos opcionales
        let sql = 'update inscripciones_fiscales set estado="Asignado", como_se_entero=?';
        let params = [como_se_entero || 'No definido'];

        if (nombre_referido) {
            sql += ', nombre_referido=?';
            params.push(nombre_referido);
        }

        if (apellido_referido) {
            sql += ', apellido_referido=?';
            params.push(apellido_referido);
        }

        sql += ' where id=?';
        params.push(id_inscripcion);

        await pool.query(sql, params);

        // PASO 2 - asignación
        const es = await pool.query('select * from escuelas where id=?', [id_escuela]);
        await pool.query(
            'insert into asignaciones_fiscales set id_inscripcion=?, escuela=? ,mesa=?, dni=?, zona=?,asignadopor=? ,edicion=2025',
            [id_inscripcion, id_escuela, mesa, dni, es[0]['circuito'],asignadopor]
        );

        if (observaciones) {
            await pool.query(
                'insert into observaciones set detalle=?, id_ref=? ',
                [observaciones, dni]
            );
        }

        res.json('Realizado');
    } catch (error) {
        console.log(error);
        res.json('error');
    }
});


router.post("/inscribir", async (req, res) => {
    const { id_donde_vota, telefono, telefono2, dni, nombre, apellido, observaciones, id_inscripcion, id_escuela, id_escuela2, celiaco, vegano, movilidad, domicilio, fiscal_antes } = req.body




    try {

        ///queda id_inscripcion
        //  await pool.query('insert into asignaciones_fiscales set id_inscripcion=?, escuela=? ,mesa=?, dni=? ', [id_inscripcion,id_escuela,id_escuela2,mesa,dni])

        let exi = []


        exi = await pool.query('select * from personas_fiscalizacion where dni =?', [dni])




        if (exi.length > 0) {
           
            await pool.query('update personas_fiscalizacion set vegano=?,celiaco=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?, id_donde_vota=? where id=?', [vegano, celiaco, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']])
            
            await pool.query('update inscripciones_fiscales set estado="Contactado", observaciones=?,id_escuela=?, id_escuela2=?,dni=? where id=?', [observaciones, id_escuela, id_escuela2, dni, id_inscripcion])
           
        } else {
        
            exi = await pool.query('select * from personas_fiscalizacion where nombre = ? and apellido =? and dni ="Sin definir" ', [nombre, apellido])
            console.log(exi)
            if (exi.length > 0) {
                await pool.query('update personas_fiscalizacion set nombre=?, apellido=?,celiaco=?,  vegano=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?,id_donde_vota=?  where id=?', [nombre, apellido, celiaco, vegano, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']])
                await pool.query('update inscripciones_fiscales set estado="Contactado", observaciones=?,id_escuela=?, id_escuela2=?,dni=? where id=?', [observaciones, id_escuela, id_escuela2, dni, id_inscripcion])

            } else {
                exi = await pool.query('select * from personas_fiscalizacion where apellido =? and dni ="Sin definir" ', [apellido])

                if (exi.length > 0) {
                    await pool.query('update personas_fiscalizacion set nombre=?, apellido=?,celiaco=?, vegano=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?,id_donde_vot=? where id=?', [nombre, apellido, celiaco, vegano, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']])
                    await pool.query('update inscripciones_fiscales set estado="Contactado",observaciones=?, id_escuela=?, id_escuela2=?,dni=? where id=?', [observaciones, id_escuela, id_escuela2, dni, id_inscripcion])

                } else {
                    exi = await pool.query('select * from personas_fiscalizacion where nombre =? and dni ="Sin definir" ', [nombre])

                    if (exi.length > 0) {
                        await pool.query('update personas_fiscalizacion set nombre=?, apellido=?,vegano=?, movilidad=?,domicilio=?, fiscal_antes=?,dni=?,id_donde_vota=?  where id=?', [nombre, apellido, vegano, movilidad, domicilio, fiscal_antes, dni, id_donde_vota, exi[0]['id']])
                        await pool.query('update inscripciones_fiscales set estado="Contactado", observaciones=?, id_escuela=?, id_escuela2=?,dni=? where id=?', [observaciones, id_escuela, id_escuela2, dni, id_inscripcion])

                    } else {

                        await pool.query('insert into personas_fiscalizacion set vegano=?,celiaco=?,  movilidad=?,domicilio=?, fiscal_antes=?, dni =?, nombre=?, apellido=?, telefono=?, telefono2=?,id_donde_vota=? ', [vegano, celiaco, movilidad, domicilio, fiscal_antes, dni, nombre, apellido, telefono, telefono2, id_donde_vota])

                        await pool.query('update inscripciones_fiscales set estado="Contactado",observaciones=?, id_escuela=?, id_escuela2=?,dni=? where id=?', [observaciones, id_escuela, id_escuela2, dni, id_inscripcion])

                    }
                }


            }



        }





        res.json('Realizado con exito ')

    } catch (error) {
        console.log(error)
        res.json('Error algo sucedio')
    }


})




router.get('/borrarinscripcion/:id', async (req, res) => {
    const id = req.params.id
    try {

        await pool.query('delete  from  inscripciones_fiscales where id = ?', [id])
        res.json("Realizado")
    } catch (error) {
        res.json("No Realizado")
    }




})


router.get('/todoslosencargados/', async (req, res) => {

    const encargados = await pool.query('select * from usuarios where nivel =9')

    let envio = []
    asignados = 0
    for (encargado in encargados) {
        let asignados = await pool.query('select * from inscripciones_fiscales where id_encargado =? and edicion=2025 ', [encargados[encargado]['id']])


        let sinc = await pool.query('select * from inscripciones_fiscales where id_encargado =? and estado="Pendiente" and edicion=2025', [encargados[encargado]['id']])
        let rech = await pool.query('select * from inscripciones_fiscales where id_encargado =? and estado="Rechazado"  and edicion=2025', [encargados[encargado]['id']])
        let cont = await pool.query('select * from inscripciones_fiscales where id_encargado =? and estado="Contactado"  and edicion=2025', [encargados[encargado]['id']])
        conf = await pool.query('select * from inscripciones_fiscales join (select id_inscripcion  from asignaciones_fiscales) as selec on inscripciones_fiscales.id=selec.id_inscripcion where id_encargado =?  and edicion=2025', [encargados[encargado]['id']])

        let objeto_nuevo = {
            id: encargados[encargado]['id'],
            nombre: encargados[encargado]['nombre'],
            asignados: asignados.length,
            sinc: sinc.length,
            conf: conf.length,
            rech: rech.length,
            cont: cont.length

        }
        envio.push(objeto_nuevo)
    }


    res.json([envio])
})
router.get('/traerencargados/', async (req, res) => {
    const encargados = await pool.query('select * from usuarios where nivel =9')
    res.json(encargados)
})


router.get('/todoslossuplentes/', async (req, res) => {
    const encargados = await pool.query('select * from asignaciones_fiscales join (select dni as dniper,telefono,telefono2, nombre, apellido,id as idpersona from personas_fiscalizacion) as selec1 on asignaciones_fiscales.dni=selec1.dniper left join (select id as idescuela, nombre as nombreescuela,id_usuario from escuelas) as selec2 on asignaciones_fiscales.escuela=selec2.idescuela left join (select id as idinscrip, id_encargado from inscripciones_fiscales ) as selec3 on asignaciones_fiscales.id_inscripcion=selec3.idinscrip left join (select id as idmesa, numero from mesas_fiscales) as sele on asignaciones_fiscales.mesa=sele.idmesa where numero = "Suplente 1" or numero = "Suplente 2" or numero = "Suplente 3" or numero = "Suplente 4" or numero = "Suplente 5" or numero = "Suplente 6" or numero = "Suplente 7"')
    res.json(encargados)
})
router.get('/traerescparasig/', async (req, res) => {


    const etc = await pool.query('select * from usuarios where  nivel=10')
    console.log(etc)
    res.json(etc);
    //res.render('index')
})
router.get('/todos/', async (req, res) => {


    const etc = await pool.query('select * from usuarios where nivel=5 or nivel=6 or nivel=7 or nivel=8 or nivel=9 or nivel=10 or nivel=50')
    res.json(etc);
    //res.render('index')
})

router.post('/signupp', passport.authenticate('local.registroadmin', {
    successRedirect: '/exitosignup',
    failureRedirect: '/noexito',
    failureFlash: true

}))




router.post('/asignarencargado', async (req, res) => {
    const { id_inscripcion, id_encargado } = req.body
//console.log(id_inscripcion, id_encargado )
    try {
        await pool.query('update inscripciones_fiscales set id_encargado=? where  id = ?', [id_encargado, id_inscripcion])
        res.json('asignado')

    } catch (error) {
        res.json('error')
    }
})


router.post('/crearmesa', async (req, res) => {
    const { id_escuela, numero } = req.body
    let existe = await pool.query('select * from mesas_fiscales where id_escuela=? and numero=?', [id_escuela, numero])
    if (existe.length > 0) {
        res.json('Error ya existe la mesa')
    } else {

        await pool.query('insert into mesas_fiscales set id_escuela=?, numero=?', [id_escuela, numero])
        res.json('Realizado')

    }

})



router.post('/marcarnocontestado', async (req, res) => {
    const { id_inscripcion } = req.body
    try {
        const inc = await pool.query('select * from inscripciones_fiscales where id =?', [id_inscripcion])
        if (inc[0]['estado'] == 'No contestado') {
            await pool.query('update inscripciones_fiscales set estado="Pendiente"  where id = ?', [id_inscripcion])
        } else {
            await pool.query('update inscripciones_fiscales set estado="No contestado"  where id = ?', [id_inscripcion])
        }

        res.json('realizado')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})


router.post('/asignarencardadodeesc', async (req, res) => {
    const { id, id_encargado } = req.body
    try {
        await pool.query('update escuelas set id_usuario=?  where id = ?', [id_encargado, id])
        res.json('realizado')
    } catch (error) {
        console.log(error)
        res.json('No realizado')
    }

})
router.post('/incripcionesid', async (req, res) => {
    const { id } = req.body

    const estract = await pool.query('select * from excelfiscalizacion where id = ? ', [id])
    const nombree = estract[0]['nombre']
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

        for (const property in dataExcel) {


            /*  if ((dataExcel[property]['Descripción']).includes(cuil_cuit)) {
                 estado = 'A'
                 // tipo de pago normal 
             } */






            try {





                try {







                    nombre = dataExcel[property]['Nombre y Apellido']

                    fiscal_antes = dataExcel[property]['¿Fuiste fiscal antes?']
                    DNI = dataExcel[property]['DNI']

                    nuevo = {
                        nombre,
                        fiscal_antes,

                        DNI,

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





router.post('/incripcionesidescuelas', async (req, res) => {
    const { id } = req.body

    const estract = await pool.query('select * from excelescuelas  where id = ? ', [id])
    const nombree = estract[0]['nombre']
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

        for (const property in dataExcel) {




            try {



                try {




                    nombre = dataExcel[property]['ESCUELA']

                    circuito = dataExcel[property]['CIR']
                    DNI = dataExcel[property]['DNI']

                    nuevo = {
                        nombre,
                        circuito,

                        DNI,

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


router.post('/cargarcantidades', async (req, res) => {
    const { id } = req.body
    console.log(id)
    const estract = await pool.query('select * from excelescuelas where id = ? ', [id])
    console.log(estract)
    const nombree = estract[0]['nombre']
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


        for (const property in dataExcel) {



            try {
                ///////

                await pool.query('update mesas_fiscales set cantidad=?  where numero = ?', [dataExcel[property]['Cantidad'], dataExcel[property]['Mesa']])

                //////
            }
            catch (error) {
                console.log(error)
            }



            /* if ((dataExcel[property]['Sucursal']).includes(cuil_cuit)) {
                estado = 'A'
            }*/


        }
        res.json('realizado')
    } catch (error) {
        console.log(error)
        res.send(error)

    }




})


router.post('/cargarinscripcionesescuelas', async (req, res) => {
    const { id } = req.body
    console.log(id)
    const estract = await pool.query('select * from excelescuelas where id = ? ', [id])
    console.log(estract)
    const nombree = estract[0]['nombre']
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






        let a = 1

        for (const property in dataExcel) {
            a += 1

            escuela = dataExcel[property]['ESCUELA']
            console.log(dataExcel[property]['ESCUELA'])


            existe = await pool.query('select * from escuelas where nombre = ?', [escuela])

            try {
                ///////

                if (existe.length > 0) {


                    await pool.query('update escuelas set circuito=?  where nombre = ?', [dataExcel[property]['CIR'], dataExcel[property]['ESCUELA']])

                } else {
                    ///crear nueva persona 

                    nombre = dataExcel[property]['ESCUELA']
                    circuito = dataExcel[property]['CIR']


                    await pool.query('INSERT INTO escuelas set nombre =?, circuito=?', [nombre, circuito]);
                }
                /////////¿Actualmente  se encuentra estudiando? actividad adicional
                /////////////Tipo de empleo



            }
            //////
            catch (error) {
                console.log(error)
            }

            let id_esc = await pool.query('select * from escuelas where nombre = ? ', [dataExcel[property]['ESCUELA']])
            numero = dataExcel[property]['MESA']
            let existe_mesa = await pool.query('select * from mesas_fiscales where numero=? and id_escuela =?', [numero, id_esc[0]['id']])
            if (existe_mesa.length > 0) {
                console.log('ya existe mesa')
            } else {
                await pool.query('INSERT INTO mesas_fiscales set numero =?, id_escuela=?', [numero, id_esc[0]['id']]);
                console.log('mesa_cargada')
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



router.get('/cargarpresentes', async (req, res) => {


    const pres = await pool.query('select * from asignaciones_fiscales2 join (select id as idme, id_escuela from mesas_fiscales) as sel on asignaciones_fiscales2.mesa=sel.idme join (select id as ides, nombre from escuelas) as sel2 on sel.id_escuela=sel2.ides where dato1="Si"')
    const aus = await pool.query('select * from asignaciones_fiscales2  join (select id as idme, id_escuela from mesas_fiscales) as sel on asignaciones_fiscales2.mesa=sel.idme join (select id as ides, nombre from escuelas) as sel2 on sel.id_escuela=sel2.ides  where dato1="No"')
    const sin = await pool.query('select * from asignaciones_fiscales2  join (select id as idme, id_escuela from mesas_fiscales) as sel on asignaciones_fiscales2.mesa=sel.idme join (select id as ides, nombre from escuelas) as sel2 on sel.id_escuela=sel2.ides where dato1 is null')
    res.json([pres,aus,sin])

})

router.post('/cargarinscripciones', async (req, res) => {
    const { id } = req.body
    console.log(id)
    const estract = await pool.query('select * from excelfiscalizacion where id = ? ', [id])
    console.log(estract)
    const nombree = estract[0]['nombre']
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







        let dni = undefined
        let escuela = 'Sin definir'
        for (const property in dataExcel) {

            dni = dataExcel[property]['DNI']
            console.log(dni)
            if (dni != undefined) {
                console.log(dni)
                existe = await pool.query('select * from personas_fiscalizacion where dni = ?', [dni])
                console.log('existe')
                try {
                    ///////




                    if (existe.length > 0) {//////si existe la personas

                        console.log(dni)

                        ///actualiza

                        let fiscal_antes = dataExcel[property]['¿Fuiste fiscal antes?']



                        if (dataExcel[property]['Nombre y Apellido'] === undefined) {
                            nombre = 'No'
                        } else {
                            nombre = dataExcel[property]['Nombre y Apellido']

                        }
                        if (dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)'] === undefined) {
                            domicilio = 'No'
                        } else {
                            domicilio = dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)']
                        }
                        if (dataExcel[property]['Teléfono de contacto'] === undefined) {
                            telefono = 'No'
                        } else {
                            telefono = dataExcel[property]['Teléfono de contacto']

                        }
                        if (dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?'] === undefined) {
                            movilidad = 'No'
                        } else {
                            movilidad = dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?']

                        }
                        if (dataExcel[property]['Vegane'] === undefined) {
                            vegano = 'No'
                        } else {
                            vegano = dataExcel[property]['Vegane']

                        }
                        if (dataExcel[property]['¿Fuiste fiscal antes?'] === undefined) {
                            fiscal_antes = 'No'
                        } else {
                            if (dataExcel[property]['¿Fuiste fiscal antes?'] === 'Si, fui fiscal antes') {
                                fiscal_antes = 'Si'
                            }
                            fiscal_antes = 'No'

                        }
                        await pool.query('update personas_fiscalizacion set nombre=?,domicilio =?,telefono=?,movilidad=?,vegano=?, fiscal_antes=?  where dni = ?', [nombre, domicilio, telefono, movilidad, vegano, fiscal_antes, dni])


                    } else {
                        ///crear nueva persona 

                        if (dataExcel[property]['Nombre y Apellido'] === undefined) {
                            nombre = 'No'
                        } else {
                            nombre = dataExcel[property]['Nombre y Apellido']

                        }
                        if (dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)'] === undefined) {
                            domicilio = 'No'
                        } else {
                            domicilio = dataExcel[property]['Domicilio actual (se lo mas preciso que puedas)']
                        }
                        if (dataExcel[property]['Teléfono de contacto'] === undefined) {
                            telefono = 'No'
                        } else {
                            telefono = dataExcel[property]['Teléfono de contacto']

                        }
                        if (dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?'] === undefined) {
                            movilidad = 'No'
                        } else {
                            movilidad = dataExcel[property]['¿Tenes medio de movilidad propio para el día de la elección?']

                        }
                        if (dataExcel[property]['Vegane'] === undefined) {
                            vegano = 'No'
                        } else {
                            vegano = dataExcel[property]['Vegane']

                        }
                        if (dataExcel[property]['¿Fuiste fiscal antes?'] === undefined) {
                            fiscal_antes = 'No'
                        } else {
                            if (dataExcel[property]['¿Fuiste fiscal antes?'] === 'Si, fui fiscal antes') {
                                fiscal_antes = 'Si'
                            }
                            fiscal_antes = 'No'

                        }


                        await pool.query('INSERT INTO personas_fiscalizacion set nombre=?,domicilio =?,telefono=?,movilidad=?,vegano=?, fiscal_antes=?,dni=?', [nombre, domicilio, telefono, movilidad, vegano, fiscal_antes, dni]);
                    }
                    /////////¿Actualmente  se encuentra estudiando? actividad adicional
                    /////////////Tipo de empleo



                }
                //////
                catch (error) {
                    console.log(error)
                }



                if (dataExcel[property]['Escuela'] === undefined) {
                    escuela = 'Sin definir'
                } else {
                    escuela = dataExcel[property]['Escuela']

                }

                exi = await pool.query('select * from escuelas where nombre =?', [escuela])
                if (exi.length > 0) {
                    id_escuela = exi[0]['id']
                } else {
                    await pool.query('INSERT INTO escuelas set nombre=?', [escuela])
                    exi = await pool.query('select * from escuelas where nombre =?', [escuela])
                    id_escuela = exi[0]['id']
                }



                try {
                    let exisinscrip = await pool.query('select * from inscripciones_fiscales where  dni=? ', [])
                    if (exisinscrip.length > 0) {
                        console.log('ya inscripto')
                    } else {
                        await pool.query('INSERT INTO inscripciones_fiscales set id_escuela=?, nombre=?, dni=?', [id_escuela, nombre, dni])
                        console.log('cargado')
                    }




                } catch (e) {
                    console.log(e)
                }
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


router.post('/subirprueba', fileUpload, async (req, res, done) => {
    const { formdata, file } = req.body

    try {


        const type = req.file.mimetype
        const name = req.file.originalname
        // const data = fs.readFileSync(path.join(__dirname, '../Excel' + req.file.filename))
        fech = (new Date(Date.now())).toLocaleDateString()
        console.log(9)
        console.log(req.file.filename)

        await pool.query('insert into excelfiscalizacion set fecha=?, nombre=?', [fech, req.file.filename])
        res.send('Imagen guardada con exito')
    } catch (error) {
        console.log(error)
    }





})



router.post('/subirpruebaescuelas', fileUpload, async (req, res, done) => {
    const { formdata, file } = req.body

    try {


        const type = req.file.mimetype
        const name = req.file.originalname
        // const data = fs.readFileSync(path.join(__dirname, '../Excel' + req.file.filename))
        fech = (new Date(Date.now())).toLocaleDateString()
        console.log(9)
        console.log(req.file.filename)

        await pool.query('insert into excelescuelas set fecha=?, nombre=?', [fech, req.file.filename])
        res.send('Imagen guardada con exito')
    } catch (error) {
        console.log(error)
    }





})
module.exports = router
