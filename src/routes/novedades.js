const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2  } = require('../lib/auth') //proteger profile
const pool = require('../database')
const puppeteer = require('puppeteer');



router.get('/todas/',isLoggedInn, async (req, res) => {
   
  
    const etc = await pool.query ('select * from novedades' )

  res.json(etc);
//res.render('index')
})

router.get('/consulta', async (req, res) => {
  let { dni, genero } = req.query;
dni=34825125
genero='M'
  if (!dni || !genero) {
    return res.status(400).json({ error: 'Falta dni o genero' });
  }

  const formData = new URLSearchParams();
  formData.append('dni', dni);
  formData.append('Sexo', genero);

  try {
    const response = await fetch('https://padron.corrientes.gob.ar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://padron.corrientes.gob.ar',
        'Referer': 'https://padron.corrientes.gob.ar/',
        'User-Agent': 'Mozilla/5.0',
      },
      body: formData
    });
console.log(response)
    const html = await response.text();
    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar el padrón' });
  }
});


/* 

router.get('/consultar-padron', async (req, res) => {
  try {
    // Obtener todos los registros con edicion=2025
    const registros = await pool.query('SELECT dni FROM inscripciones_fiscales WHERE edicion = 2025');
console.log(registros.length)
    if (registros.length === 0) {
      return res.json({ mensaje: 'No hay registros para edición 2025' });
    }

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}); 
    const page = await browser.newPage();

    // Función para consultar escuela por DNI, probando sexos M y F
    async function consultarEscuelaPorDni(dni) {
      async function consultarConSexo(sexo) {
        await page.goto('https://padron.corrientes.gob.ar/', { waitUntil: 'networkidle2' });

        await page.type('input[name="dni"]', dni.toString());

        await page.select('select[name="Sexo"]', sexo); 

        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        const resultadoCompleto = await page.evaluate(() => {
          const contenedor = document.querySelector('body');
          return contenedor ? contenedor.innerText : '';
        });

        return resultadoCompleto;
      }

      const sexos = ['M', 'F'];
      for (const sexo of sexos) {
        const texto = await consultarConSexo(sexo);
        if (texto && texto.includes('ESC.')) {
          // Extraer línea con escuela
          const lineaEscuela = texto.split('\n').find(linea => linea.includes('ESC.'));
          return lineaEscuela ? lineaEscuela.trim() : null;
        }
      }
      return null;
    }

    // Recorrer todos los DNIs secuencialmente
    for (const fila of registros) {
      const dni = fila.dni;
      try {
        const escuela = await consultarEscuelaPorDni(dni);
        console.log(`DNI: ${dni} - Escuela: ${escuela || 'No encontrada'}`);

        if (escuela) {
          // Actualizar el campo dondevotascript con la escuela encontrada
          await pool.query(
            'UPDATE inscripciones_fiscales SET dondevotascript = ? WHERE dni = ? AND edicion = 2025',
            [escuela, dni]
          );
        }
      } catch (err) {
        console.error(`Error consultando DNI ${dni}:`, err.message);
      }
    }

    await browser.close();

    res.json({ mensaje: 'Consulta finalizada. Revisa la consola para resultados.' });
  } catch (error) {
    console.error('Error en /consultar-padron:', error);
    res.status(500).json({ error: 'Error al procesar la consulta' });
  }
});

*/

router.get('/consultar-padronfem', async (req, res) => {
  try {
    // Obtener todos los registros con edicion=2025
    const registros = await pool.query('SELECT dni FROM inscripciones_fiscales WHERE edicion = 2025 and dondevotascript is not null and dondevotascript != "Sin definir"');
console.log(registros.length)
    if (registros.length === 0) {
      return res.json({ mensaje: 'No hay registros para edición 2025' });
    }

  const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
    const page = await browser.newPage();

    // Función para consultar escuela por DNI, probando sexos M y F
    async function consultarEscuelaPorDni(dni) {
      async function consultarConSexo(sexo) {
        await page.goto('https://padron.corrientes.gob.ar/', { waitUntil: 'networkidle2' });

        await page.type('input[name="dni"]', dni.toString());

        await page.select('select[name="Sexo"]', sexo);

        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        const resultadoCompleto = await page.evaluate(() => {
          const contenedor = document.querySelector('body');
          return contenedor ? contenedor.innerText : '';
        });

        return resultadoCompleto;
      }

      const sexos = ['F'];
      for (const sexo of sexos) {
        const texto = await consultarConSexo(sexo);
        if (texto && texto.includes('ESC.')) {
          // Extraer línea con escuela
          const lineaEscuela = texto.split('\n').find(linea => linea.includes('ESC.'));
          return lineaEscuela ? lineaEscuela.trim() : null;
        }
      }
      return null;
    }

    // Recorrer todos los DNIs secuencialmente
    for (const fila of registros) {
      const dni = fila.dni;
      try {
        const escuela = await consultarEscuelaPorDni(dni);
        console.log(`DNI: ${dni} - Escuela: ${escuela || 'No encontrada'}`);

        if (escuela) {
          // Actualizar el campo dondevotascript con la escuela encontrada
          await pool.query(
            'UPDATE inscripciones_fiscales SET dondevotascript = ? WHERE dni = ? AND edicion = 2025',
            [escuela, dni]
          );
        }
      } catch (err) {
        console.error(`Error consultando DNI ${dni}:`, err.message);
      }
    }

    await browser.close();

    res.json({ mensaje: 'Consulta finalizada. Revisa la consola para resultados.' });
  } catch (error) {
    console.error('Error en /consultar-padron:', error);
    res.status(500).json({ error: 'Error al procesar la consulta' });
  }
});



module.exports = router