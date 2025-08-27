const express = require('express')
const router = express.Router()
const { isLoggedIn,isLoggedInn, isLoggedInn2  } = require('../lib/auth') //proteger profile
const pool = require('../database')
const puppeteer = require('puppeteer');
//const xlsx = require('xlsx');
//const path = require('path');


/* router.get("/consultar-padron-escuelas", async (req, res) => {
  try {
    // 1. Traer todas las escuelas con join a roles_fisca por dato2 = tel
    const registros = await pool.query(`
      SELECT e.dato1, e.nombre, r.dni
      FROM escuelas e
      JOIN roles_fisca r ON e.dato2 = r.tel
    `);

    if (registros.length === 0) {
      return res.send("<h3>No hay coincidencias entre escuelas y roles_fisca</h3>");
    }

    console.log(`Total de registros a procesar: ${registros.length}`);

    // 2. Abrir puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // 3. Función que busca la escuela en la web del padrón
    async function consultarEscuelaPorDni(dni) {
      const sexos = ["M", "F"];
      for (const sexo of sexos) {
        await page.goto("https://padron.corrientes.gob.ar/", {
          waitUntil: "networkidle2",
        });

        await page.type('input[name="dni"]', dni.toString());
        await page.select('select[name="Sexo"]', sexo);

        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);

        try {
          const escuela = await page.$eval(
            ".inline-flex.items-center.text-lg.text-coolGray-800.font-semibold.mt-5",
            (el) => el.innerText.trim()
          );
          if (escuela && escuela.length > 0) {
            return escuela;
          }
        } catch (e) {
          // no encontró con ese sexo, prueba con el otro
        }
      }
      return "No encontrada";
    }

    // 4. Procesar todos los registros secuencialmente
    const resultados = [];
    for (const fila of registros) {
      try {
        const escuelaPadron = await consultarEscuelaPorDni(fila.dni);
        console.log(
          `DNI: ${fila.dni} - Escuela padrón: ${escuelaPadron}`
        );

        resultados.push({
          dato1: fila.dato1,
          nombre: fila.nombre,
          dni: fila.dni,
          escuelaPadron,
        });
      } catch (err) {
        console.error(`Error con DNI ${fila.dni}:`, err.message);
        resultados.push({
          dato1: fila.dato1,
          nombre: fila.nombre,
          dni: fila.dni,
          escuelaPadron: "Error al consultar",
        });
      }
    }

    await browser.close();

    // 5. Renderizar tabla HTML simple
    let html = `
      <h2>Resultados de Consulta</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Dato1</th>
            <th>Nombre Escuela</th>
            <th>DNI</th>
            <th>Escuela donde vota</th>
          </tr>
        </thead>
        <tbody>
    `;
    resultados.forEach((r) => {
      html += `
        <tr>
          <td>${r.dato1}</td>
          <td>${r.nombre}</td>
          <td>${r.dni}</td>
          <td>${r.escuelaPadron}</td>
        </tr>
      `;
    });
    html += "</tbody></table>";

    res.send(html);
  } catch (error) {
    console.error("Error en /consultar-padron-escuelas:", error);
    res.status(500).send("Error al procesar la consulta");
  }
}); */

