const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2  } = require('../lib/auth') //proteger profile
const pool = require('../database')
const puppeteer = require('puppeteer');
//const xlsx = require('xlsx');
//const path = require('path');

router.get('/todas/',isLoggedInn, async (req, res) => {
   
  
    const etc = await pool.query ('select * from novedades' )

  res.json(etc);
//res.render('index')
})

/* router.get('/consulta', async (req, res) => {
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
 */


/* 
router.get('/consultar-padron', async (req, res) => {
  try {
    // Obtener todos los registros con edicion=2025 y dondevotascript null
    const registros = await pool.query(
      'SELECT dni FROM inscripciones_fiscales WHERE edicion = 2025 AND dondevotascript IS NULL or dondevotascript = "Sin definir and id>2135"'
    );
    console.log(`Total DNIs a procesar: ${registros.length}`);

    if (registros.length === 0) {
      return res.json({ mensaje: 'No hay registros para edición 2025' });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Función para consultar escuela por DNI probando sexos M y F
    async function consultarEscuelaPorDni(dni) {
      const sexos = ['M', 'F'];

      for (const sexo of sexos) {
        await page.goto('https://padron.corrientes.gob.ar/', { waitUntil: 'networkidle2' });

        await page.type('input[name="dni"]', dni.toString());
        await page.select('select[name="Sexo"]', sexo);

        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        // Intentar obtener el elemento con la clase exacta de la escuela
        try {
          const escuela = await page.$eval(
            '.inline-flex.items-center.text-lg.text-coolGray-800.font-semibold.mt-5',
            el => el.innerText.trim()
          );

          if (escuela && escuela.length > 0) {
            return escuela; // Devuelve si encontró algo
          }
        } catch (e) {
          // Si no encontró el elemento, probamos con el siguiente sexo
        }
      }

      return null; // No encontró escuela
    }

    // Recorrer todos los DNIs secuencialmente
    for (const fila of registros) {
      const dni = fila.dni;
      try {
        const escuela = await consultarEscuelaPorDni(dni);
        console.log(`DNI: ${dni} - Escuela: ${escuela || 'No encontrada'}`);

        if (escuela) {
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
}); */
 
/*

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
*/
/* router.get('/consultarr', async (req, res) => {
  try {
    const excelPath = path.join(__dirname, 'ROLES.xlsx');
    const workbook = xlsx.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const datos = xlsx.utils.sheet_to_json(sheet);

    if (datos.length === 0) {
      return res.json({ mensaje: 'El archivo Excel está vacío.' });
    }

    console.log(`📄 Se encontraron ${datos.length} registros en el Excel`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

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
        try {
          const texto = await consultarConSexo(sexo);
          if (texto && texto.includes('ESC.')) {
            const lineaEscuela = texto.split('\n').find(linea => linea.includes('ESC.'));
            return {
              escuela: lineaEscuela ? lineaEscuela.trim() : null,
              sexo
            };
          }
        } catch (err) {
          console.log(`⚠️ Error DNI ${dni} sexo ${sexo}:`, err.message);
        }
      }
      return { escuela: null, sexo: null };
    }

    const resultados = [];

    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];
      const dni = fila.DNI || fila.dni;

      if (!dni) {
        // No tiene DNI, pero respetamos posición
        resultados.push({
          ...fila,
          ESCUELA: 'Sin DNI',
          SEXO_USADO: 'Sin dato'
        });
        continue;
      }

      console.log(`🔍 Consultando DNI: ${dni} (${i + 1}/${datos.length})`);

      try {
        const { escuela, sexo } = await consultarEscuelaPorDni(dni);

        resultados.push({
          ...fila,
          ESCUELA: escuela || 'No encontrada',
          SEXO_USADO: sexo || 'No encontrado'
        });

        if (escuela) {
          console.log(`✅ DNI ${dni}: Escuela -> ${escuela}`);
        } else {
          console.log(`❌ DNI ${dni}: Escuela no encontrada`);
        }

      } catch (err) {
        console.error(`❌ Error procesando DNI ${dni}:`, err.message);
        resultados.push({
          ...fila,
          ESCUELA: 'Error al consultar',
          SEXO_USADO: 'Error'
        });
      }
    }

    await browser.close();

    const nuevaHoja = xlsx.utils.json_to_sheet(resultados);
    const nuevoLibro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(nuevoLibro, nuevaHoja, 'Resultados');
    xlsx.writeFile(nuevoLibro, path.join(__dirname, 'padron_resultado-todos2.xlsx'));

    res.json({
      mensaje: '✅ Consulta finalizada. Revisa el archivo padron_resultado-todos.xlsx',
      totalConsultados: resultados.length
    });

  } catch (error) {
    console.error('❌ Error en /consultarr:', error);
    res.status(500).json({ error: 'Error al procesar la consulta' });
  }
});
 */

module.exports = router