router.get('/reasignar-suplementes', async (req, res) => {
  try {
    // 1) Buscar suplentes (asignados en mesas con numero = Suplente)
    const suplentes = await pool.query(`
      SELECT af.id AS asignacion_id, af.mesa AS mesa_suplente_id,
             msu.numero AS mesa_suplente, msu.id_escuela
      FROM asignaciones_fiscales af
      JOIN mesas_fiscales msu ON af.mesa = msu.id
      WHERE af.edicion = 2025
        AND msu.numero LIKE 'Suplente%'
      ORDER BY af.id
    `);

    console.log("Suplentes encontrados:", suplentes);

    // 2) Buscar mesas libres (no suplentes y sin asignación en 2025)
    const libres = await pool.query(`
      SELECT mf.id AS mesa_id, mf.numero AS mesa_numero, mf.id_escuela
      FROM mesas_fiscales mf
      LEFT JOIN asignaciones_fiscales af 
        ON af.mesa = mf.id AND af.edicion = 2025
      WHERE af.mesa IS NULL
        AND mf.numero NOT LIKE 'Suplente%'
      ORDER BY mf.id
    `);

    console.log("Mesas libres encontradas:", libres);

    // Organizar mesas libres por escuela
    const libresPorEscuela = {};
    libres.forEach(l => {
      if (!libresPorEscuela[l.id_escuela]) libresPorEscuela[l.id_escuela] = [];
      libresPorEscuela[l.id_escuela].push(l);
    });

    console.log("Libres por escuela:", libresPorEscuela);

    // 3) Emparejar suplentes con libres de su misma escuela
    const cambios = [];
    for (const suplente of suplentes) {
      const disponibles = libresPorEscuela[suplente.id_escuela] || [];
      console.log(`Suplente ${suplente.asignacion_id} de escuela ${suplente.id_escuela} → libres disponibles:`, disponibles);

      if (disponibles.length > 0) {
        const libre = disponibles.shift(); // tomar la primera libre y removerla

        // Update de la asignación
        await pool.query(
          `UPDATE asignaciones_fiscales SET mesa = ? WHERE id = ?`,
          [libre.mesa_id, suplente.asignacion_id]
        );

        console.log(`Asignación actualizada: ${suplente.asignacion_id} → Mesa ${libre.mesa_numero} (Escuela ${suplente.id_escuela})`);

        cambios.push({
          asignacion_id: suplente.asignacion_id,
          id_escuela: suplente.id_escuela,
          antes: suplente.mesa_suplente,
          despues: libre.mesa_numero
        });
      }
    }

    res.json({
      modificados: cambios.length,
      cambios
    });

  } catch (err) {
    console.error("Error en reasignar-suplementes:", err);
    res.status(500).json({ error: "Error reasignando suplentes" });
  }
});



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

router.get('/consult', async (req, res) => {
    const agrupados = await pool.query(`
SELECT 
    e.id,
    e.nombre AS escuela,
    CAST(COUNT(i.dni) AS UNSIGNED) AS cantidad_inscriptos,
    CAST(SUM(
        CASE 
            WHEN m.numero NOT IN ('Suplente 1','Suplente 2','Suplente 3',
                                  'Suplente 4','Suplente 5','Suplente 6','Suplente 7')
            THEN 1 ELSE 0 
        END
    ) AS UNSIGNED) AS cantidad_mesas
FROM escuelas e
LEFT JOIN marketing.inscripciones_fiscales i
    ON e.nombre = i.dondevotascript
   AND i.edicion = 2025
LEFT JOIN mesas_fiscales m
    ON m.id_escuela = e.id
GROUP BY e.id, e.nombre
ORDER BY e.nombre;

    `);
        const normalizados = agrupados.map(fila => ({
  ...fila,
  cantidad_inscriptos: Number(fila.cantidad_inscriptos),
  cantidad_mesas: Number(fila.cantidad_mesas)
}));
    console.log(normalizados)
res.json(normalizados)
});

/* 
router.get('/consultar-padron', async (req, res) => {
  try {
    // Obtener todos los registros con edicion=2025 y dondevotascript null
    const registros = await pool.query(
      'SELECT dni FROM inscripciones_fiscales WHERE edicion = 2025 and id>2721 and dondevotascript = "Sin definir"'
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
}); 
 */

/* 
router.get('/consultar-padron', async (req, res) => {
  try {
    const registros = await pool.query(
      'SELECT dni FROM inscripciones_fiscales WHERE edicion = 2025 and id>3232 and dondevotascript = "Sin definir"'
    );
    console.log(`Total DNIs a procesar: ${registros.length}`);

    if (registros.length === 0) {
      return res.send('<h2>No hay registros para edición 2025</h2>');
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

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

        try {
          const escuela = await page.$eval(
            '.inline-flex.items-center.text-lg.text-coolGray-800.font-semibold.mt-5',
            el => el.innerText.trim()
          );
          if (escuela && escuela.length > 0) {
            return escuela;
          }
        } catch (e) {
          // probar siguiente sexo
        }
      }
      return null;
    }

    let nuevos = [];

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
          nuevos.push({ dni, escuela });
        }
      } catch (err) {
        console.error(`Error consultando DNI ${dni}:`, err.message);
      }
    }

    await browser.close();

    // Mostrar en la misma página
    res.send(`
      <h1>Estos son los nuevos que encontré:</h1>
      <ul>
        ${nuevos.length > 0 
          ? nuevos.map(n => `<li>DNI: ${n.dni} - Escuela: ${n.escuela}</li>`).join('')
          : '<li>No se encontraron nuevos</li>'
        }
      </ul>
    `);

  } catch (error) {
    console.error('Error en /consultar-padron:', error);
    res.status(500).send('<h2>Error al procesar la consulta</h2>');
  }
});
 */
router.get('/consultar-padron-roles', async (req, res) => {
  try {
    // Traer todos los registros de roles_fisca
    const registros = await pool.query(
      'SELECT dni FROM roles_fisca'
    );
    console.log(`Total DNIs a procesar en roles_fisca: ${registros.length}`);

    if (registros.length === 0) {
      return res.json({ mensaje: 'No hay registros en roles_fisca para edición 2025' });
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

        // Intentar obtener el nombre de la escuela
        try {
          const escuela = await page.$eval(
            '.inline-flex.items-center.text-lg.text-coolGray-800.font-semibold.mt-5',
            el => el.innerText.trim()
          );

          if (escuela && escuela.length > 0) {
            return escuela; // si encontró, lo devuelve
          }
        } catch (e) {
          // no encontró con este sexo, intenta con el siguiente
        }
      }

      return null; // no encontró nada
    }

    // Recorrer todos los DNIs
    for (const fila of registros) {
      const dni = fila.dni;
      try {
        const escuela = await consultarEscuelaPorDni(dni);
        console.log(`DNI: ${dni} - Escuela: ${escuela || 'No encontrada'}`);

        if (escuela) {
          await pool.query(
            'UPDATE roles_fisca SET observaciones = ? WHERE dni = ? ',
            [escuela, dni]
          );
        }
      } catch (err) {
        console.error(`Error consultando DNI ${dni}:`, err.message);
      }
    }

    await browser.close();

    res.json({ mensaje: 'Consulta finalizada en roles_fisca. Revisa la consola para resultados.' });
  } catch (error) {
    console.error('Error en /consultar-padron-roles:', error);
    res.status(500).json({ error: 'Error al procesar la consulta en roles_fisca' });
  }
}); 

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

router.get('/enviar-mensajes', async (req, res) => {
    try {
        const registros = await pool.query(`
            SELECT 
                i.fecha_carga,
                i.nombre,
                i.apellido,
                i.dni,
                i.dondevotascript,
                p.telefono
            FROM marketing.inscripciones_fiscales i
            LEFT JOIN marketing.escuelas e
                ON i.dondevotascript = e.nombre
            LEFT JOIN marketing.personas_fiscalizacion p
                ON i.dni = p.dni
            WHERE i.edicion = 2025
              AND i.estado = 'Pendiente'
              AND e.nombre IS NULL
        `);

        let enviados = 0;

        for (const registro of registros) {
            const telefono = registro.telefono;

            if (telefono && telefono.length >= 10) {
                const numeroFormateado = `549${telefono.replace(/\D/g, '')}@c.us`;

                let mensaje;

                if (registro.dondevotascript === "Sin definir") {
                    mensaje = `Hola somos del Equipo de Fiscalizacion😊, revisamos y vimos que no figurás en el padrón, por lo que en esta elección no vas a poder fiscalizar. Ojalá podamos contar con vos en las próximas 🙌. ¡Gracias por tus ganas de sumarte!

Lista4️⃣7️⃣💚

#VamosCtes
Juan Pablo Valdés Gobernador 
Cuqui Calvano Diputado
Claudio Polich Intendente 
Gaby Gauna Concejal`;
                } else {
                    mensaje = `Hola somos del Equipo de Fiscalizacion😊, revisamos el padrón y no votas en Corrientes Capital, por lo que en esta elección no vas a poder fiscalizar. Ojalá podamos contar con vos en las próximas 🙌. ¡Gracias por tus ganas de sumarte!

Lista4️⃣7️⃣💚

#VamosCtes
Juan Pablo Valdés Gobernador 
Cuqui Calvano Diputado
Claudio Polich Intendente 
Gaby Gauna Concejal`;
                }

                // 👉 Mostrar en consola antes de enviar
                console.log("🗳️ dondevotascript:", registro.dondevotascript);
                console.log("📞 Telefono:", telefono);
                console.log("📩 Mensaje a enviar:", mensaje);
                console.log("---------------------------------------------------");

                try {
                  await client.sendMessage(numeroFormateado, mensaje);
                    enviados++;
                } catch (err) {
                    console.error(`❌ Error enviando a ${telefono}`, err.message);
                }
            }
        }

        res.send(`✅ Se enviaron ${enviados} mensajes correctamente.`);
    } catch (error) {
        console.error('Error al enviar mensajes:', error);
        res.status(500).send('Error al enviar mensajes.');
    }
});


module.exports = router