const express = require('express')
const router = express.Router()
const { isLoggedIn, isLoggedInn, isLoggedInn2 } = require('../lib/auth') //proteger profile
const pool = require('../database')
const multer = require('multer')
const path = require('path')
const fse = require('fs').promises;
const fs = require('fs');
const axios = require('axios');
const { DEEPSEEK_API_KEY } = require(('../keys'))
const { GROQ_API_KEY } = require(('../keys'))
const { OPENAI_API_KEY } = require(('../keys'))
const client = require('./whatsapclient');
const cheerio = require("cheerio");
const config = require('./config.json'); // objeto directo
const personas = require('./personalidades.json');
const { format } = require("date-fns");
const { MessageMedia } = require("whatsapp-web.js");
const stringSimilarity = require("string-similarity");
///import { format } from "date-fns"; // si lo querés más cómodo
////solicitado== se suma al partido
////convocado,= s enevia a un juagdor la invitacion


function buscarPersonaEnTexto(texto) {
  const normalizado = normalizarr(texto);
  
  for (const persona of personas) {
    const nombreTokens = normalizarr(persona.nombre).split(/\s+/); // ["hugo","cuqui","calvano"]
    
    // contamos cuántos tokens matchean con fuzziness
    let coincidencias = 0;
    for (const token of nombreTokens) {
      const similitud = stringSimilarity.findBestMatch(token, normalizado.split(/\s+/));
      if (similitud.bestMatch.rating > 0.7) coincidencias++;
    }

    // ✅ Si al menos 2 tokens coinciden, lo consideramos un match
    if (coincidencias >= 2) return persona;
  }

  return null; // no encontró nada
}
const PROVIDER_ORDER = ["groq", "openai"]; // podes cambiar el orden o agregar más proveedores
const COOLDOWN_MS_BASE = 1000 * 60 * 2; // 2 minutos base de "enfriamiento" ante rate limit
function detectarPorKeywords(texto) {
  const lower = texto.toLowerCase();

  // Palabras relacionadas con comida
  const comidaKeywords = [
    "comer", "hambre", "almorzar", "cenar", "desayunar",
    "restaurante", "restaurantes", "bar", "bares", "pizzería",
    "pizza", "parrilla", "asado", "pescado", "chipa", "food",
    "cerveza", "cervecería", "empanada", "torta", "postre"
  ];

  if (comidaKeywords.some(k => lower.includes(k))) {
    return "donde_comer";
  }

  // Palabras relacionadas con eventos/turismo
  const turismoKeywords = [
    "qué hacer", "que hacer", "eventos", "show", "concierto", "recital",
    "festival", "feria", "peña", "baile", "cultura", "música", "musica",
    "exposición", "expo", "actividades", "qué hay", "que hay"
  ];

  if (turismoKeywords.some(k => lower.includes(k))) {
    return "turismo_general";
  }
const t = texto.toLowerCase();
  if (/(carnaval|corsos?)/i.test(t)) {
    return "carnaval";
  }

  // 🔹 Fiesta Nacional del Chamamé
  if (/(chamame|festival.*chamame|fiesta.*chamame)/i.test(t)) {
    return "chamame";
  }
  return null; // no detectado por keywords
}
  function normalizarTexto(str) {
  return str
    .toLowerCase()
    .normalize("NFD") // quita acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
// 🔎 Normaliza texto (sin tildes, minúsculas, sin comillas)
function normalizarr(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/["']/g, "")            // elimina comillas
    .trim();
}
let fechaISO = "";
const meses = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};
function now() { return Date.now(); }
function isInCooldown(provider) {
  return providerCooldowns[provider] && providerCooldowns[provider] > now();
}
function setCooldown(provider, factor = 1) {
  providerCooldowns[provider] = now() + COOLDOWN_MS_BASE * factor;
}

// heurística complejidad (podés alterar)
function esComplejaTexto(texto) {
  return (
    texto.length > 250 ||
    /(análisis|proyección|resumen|financiero|estrategia|riesgo|mercado)/i.test(texto)
  );
}

// detectar errores de rate limit
function isRateLimitError(err) {
  const status = err?.response?.status;
  const body = err?.response?.data || {};
  const msg = (err?.message || "").toLowerCase();
  if (status === 429) return true;
  if (typeof body === "object" && (body?.error?.code === "rate_limit_exceeded" || /rate_limit/i.test(JSON.stringify(body)))) return true;
  if (/please try again/i.test(msg) && /requested \d+/.test(msg)) return true;
  return false;
}

// request para GROQ (OpenAI-compatible endpoint en groq)
async function callGroq(model, messages, max_tokens = 500) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY no configurada");
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const payload = { model, messages, max_tokens };
  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 60000,
  });
  return res.data?.choices?.[0]?.message?.content;
}

// request para OpenAI oficial
async function callOpenAI(model, messages, max_tokens = 500) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY no configurada");
  const url = "https://api.openai.com/v1/chat/completions";
  const payload = { model, messages, max_tokens };
  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 60000,
  });
  return res.data?.choices?.[0]?.message?.content;
}

// wrapper que intenta llamar a un proveedor con retries
async function tryCallProvider(provider, model, messages, max_tokens = 500) {
  const maxRetries = 2;
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      if (provider === "groq") return await callGroq(model, messages, max_tokens);
      if (provider === "openai") return await callOpenAI(model, messages, max_tokens);
      throw new Error("Proveedor desconocido: " + provider);
    } catch (err) {
      attempt++;
      // Si es rate limit -> devolvemos explicitamente para que el caller pruebe otro provider
      if (isRateLimitError(err)) {
        // aumentamos cooldown proporcional al attempt
        setCooldown(provider, Math.min(4, attempt));
        throw Object.assign(new Error("rate_limit"), { isRateLimit: true, original: err });
      }
      // errores 5xx o timeouts -> reintentar con backoff
      const status = err?.response?.status || 0;
      if (status >= 500 || err.code === "ECONNABORTED") {
        const waitMs = 300 * attempt;
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      // otros errores: no reintentar
      throw err;
    }
  }
  throw new Error("Max retries alcanzado para proveedor " + provider);
}
function parsearFecha(fechaTexto) {
  // ejemplo: "19 de septiembre- 19:00"
  const match = fechaTexto.match(/(\d{1,2}) de (\w+)(?:.*?(\d{1,2}:\d{2}))?/i);
  if (!match) return null;

  const dia = parseInt(match[1], 10);
  const mesNombre = match[2].toLowerCase();
  const horaMin = match[3] || "00:00";

  const mes = meses[mesNombre];
  if (mes === undefined) return null;

  const [hora, min] = horaMin.split(":").map(Number);

  const now = new Date();
  const año = now.getFullYear();

  return new Date(año, mes, dia, hora, min);
}
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../imagenesvendedoras'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const OPENROUTER_API_KEY = DEEPSEEK_API_KEY; // tu clave en .env
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

let cacheMonedas = {
  timestamp: 0,
  info: {}
};

// Función para scrapear valores del sitio
async function obtenerValoresMonedas() {
  const { data } = await axios.get("https://dolarhoy.com/");
  const $ = cheerio.load(data);

  const dolarOficialCompra = $('div[data-currency="dolar-oficial"] .values .compra .val').first().text().trim();
  const dolarOficialVenta = $('div[data-currency="dolar-oficial"] .values .venta .val').first().text().trim();
  const dolarBlueCompra = $('div[data-currency="dolar-blue"] .values .compra .val').first().text().trim();
  const dolarBlueVenta = $('div[data-currency="dolar-blue"] .values .venta .val').first().text().trim();
  const dolarCCLCompra = $('div[data-currency="dolar-ccl"] .values .compra .val').first().text().trim();
  const dolarCCLVenta = $('div[data-currency="dolar-ccl"] .values .venta .val').first().text().trim();
  const dolarTuristaCompra = $('div[data-currency="dolar-turista"] .values .compra .val').first().text().trim();
  const dolarTuristaVenta = $('div[data-currency="dolar-turista"] .values .venta .val').first().text().trim();

  return {
    oficial: { compra: dolarOficialCompra, venta: dolarOficialVenta },
    blue: { compra: dolarBlueCompra, venta: dolarBlueVenta },
    ccl: { compra: dolarCCLCompra, venta: dolarCCLVenta },
    turista: { compra: dolarTuristaCompra, venta: dolarTuristaVenta }
  };
}

/* router.post("/preguntar", async (req, res) => {
  try {
    console.log("Cuerpo recibido:", req.body);

    const historial = req.body?.mensajes || req.body?.texto || [];
    console.log("Historial recibido:", historial);

    if (!Array.isArray(historial) || historial.length === 0) {
      return res.status(400).json({ error: "Historial inválido o vacío" });
    }

    const ultimaPregunta = historial[historial.length - 1]?.texto?.toLowerCase() || "";

    // Keywords para detectar moneda
    const keywordsDolar = ["dólar", "dolar", "usd", "dolar blue", "dólar blue", "ccl", "dólar turista"];
    const esMoneda = keywordsDolar.some(k => ultimaPregunta.includes(k));

    let infoMonedas = "";

    if (esMoneda) {
      const ahora = Date.now();

      if (cacheMonedas.timestamp && ahora - cacheMonedas.timestamp < 5 * 60 * 1000) {
        infoMonedas = cacheMonedas.infoStr;
        console.log("Usando cache de monedas");
      } else {
        const valores = await obtenerValoresMonedas();

        infoMonedas = 
          `Dólar oficial: compra ${valores.oficial.compra}, venta ${valores.oficial.venta}.\n` +
          `Dólar blue: compra ${valores.blue.compra}, venta ${valores.blue.venta}.\n` +
          `Dólar CCL: compra ${valores.ccl.compra}, venta ${valores.ccl.venta}.\n` +
          `Dólar turista: compra ${valores.turista.compra}, venta ${valores.turista.venta}.`;

        cacheMonedas = { timestamp: ahora, infoStr: infoMonedas };
        console.log("Cache de monedas actualizado");
      }

      // Si la pregunta es **solo sobre monedas**, devolvemos directamente
      const soloMoneda = historial.length === 1 && esMoneda;
      if (soloMoneda) {
        return res.json({ respuesta: infoMonedas, infoMonedas });
      }
    }

    // Construimos prompt para DeepSeek solo si hay algo más que procesar
    const messages = [
      {
        role: "system",
        content: "Eres un asesor financiero experto. Hablas con profesionalismo, claridad, calma y orientación práctica."
      },
      ...historial.slice(-10).map(m => ({
        role: m.de === "usuario" ? "user" : "assistant",
        content: (m.texto || "").trim()
      })),
      ...(infoMonedas ? [{ role: "system", content: `Información actual de monedas:\n${infoMonedas}` }] : [])
    ];

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "deepseek/deepseek-r1-0528",
        messages,
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Respuesta de DeepSeek:", response.data);

    const contenidoRespuesta = response.data?.choices?.[0]?.message?.content || "Sin respuesta";

    res.json({ respuesta: contenidoRespuesta, infoMonedas });
  } catch (error) {
    console.error("Error en /preguntar:", error.response?.data || error.message);
    res.status(500).json({ error: "Error interno al procesar la pregunta" });
  }
});
 */
const providerCooldowns = {}; // { groq: unixTimestamp, openai: unixTimestamp }
const historiales = {}; // si ya usabas historiales en otro módulo; adaptá
async function moderateMessage(texto) {
  const moderacion = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "meta-llama/llama-guard-4-12b",
      messages: [
        { role: "system", content: "Eres un moderador. Evalúa si el siguiente texto contiene violencia, odio, autolesiones o contenido inapropiado." },
        { role: "user", content: texto }
      ],
      max_tokens: 200
    },
    { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
  );
  return moderacion.data?.choices?.[0]?.message?.content || "Sin resultado";
}

// --- Lógica para elegir role/from config
function getRoleInfo(numero) {
  console.log("Buscando rol para:", numero);

  // Primero, revisamos si es psicólogo
  if (config.psicologos[numero]) {
    return { type: "psicologo", ...config.psicologos[numero] };
  }

  // Luego, revisamos si tiene un rol específico
  if (config.roles[numero]) {
    return config.roles[numero]; // tipo y persona
  }

  // Si no coincide nada, usamos el default
  return config.default;
}
async function analizarConsultaComplejaConProveedor(preferredProviders, numero, texto, systemPersona) {
  const analysisPrompt = `
Eres un analizador. Dados el siguiente mensaje de usuario, devuelve SOLO JSON válido con estas claves:
- "resumen": una frase que resume la solicitud.
- "objetivos": array de strings con lo que el usuario busca.
- "datos_necesarios": array de preguntas que el modelo debería hacer si falta info.
- "estructura": array de secciones sugeridas para la respuesta final.
Mensaje: ${texto}
  `.trim();

  // construimos mensajes para la llamada de análisis
  const messages = [
    { role: "system", content: systemPersona || "Eres un asistente que analiza consultas." },
    { role: "user", content: analysisPrompt }
  ];

  for (const provider of preferredProviders) {
    if (isInCooldown(provider)) continue;
    try {
      // intencionalmente pedimos un modelo chico/rápido
      const modelSmall = provider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o-mini";
      const raw = await tryCallProvider(provider, modelSmall, messages, 400);
      // intentar parsear JSON del raw (por si el LLM añadió texto, extraemos el JSON)
      const jsonText = raw.match(/\{[\s\S]*\}/);
      if (!jsonText) return null;
      try {
        const parsed = JSON.parse(jsonText[0]);
        return parsed;
      } catch (err) {
        // si no parsea, devolvemos null para continuar sin análisis
        return null;
      }
    } catch (err) {
      if (err?.isRateLimit) {
        // el caller hará fallback a otro proveedor
        continue;
      }
      // si falla, probamos siguiente proveedor
      continue;
    }
  }
  return null;
}
// --- Llamada general al modelo (mantengo la lógica de selección de modelo)
// --- Función principal mejorada ---
async function generateResponse(numero, texto, systemPersona = "", opts = {}) {
  // inicializar historiales
  if (!historiales[numero]) historiales[numero] = [];

  // evitar duplicar el push del usuario si ya lo hizo el llamador
  const last = historiales[numero][historiales[numero].length - 1];
  if (!(last && last.role === "user" && last.content === texto)) {
    historiales[numero].push({ role: "user", content: texto });
  }

  const esCompleja = esComplejaTexto(texto);
  // modelos por proveedor (pueden sobreescribirse por opts)
  const models = {
    groq: { small: "llama-3.1-8b-instant", large: "llama-3.3-70b-versatile" },
    openai: { small: "gpt-4o-mini", large: "gpt-4o" }
  };

  // Orden de proveedores (opts puede cambiar)
  const providersOrder = opts.providers || PROVIDER_ORDER;

  // 1) Si es compleja -> intentar análisis previo (modelo pequeño)
  let analisisPrevio = null;
  if (esCompleja) {
    try {
      analisisPrevio = await analizarConsultaComplejaConProveedor(providersOrder, numero, texto, systemPersona);
    } catch (err) {
      console.warn("No se pudo obtener análisis previo:", err?.message || err);
      analisisPrevio = null;
    }
  }

  // 2) Preparamos mensajes finales (pasamos el análisis como mensaje assistant para contexto)
  const messagesFinal = [
    { role: "system", content: systemPersona || "Sos un asistente." }
  ];
  if (analisisPrevio) {
    messagesFinal.push({
      role: "assistant",
      content: `ANALISIS_PREVIO: ${JSON.stringify(analisisPrevio)}`
    });
  }
  // anexamos todo el historial (user + assistant previos)
  messagesFinal.push(...historiales[numero]);

  // 3) Intentar proveedores en orden (fallback en rate limit)
  let lastError = null;
  for (const provider of providersOrder) {
    try {
      if (isInCooldown(provider)) {
        console.log(`[generateResponse] proveedor ${provider} en cooldown, lo salto.`);
        continue;
      }
      // elegimos modelo según complejidad
      const model = esCompleja ? (models[provider]?.large || models.groq.large) : (models[provider]?.small || models.groq.small);
      const max_tokens = esCompleja ? (opts.max_tokens || 1200) : (opts.max_tokens || 500);

      console.log(`[generateResponse] intentando ${provider} con modelo ${model} (max_tokens=${max_tokens})`);
      const respuesta = await tryCallProvider(provider, model, messagesFinal, max_tokens);

      // guardamos en historial y devolvemos
      historiales[numero].push({ role: "assistant", content: respuesta });
      return respuesta;
    } catch (err) {
      lastError = err;
      if (err?.isRateLimit) {
        console.warn(`[generateResponse] rate limit en ${provider} -> ${err.original?.message || err.message}`);
        // ya setCooldown fue aplicado en tryCallProvider
        continue; // probar siguiente proveedor
      }
      console.warn(`[generateResponse] error en proveedor ${provider}:`, err?.message || err);
      // si es error transitorio, la funcion tryCallProvider ya reintentó. Pasamos al siguiente proveedor.
      continue;
    }
  }

  // Si llegamos acá, fallaron todos los proveedores
  const mensajeFallback = "🤖 Lo siento, ahora mismo no puedo obtener una respuesta (todos los proveedores fallaron). Intentá de nuevo en un rato.";
  historiales[numero].push({ role: "assistant", content: mensajeFallback });

  // opcional: si querés devolver también el último error para logs:
  console.error("[generateResponse] Último error:", lastError?.message || lastError);
  return mensajeFallback;
}
/* ---------- HANDLER: PSICÓLOGO (consulta turnos) ---------- */
async function getTurnosForPsicologo(psicologoId, fromDate = new Date(), limit = 20) {
  // Usa prepared statements para evitar inyección
  const desde = fromDate.toISOString().slice(0, 19).replace('T', ' ');
  const rows = await pool.execute(
    "SELECT id, paciente_nombre, fecha, estado FROM dtc_turnos WHERE id_psico = ? AND fecha >= ? ORDER BY fecha LIMIT ?",
    [psicologoId, desde, limit]
  );
  return rows; // array de objetos
}
//////////////////////////////////psicologoS
///buscar id
async function getPsicologoIdByTelefono(telefono) {
  const rows = await pool.execute(
    "SELECT id FROM usuarios WHERE telefono = ? LIMIT 1",
    [telefono]
  );
  return rows.length > 0 ? rows[0].id : null;
}


/// 2. Analizar consulta con IA → JSON estructurado
// =======================
async function analizarConsultaTurismo(texto) {
    const keywordIntent = detectarPorKeywords(texto);
  if (keywordIntent) {
    return { intencion: keywordIntent };
  }
  const prompt = `
Eres un Licenciado en Turismo de Corrientes Capital, Argentina. Tambien un interprete de consultas, Tu tarea es interpretar consultas turísticas (incluso si están escritas con modismos o lenguaje coloquial).

Responde SOLO en JSON con la intención detectada.
Si no queda claro, usa { "intencion": "turismo_general" }

Intenciones posibles:
- "que_hacer_en_corrientes"
- "proximos_eventos"
- "eventos_por_mes"
- "eventos_por_rango"
- "eventos_generales"
- "carnaval" → cuando se mencionan corsos o carnavales de Corrientes.
- "chamame" → cuando se menciona el festival del chamamé o la fiesta nacional del chamamé.
- "donde_comer" → cuando el usuario habla de comida, hambre, restaurantes, bares, chipá, asado, almorzar o cenar.
- "turismo_general" → cuando el usuario pregunta por lugares, atractivos, islas, playas, plazas, costanera, río Paraná, museos u otros sitios turísticos.

Ejemplos:
Usuario: "Qué puedo hacer el 22 de septiembre en Corrientes"
Respuesta: { "intencion": "que_hacer_en_corrientes", "dia": "2025-09-22" }

Usuario: "Tengo hambre, dónde puedo ir a comer?"
Respuesta: { "intencion": "donde_comer" }

Usuario: "Dónde se come buen chipá?"
Respuesta: { "intencion": "donde_comer" }

Usuario: "Conocés la isla Meza?"
Respuesta: { "intencion": "turismo_general" }

Usuario: "Qué tal la costanera de Corrientes?"
Respuesta: { "intencion": "turismo_general" }

Usuario: "Hay algún evento este fin de semana?"
Respuesta: { "intencion": "proximos_eventos" }

Usuario: "${texto}"
Respuesta:
  `;
  console.log("Prompt para análisis de turismo:", texto);
  const raw = await generateResponse("analisis_turismo", prompt, "Analiza la consulta turística.");
  console.log("resuelve", raw);
  try {
    return JSON.parse(raw);
  } catch {
    return { intencion: "turismo_general" };
  }
}





// 3. Funciones SQL seguras
// =======================
async function getTurnosPorMes(psicologoId, mes, agendadopor = null) {
  let query = `
    SELECT t.fecha, t.detalle, t.agendadopor, p.nombre AS paciente_nombre
    FROM dtc_turnos t
    JOIN dtc_personas_psicologa p ON t.id_persona = p.id
    WHERE t.id_psico = ?
      AND MONTH(t.fecha) = ?
  `;
  const params = [psicologoId, mes];

  if (agendadopor) {
    query += " AND t.agendadopor = ?";
    params.push(agendadopor);
  }

  query += " ORDER BY t.fecha ASC";

  const rows = await pool.execute(query, params);

  return rows.map(t => ({
    ...t,
    fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm"),
  }));
}




///buscar por semana
async function getTurnosSemana(psicologoId, semana) {
  const rows = await pool.execute(
    `SELECT t.fecha, t.detalle, t.agendadopor, p.nombre AS paciente_nombre
     FROM dtc_turnos t
     JOIN dtc_personas_psicologa p ON t.id_persona = p.id
     WHERE t.id_psico = ?
       AND WEEK(t.fecha, 1) = ?
     ORDER BY t.fecha ASC`,
    [psicologoId, semana]
  );

  return rows.map(t => ({
    ...t,
    fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm"),
  }));
}
async function getTurnosPorDia(psicologoId, dia) {
  const rows = await pool.execute(
    `SELECT t.fecha, t.detalle, t.agendadopor, p.nombre AS paciente_nombre
     FROM dtc_turnos t
     JOIN dtc_personas_psicologa p ON t.id_persona = p.id
     WHERE t.id_psico = ? 
       AND DATE(t.fecha) = ?
     ORDER BY t.fecha ASC`,
    [psicologoId, dia]
  );

  return rows.map(t => ({
    ...t,
    fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm"),
  }));
}

async function getTurnosPorAgendador(psicologoId, agendadopor) {
  const rows = await pool.execute(
    `SELECT t.fecha, t.detalle, t.agendadopor, p.nombre AS paciente_nombre
     FROM dtc_turnos t
     JOIN dtc_personas_psicologa p ON t.id_persona = p.id
     WHERE t.id_psico = ?
       AND t.agendadopor = ?
       AND t.fecha >= CURDATE()
     ORDER BY t.fecha ASC`,
    [psicologoId, agendadopor]
  );

  return rows.map(t => ({
    ...t,
    fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm"),
  }));
}

async function getTurnosProximos(psicologoId) {
  console.log("Obteniendo turnos para psicólogo ID:", psicologoId);
  const rows = await pool.execute(
    `SELECT t.fecha, t.detalle, t.agendadopor, p.nombre AS paciente_nombre
     FROM dtc_turnos t
     JOIN dtc_personas_psicologa p ON t.id_persona = p.id
     WHERE t.id_psico = ? 
       AND t.fecha >= CURDATE()
     ORDER BY t.fecha ASC
     LIMIT 10`,
    [psicologoId]
  );
  console.log(rows)
  return rows.map(t => ({
    ...t,
    fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm"),
  }));
}
// 4. Resolver la consulta
// =======================
async function resolverConsultaTurnos(numero, texto) {
  console.log("🔍 Resolviendo consulta de turnos para:", numero, texto);
  const psicologoId = await getPsicologoIdByTelefono(numero);
  if (!psicologoId) return "⚠️ No encontré tu usuario en el sistema.";

  const consulta = await analizarConsultaTurnos(texto);
  console.log("📊 Consulta interpretada:", consulta);

  let turnos = [];

  switch (consulta.intencion) {
    case "turnos_por_mes":
      turnos = await getTurnosPorMes(psicologoId, consulta.mes, consulta.agendadopor);
      break;
    case "turnos_por_semana":
      turnos = await getTurnosSemana(psicologoId, consulta.semana);
      break;
    case "turnos_por_dia":
      turnos = await getTurnosPorDia(psicologoId, consulta.dia);
      break;
    case "turnos_por_rango":
      turnos = await getTurnosPorRango(psicologoId, consulta.desde, consulta.hasta);
      break;
    case "turnos_por_paciente":
      turnos = await getTurnosPorPaciente(psicologoId, consulta.paciente);
      break;
    case "turnos_por_estado":
      turnos = await getTurnosPorEstado(psicologoId, consulta.estado);
      break;
    case "turnos_por_presencia":
      turnos = await getTurnosPorPresencia(psicologoId, consulta.presente);
      break;
    case "turnos_por_agendador":
      turnos = await getTurnosPorAgendador(psicologoId, consulta.agendadopor);
      break;
    case "turnos_con_observaciones":
      turnos = await getTurnosConObservaciones(psicologoId);
      break;
    case "turnos_generales":
    default:
      turnos = await getTurnosProximos(psicologoId);
      break;
  }


  if (turnos.length === 0) {
    return "📋 No tienes turnos registrados para ese período.";
  }

  return turnos
    .map(
      t => `🧑‍⚕️ ${t.paciente_nombre} - ${t.fecha} ${t.detalle} (Agendado por: ${t.agendadopor})`
    )
    .join("\n");
}


async function handlePsychologist(numero, texto, message) {
  const info = config.psicologos[numero];
  if (!info) {
    await message.reply("No reconozco tu número como psicólogo registrado.");
    return;
  }

  console.log("informacion lina 404", numero);

  // Caso directo: "mis turnos" o "turnos"
  if (/^\s*(mis turnos|turnos)\b/i.test(texto)) {
    const turnos = await getTurnosProximos(info.id);
    if (!turnos.length) {
      await message.reply("No tenés turnos otorgados próximos.");
      return;
    }
    const respuesta = [
      "📅 Tus próximos turnos:",
      ...turnos.map(
        t => `🧑‍⚕️ ${t.paciente_nombre} - ${t.fecha} ${t.detalle} (Agendado por: ${t.agendadopor})`
      ),
    ].join("\n");
    await message.reply(respuesta);
    return;
  }

  // Caso: consulta más compleja
  try {
    const respuestaConsulta = await resolverConsultaTurnos(numero, texto);
    if (respuestaConsulta && !respuestaConsulta.startsWith("⚠️")) {
      await message.reply(respuestaConsulta);
      return;
    }
  } catch (err) {
    console.error("Error en resolverConsultaTurnos:", err);
  }

  // Fallback: mandar al LLM como antes
  const persona = `Eres el asistente que responde al psicólogo ${info.name}. Responde breve y profesional.`;
  const respuesta = await generateResponse(numero, texto, persona);
  await message.reply(respuesta);
}

async function fetchPriceCheerio(url, selector = null) {
  const key = `price:${url}:${selector || "auto"}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const resp = await axios.get(url, { timeout: 8000, headers: { "User-Agent": "dtc-bot/1.0 (+https://tu-dominio)" } });
  const html = resp.data;
  if (selector) {
    const $ = cheerio.load(html);
    const text = $(selector).first().text().trim();
    if (text) { cacheSet(key, text); return text; }
  }
  // fallback regex
  const found = extractPriceFromHtml(html);
  if (found) { cacheSet(key, found); return found; }
  return null;
}

// Simple parse: si el mensaje menciona "bitcoin" o "dolar" o pega una URL
function detectSymbolOrUrl(text) {
  const urlMatch = text.match(/https?:\/\/\S+/);
  if (urlMatch) return { type: "url", value: urlMatch[0] };
  if (/bitcoin|btc/i.test(text)) return { type: "symbol", value: "bitcoin" };
  if (/dolar|usd/i.test(text)) return { type: "symbol", value: "dolar" };
  return null;
}

async function handleInvestmentAdvisor(numero, texto, message) {
  // Detectar lo que pide el usuario
  const target = detectSymbolOrUrl(texto);
  if (!target) {
    // Pide más info (o reenvía al LLM con rol de asesor)
    const persona = "Eres un asesor de inversiones. Pregunta al usuario qué activo o qué cotización quiere (ej: BTC, DOLAR, o enviar URL).";
    const respuesta = await generateResponse(numero, texto, persona);
    await message.reply(respuesta);
    return;
  }

  if (target.type === "url") {
    try {
      const price = await fetchPriceCheerio(target.value);
      if (price) await message.reply(`Cotización extraída: ${price}\n(Recordá que es un dato extraído; verificar con fuente oficial).`);
      else await message.reply("No pude extraer un precio de esa página. ¿Podés pasar otra URL o decir el activo?");
    } catch (err) {
      console.error(err);
      await message.reply("Error al obtener la página. Probá nuevamente más tarde.");
    }
    return;
  }

  // símbolo conocido -> tratar con fuentes conocidas o scraping de una URL conocida
  if (target.value === "bitcoin") {
    // ejemplo: usar coinmarketcap, pero ojo con TOS; se recomienda API oficial. Aquí ejemplo genérico.
    const url = "https://coinmarketcap.com/currencies/bitcoin/";
    try {
      const price = await fetchPriceCheerio(url, ".priceValue"); // selector ejemplo; puede variar
      if (price) await message.reply(`Bitcoin: ${price} (fuente: coinmarketcap)`);
      else {
        // fallback: extraer por regex de la página
        const fallback = await fetchPriceCheerio(url, null);
        if (fallback) await message.reply(`Bitcoin (fallback): ${fallback}`);
        else await message.reply("No pude extraer la cotización de Bitcoin de la fuente. Recomendado usar una API oficial.");
      }
    } catch (err) {
      console.error(err);
      await message.reply("Error al consultar cotización de Bitcoin. Probar de nuevo más tarde.");
    }
    return;
  }

  if (target.value === "dolar") {
    // ejemplo: scraping a una página pública (selector variable)
    const url = "https://www.cronista.com/MercadosOnline/dolar.html"; // ejemplo; selector no garantizado
    try {
      const price = await fetchPriceCheerio(url, null);
      if (price) await message.reply(`Dólar aproximado: ${price} (dato scrapeado).`);
      else await message.reply("No pude obtener la cotización del dólar. Podés darme una URL.");
    } catch (err) {
      console.error(err);
      await message.reply("Error al consultar el dólar. Intenta más tarde.");
    }
    return;
  }
}

/* ---------- HANDLER: ASESOR JURÍDICO Y ASISTENTE SOCIAL ---------- */
async function handleLegalAdvisor(numero, texto, message) {
  const persona = "Eres un asesor jurídico. Responde como orientación general, incluye disclaimer: no es asesoramiento legal vinculante.";
  const respuesta = await generateResponse(numero, texto, persona);
  await message.reply(respuesta);
}

async function handleAsistenteSocial(numero, texto, message) {
  const persona = "Eres un asistente social del DTC. Responde con empatía, derivaciones locales, y opciones prácticas.";
  const respuesta = await generateResponse(numero, texto, persona);
  await message.reply(respuesta);
}

/* ---------- ORQUESTADOR PRINCIPAL ---------- */

// acá elegís el modelo ///  Llama-3.3-70B-Versatile/// Meta-Llama/Llama-Guard-4-12B
router.post("/preguntar", async (req, res) => {
  try {
    const historial = req.body?.mensajes || req.body?.texto || [];
    if (!Array.isArray(historial) || historial.length === 0) {
      return res.status(400).json({ error: "Historial inválido o vacío" });
    }

    const ultimaPregunta = historial[historial.length - 1]?.texto || "";

    // =======================================
    // 🔹 Paso 1: Moderación con Llama-Guard
    // =======================================
    const moderacion = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-guard-4-12b",
        messages: [
          {
            role: "system",
            content:
              "Eres un moderador. Evalúa si el siguiente texto contiene violencia, discurso de odio, autolesiones o contenido no permitido."
          },
          { role: "user", content: ultimaPregunta }
        ],
        max_tokens: 200
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const resultadoModeracion = moderacion.data?.choices?.[0]?.message?.content || "No se pudo moderar";

    console.log("🔍 Resultado de moderación:", resultadoModeracion);

    // Si la moderación detecta problema (ejemplo: contiene "no permitido")
    if (/no permitido|prohibido|violencia|odio/i.test(resultadoModeracion)) {
      return res.status(400).json({
        error: "La consulta contiene contenido inapropiado",
        moderacion: resultadoModeracion
      });
    }

    // =======================================
    // 🔹 Paso 2: Selección híbrida de modelo
    // =======================================
    const esCompleja =
      ultimaPregunta.length > 250 ||
      /(análisis|proyección|resumen|financiero|estrategia|riesgo|mercado)/i.test(
        ultimaPregunta
      );

    const modelo = esCompleja
      ? "llama-3.3-70b-versatile"
      : "llama-3.1-8b-instant";

    console.log(`⚡ Usando modelo: ${modelo}`);

    const messages = [
      {
        role: "system",
        content:
          "Eres un asesor financiero experto. Hablas con profesionalismo, claridad, calma y orientación práctica."
      },
      ...historial.slice(-10).map(m => ({
        role: m.de === "usuario" ? "user" : "assistant",
        content: (m.texto || "").trim()
      }))
    ];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: modelo,
        messages,
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const contenidoRespuesta =
      response.data?.choices?.[0]?.message?.content || "Sin respuesta";

    res.json({
      respuesta: contenidoRespuesta,
      modeloUsado: modelo,
      moderacion: resultadoModeracion
    });
  } catch (error) {
    console.error("Error en /preguntar:", error.response?.data || error.message);
    res.status(500).json({ error: "Error interno al procesar la pregunta" });
  }
});
router.post("/crearpartido", async (req, res) => {
  try {
    const {
      usuario_id,
      cancha,
      barrio,
      ciudad,
      fecha,
      hora,
      tipo,
      cupo,
      nivel,
      tipofutbol,
      sebusca
    } = req.body;

    let cancha_id = cancha;

    if (barrio && ciudad) {
      // Es una nueva cancha
      const insertCancha = await pool.query(
        "INSERT INTO canchas (nombre, barrio, ciudad) VALUES (?, ?, ?)",
        [cancha, barrio, ciudad]
      );
      cancha_id = insertCancha.insertId;
    }

    // Valores por defecto si no están definidos
    const nivelDef = nivel ?? "Sin especificar";
    const tipofutbolDef = tipofutbol ?? "Futbol 5";
    const sebuscaDef = sebusca ?? "Jugadores";

    // Crear partido
    await pool.query(
      `INSERT INTO partidos 
      (id_creador, cancha, fecha, hora, tipo, cupo, nivel, tipofutbol, sebusca) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, cancha_id, fecha, hora, tipo, cupo, nivelDef, tipofutbolDef, sebuscaDef]
    );

    res.status(200).json({ message: "Partido creado con éxito" });

  } catch (error) {
    console.error("Error al crear partido:", error);
    res.status(500).json({ error: "Error interno al crear el partido" });
  }
});



router.get('/traermovimientos/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)
  const productosdeunapersona = await pool.query('select * from esme_movimientos join(select id as idp, id_usuario as idusuario,producto from esme_productos) as sel on esme_movimientos.id_producto=sel.idp where idusuario=? order by id desc', [id])
  res.json(productosdeunapersona)

})

router.get('/traercanchas', async (req, res) => {


  const productosdeunapersona = await pool.query('select * from canchas order by nombre')
  res.json(productosdeunapersona)

})

router.get('/traerligas', async (req, res) => {


  const productosdeunapersona = await pool.query('select * from ligas order by nombre')

  res.json(productosdeunapersona)

})




router.post('/traerpartidos', async (req, res) => {
  const { id_usuario } = req.body;
  try {
    // Traer todos los partidos con datos de cancha y usuario creador
    const partidos = await pool.query(`
      SELECT 
        p.*, 
        c.nombre AS nombrecancha, 
        c.barrio,
        u.usuario,
        s.estado AS estado_sumada
      FROM partidos p
      JOIN canchas c ON p.cancha = c.id
      JOIN usuarios u ON p.id_creador = u.id
      LEFT JOIN sumadas s ON s.id_partido = p.id AND s.id_solicitante = ?
      ORDER BY p.id DESC
    `, [id_usuario || 0]); // si no hay usuario, pone 0 que no va a coincidir
    res.json(partidos);
  } catch (error) {
    console.error("Error al traer partidos:", error);
    res.status(500).json({ error: 'Error al traer partidos' });
  }
});
router.post("/sumarsepartido", async (req, res) => {
  const { id_partido, id_usuario } = req.body;

  try {
    console.log("Recibido:", id_partido, id_usuario);

    // Verificar si ya existe
    const existe = await pool.query(
      "SELECT * FROM sumadas WHERE id_partido = ? AND id_solicitante = ?",
      [id_partido, id_usuario]
    );

    if (existe.length > 0) {
      return res.status(400).json({ mensaje: "Ya te has unido a este partido" });
    }

    // Si no existe, insertamos
    await pool.query(
      "INSERT INTO sumadas (id_partido, id_solicitante) VALUES (?, ?)",
      [id_partido, id_usuario]
    );

    res.status(200).json({ mensaje: "Solicitud enviada correctamente" });
  } catch (error) {
    console.error("Error al insertar en sumadas:", error);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});


/////postularse a un equipo
router.post("/convocarajugador", async (req, res) => {
  const {
    jugador_id,
    convocador_id,
    fecha,
    hora,
    mensaje,
    pagar,
    gratis,
    cancha,
    nueva_cancha_info
  } = req.body;

  try {
    let cancha_id = cancha;

    if (
      nueva_cancha_info &&
      nueva_cancha_info.nombre &&
      nueva_cancha_info.barrio &&
      nueva_cancha_info.ciudad
    ) {
      const insertCancha = await pool.query(
        "INSERT INTO canchas (nombre, barrio, ciudad) VALUES (?, ?, ?)",
        [
          nueva_cancha_info.nombre,
          nueva_cancha_info.barrio,
          nueva_cancha_info.ciudad
        ]
      );
      cancha_id = insertCancha.insertId;
    }



    const id_partido = insertPartido.insertId;

    // INSERT en sumadas
    await pool.query(
      `INSERT INTO sumadas 
      (id_partido, id_solicitante, estado, fecha_solicitud) 
      VALUES (?, ?, ?, NOW())`,
      [
        id_partido,
        jugador_id,
        'convocado'
      ]
    );

    console.log("Datos registrados:", {
      id_partido,
      jugador_id,
      convocador_id,
      fecha,
      hora,
      mensaje,
      pagar,
      gratis,
      cancha_id,
      nueva_cancha_info
    });

    res.json({ status: "ok", id_partido });

  } catch (error) {
    console.error("Error al convocar jugador:", error);
    res.status(500).json({ error: "Error interno" });
  }
});



router.post("/convocarajugadordirecto", async (req, res) => {
  const {
    jugador_id,
    convocador_id,
    fecha,
    hora,
    mensaje,
    pagar,
    gratis,
    cancha,
    nueva_cancha_info
  } = req.body;

  try {
    console.log('convocado')
    let cancha_id = cancha;
    console.log('a')
    // Si envían nueva cancha => insertarla
    if (
      nueva_cancha_info &&
      nueva_cancha_info.nombre &&
      nueva_cancha_info.barrio &&
      nueva_cancha_info.ciudad
    ) {
      const insertCancha = await pool.query(
        "INSERT INTO canchas (nombre, barrio, ciudad) VALUES (?, ?, ?)",
        [
          nueva_cancha_info.nombre,
          nueva_cancha_info.barrio,
          nueva_cancha_info.ciudad
        ]
      );
      cancha_id = insertCancha.insertId;
    }

    // Insertar convocatoria directa

    await pool.query(
      `INSERT INTO convocatoria_directa 
      (estado, jugador_id, convocador_id, mensaje, fecha, hora, fecha_solicitud) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        'convocado', // valor para columna 'convocatoria_directacol'
        jugador_id,
        convocador_id,
        mensaje || '',
        fecha || '',
        hora || ''
      ]
    );

    console.log("Datos registrados en convocatoria_directa:", {
      jugador_id,
      convocador_id,
      fecha,
      hora,
      mensaje,
      pagar,
      gratis,
      cancha_id,
      nueva_cancha_info
    });

    res.json({ status: "ok" });

  } catch (error) {
    console.error("Error al registrar convocatoria directa:", error);
    res.status(500).json({ error: "Error interno" });
  }
});





router.post("/traernotificaciones", async (req, res) => {
  const { id } = req.body;

  try {
    console.log("Recibido:", id);

    // Verificar si ya existe
    const existe = await pool.query(
      "SELECT * FROM sumadas  join ( select id as idp, id_creador  from partidos) as sel on sumadas.id_partido=idp WHERE id_creador = ? AND estado = ?",
      [id, "solicitado"]
    );

    const directas = await pool.query(
      "SELECT * FROM convocatoria_directa  join (select id as idp, nombre, apodo from usuarios) as sel on convocatoria_directa.convocador_id=sel.idp WHERE jugador_id = ? AND estado = ?",
      [id, "convocado"]
    );

    res.status(200).json([existe, directas]);
  } catch (error) {
    console.error("Error al insertar en sumadas:", error);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});




router.post("/responderconvocatoriadirecta", async (req, res) => {
  const { id, respuesta } = req.body;

  // Validar la respuesta
  const nuevoEstado = respuesta === 'aceptar' ? 'Aceptado' :
    respuesta === 'rechazar' ? 'Rechazado' :
      null;

  if (!nuevoEstado) {
    return res.status(400).json({ error: "Respuesta inválida" });
  }

  try {
    await pool.query(
      "UPDATE convocatoria_directa SET estado = ? WHERE id = ?",
      [nuevoEstado, id]
    );

    res.json({ mensaje: `Convocatoria actualizada como ${nuevoEstado}` });
  } catch (error) {
    console.error('Error al actualizar convocatoria directa:', error);
    res.status(500).json({ error: "Error al actualizar convocatoria directa" });
  }
});


router.post("/traersolicitudes", async (req, res) => {
  const { id } = req.body;

  try {


    // Verificar si ya existe
    const existe = await pool.query(
      "SELECT * FROM sumadas  join ( select id as idp, id_creador  from partidos) as sel on sumadas.id_partido=idp join (select id as idu, nombre as nombresol, posicion, apodo, fecha_nacimiento, no_pago_cancha,me_sumo_disponible,es_pago  from usuarios )as sel2 on sumadas.id_solicitante=sel2.idu WHERE id_creador = ? ",
      [id]


    );

    const existedirectas = await pool.query(
      "SELECT * FROM convocatoria_directa join (select id as idconcovado, nombre as nombreconvocado, apodo from usuarios)as sel on convocatoria_directa.jugador_id=sel.idconcovado WHERE jugador_id = ? or convocador_id = ? ", [id, id]


    );

    res.status(200).json([existe, existedirectas]);
  } catch (error) {
    console.error("Error al insertar en sumadas:", error);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});
// Confirmar solicitud
router.post('/confirmar', async (req, res) => {
  const { id_solicitud } = req.body;
  try {
    await pool.query('UPDATE sumadas SET estado = ? WHERE id = ?', ['confirmado', id_solicitud]);
    res.status(200).json({ message: 'Solicitud confirmada' });
  } catch (error) {
    console.error('Error al confirmar:', error);
    res.status(500).json({ error: 'Error al confirmar solicitud' });
  }
});

// Rechazar solicitud
router.post('/rechazar', async (req, res) => {
  const { id_solicitud } = req.body;
  try {
    await pool.query('UPDATE sumadas SET estado = ? WHERE id = ?', ['rechazado', id_solicitud]);
    res.status(200).json({ message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error al rechazar:', error);
    res.status(500).json({ error: 'Error al rechazar solicitud' });
  }
});

////
router.post("/cancelarconvocatoria", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM convocatoria_directa WHERE id = ?", [id]);
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error al cancelar convocatoria:", error);
    res.status(500).json({ error: "Error al cancelar convocatoria" });
  }
});


// Reestablecer estado (pendiente o solicitado)
router.post('/marcarPendiente', async (req, res) => {
  const { id_solicitud, nuevo_estado } = req.body;



  try {
    await pool.query('UPDATE sumadas SET estado = ? WHERE id = ?', ["solicitado", id_solicitud]);
    res.status(200).json({ message: `Solicitud restablecida a ${nuevo_estado}` });
  } catch (error) {
    console.error('Error al restablecer:', error);
    res.status(500).json({ error: 'Error al restablecer solicitud' });
  }
});



router.post('/traerJugadores', async (req, res) => {

  try {
    respuesta = await pool.query('select * from usuarios')
    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error al confirmar:', error);
    res.status(500).json({ error: 'Error al confirmar solicitud' });
  }
});



router.post('/traerJugador', async (req, res) => {
  const { id_usuario } = req.body;
  try {
    respuesta = await pool.query('select * from usuarios where id=?', [id_usuario])
    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error al confirmar:', error);
    res.status(500).json({ error: 'Error al confirmar solicitud' });
  }
});

router.post('/modificarJugador', async (req, res) => {
  const {
    id,
    nombre,
    apodo,
    telefono,
    dias_disponibles,
    horarios_disponibles,
    es_pago,
    no_pago_cancha,
    me_sumo_disponible,
    monto_a_cobrar // ✅ nuevo campo
  } = req.body;

  console.log("ID del jugador:", id);

  const toSiNo = (valor, actual) => {
    if (valor === undefined) return actual;
    return valor === true || valor === "true" ? "Si" : "No";
  };

  try {
    const usuarioActual = await pool.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (!usuarioActual.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = usuarioActual[0];

    const nuevoNombre = nombre ?? usuario.nombre;
    const nuevoApodo = apodo ?? usuario.apodo;
    const nuevoTelefono = telefono ?? usuario.telefono;
    const nuevosDias = dias_disponibles ?? usuario.dias_disponibles;
    const nuevoHorario = horarios_disponibles ?? usuario.horarios_disponibles;

    const nuevoPago = toSiNo(es_pago, usuario.es_pago);
    const nuevoNoPagoCancha = toSiNo(no_pago_cancha, usuario.no_pago_cancha);
    const nuevoMeSumoDisponible = toSiNo(me_sumo_disponible, usuario.me_sumo_disponible);

    const nuevoMontoACobrar = monto_a_cobrar !== undefined
      ? monto_a_cobrar
      : usuario.monto_a_cobrar;

    const diasParaGuardar = Array.isArray(nuevosDias)
      ? JSON.stringify(nuevosDias)
      : JSON.stringify([]);

    await pool.query(
      `UPDATE usuarios 
       SET nombre = ?, apodo = ?, telefono = ?, dias_disponibles = ?, horarios_disponibles = ?, 
           es_pago = ?, no_pago_cancha = ?, me_sumo_disponible = ?, monto_a_cobrar = ?
       WHERE id = ?`,
      [
        nuevoNombre,
        nuevoApodo,
        nuevoTelefono,
        diasParaGuardar,
        nuevoHorario,
        nuevoPago,
        nuevoNoPagoCancha,
        nuevoMeSumoDisponible,
        nuevoMontoACobrar,
        id
      ]
    );

    res.json({ message: 'Usuario actualizado correctamente', id });

  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
});



//////////////////TURISMO


client.on("message", async (message) => {
  try {
    if (!message || !message.body) return;
    const texto = message.body.trim();
    const numero = message.from;

    // Moderación
    const moderacion = await moderateMessage(texto);
    console.log(`Moderación (${numero}):`, moderacion);
    if (/no permitido|prohibido|violencia|odio/i.test(moderacion)) {
      await message.reply("🚫 Tu mensaje contiene contenido inapropiado.");
      return;
    }

    // Determinar rol

    const roleInfo = getRoleInfo(numero);
    console.log("Rol", roleInfo);
    // dispatch
    if (roleInfo.type == "psicologo") {
      await handlePsychologist(numero, texto, message);
    } /* else if (roleInfo.type === "asesor_inversiones") {
      await handleInvestmentAdvisor(numero, texto, message);
    } else if (roleInfo.type === "asesor_juridico") {
      await handleLegalAdvisor(numero, texto, message);
    } else if (roleInfo.type === "asistente_social") {
      await handleAsistenteSocial(numero, texto, message);
    } */ else {
      // default -> LLM
      await handleTourismAdvisor(numero, texto, message);
      /*   const persona = roleInfo.persona || config.default.persona;
        const respuesta = await generateResponse(numero, texto, persona);
        await message.reply(respuesta); */
    }
  } catch (error) {
    console.error("Error procesando mensaje:", error.response?.data || error.message);
    await message.reply("⚠️ Hubo un error al procesar tu consulta.");
  }
});



// 📌 Memoria temporal de eventos por usuario (teléfono)
const memoriaEventos = {};

async function handleTourismAdvisor(numero, texto, message) {


    const persona = buscarPersonaEnTexto(texto);
  if (persona) {
    await message.reply(
      `👤 *${persona.nombre}*\n` +
      `📌 ${persona.tipo}\n` +
      `📖 ${persona.descripcion}\n` +
      (persona.rol ? `🎭 Rol: ${persona.rol}\n` : "") +
      (persona.origen ? `🌍 Origen: ${persona.origen}\n` : "") +
      (persona.edad ? `🎂 Edad: ${persona.edad}\n` : "")
    );
    return; // ✅ Salimos, no seguimos con turismo
  }


  const consulta = await analizarConsultaTurismo(texto);



if (/^(mas\s*info|informacion|info)/i.test(normalizarTexto(texto))) {
  console.log("➡ Entra en MAS INFO");

  const query = normalizarTexto(texto)
    .replace(/^(mas\s*info|informacion|info)\s*/, ""); // borra el prefijo
  console.log("query normalizado:", query);

  const eventosGuardados = memoriaEventos[numero] || [];
  console.log("eventosGuardados:", eventosGuardados.map(e => e.titulo));

  const evento = eventosGuardados.find(e =>
    normalizarTexto(e.titulo).includes(query)
  );

  if (!evento) {
    await message.reply("⚠️ No encontré un evento con ese nombre. Probá escribirlo de nuevo o pedir la lista de eventos.");
    return;
  }

  console.log("evento", evento);
  const detalle = await getEventoDetalle(evento.enlace);
  console.log("detalle", detalle);
  if (!detalle) {
    await message.reply("⚠️ No pude obtener más información del evento.");
    return;
  }
console.log("enviando mensaje ");
console.log(  `🎶 *${detalle.titulo}*\n📅 fecha ${evento.fecha}\n\n${detalle.categorias}`)
  await message.reply(
    `🎶 *${evento.titulo}*\n📅 fecha ${evento.fecha}\n\n${detalle.categorias}`,
    //{ media: { url: detalle.imagen } } // 👈 adjunta la imagen
  );
  console.log("listo");
  return;
}


  // ================== DÓNDE COMER ==================
  if (consulta.intencion === "donde_comer") {
    await message.reply("⏳ Estoy buscando opciones para comer o salir en Corrientes...");

    const categoriaPedida = await detectarCategoriaComida(texto);
    console.log("Categoria pedida:", categoriaPedida);

    let lugares = [];
    if (["bar", "cervecería", "pizzería"].includes(categoriaPedida.categoria)) {
      lugares = await getBaresCorrientes();
    } else {
      lugares = await getRestaurantesCorrientes();
    }

    if (!lugares.length) {
      await message.reply("⚠️ No pude obtener lugares en este momento.");
      return;
    }

    // 🔹 Filtrar si corresponde
    let filtrados = lugares;
    if (categoriaPedida.categoria !== "otro") {
      filtrados = lugares.filter(r =>
        r.tipo === categoriaPedida.categoria ||
        r.categorias.toLowerCase().includes(categoriaPedida.categoria)
      );
    }

    if (!filtrados.length) {
      filtrados = lugares; // fallback
    }

    // ✅ Todo en un solo mensaje
    const respuesta =
      "🍽️ Opciones para comer/salir en Corrientes:\n\n" +
      filtrados
        .map(
          lugar =>
            `🍻 *${lugar.nombre}*\n_${lugar.categorias}_\n👉 Escribí *${lugar.nombre}* para más info\n`
        )
        .join("\n\n");

    await message.reply(respuesta);
    return;
  }

  // ================== EVENTOS ==================
if (consulta.intencion === "turismo_general") {
  await message.reply("⏳ Estoy buscando los próximos eventos en Corrientes...");

  const eventos = await getEventosCorrientes();
  if (!eventos.length) {
    await message.reply("⚠️ No pude obtener eventos en este momento.");
    return;
  }

  // 🔹 Guardamos en memoria para consultas posteriores
  memoriaEventos[numero] = eventos;

  // Texto principal con todos los eventos
  let textoMensaje = "🎉 Próximos eventos en Corrientes:\n\n";
  eventos.forEach((evento, idx) => {
    textoMensaje += `${idx + 1}. *${evento.titulo}*\n📅 ${evento.fecha}\n📍 ${evento.lugar}\n👉 Escribí: mas info ${evento.titulo}\n\n`;
  });

  await message.reply(textoMensaje);
  return;
}


  // ================== MÁS INFO EVENTO ==================
  if (texto.toLowerCase().startsWith("evento ")) {
    const partes = texto.split(" ");
    const indice = parseInt(partes[1]) - 1;

    const eventosGuardados = memoriaEventos[numero] || [];
    const evento = eventosGuardados[indice];

    if (!evento) {
      await message.reply("⚠️ No encontré ese evento. Probá con otro número.");
      return;
    }

    const detalle = await getEventoDetalle(evento.url);
    if (!detalle) {
      await message.reply("⚠️ No pude obtener más información del evento.");
      return;
    }

    await message.reply(
      `🎶 *${detalle.titulo}*\n📅 ${detalle.fecha}\n\n${detalle.descripcion}\n\n🔗 ${detalle.url}`
    );
    return;
  }

if (consulta.intencion === "carnaval") {
  const infoCarnaval = `
🎭 *Carnavales de Corrientes 2026*  
📅 Del *31 de enero al 28 de febrero* en el Corsódromo Nolo Alias.  

✨ Fechas clave:  
- 31 de enero al 28 de febrero: Desfiles en el Corsódromo.  
- 4, 8 y 11 de febrero: Shows de comparsas en el Anfiteatro Cocomarola.  
- 22 de febrero: Duelo de baterías en el Parque Camba Cuá.  
- 26 de febrero: Elección de embajadores.  

💃 Qué esperar: música litoraleña, trajes coloridos, comparsas y la magia del carnaval.  
Corrientes es la *Capital Nacional del Carnaval*.  
  `;
  await message.reply(infoCarnaval);
  return;
}

// ================== CHAMAMÉ ==================
if (consulta.intencion === "chamame") {
  const infoChamame = `
🎶 *Fiesta Nacional del Chamamé 2026*  
📅 Del *16 al 25 de enero de 2026*  
📍 *Anfiteatro Mario del Tránsito Cocomarola*, Corrientes  

🎼 35ª Fiesta Nacional del Chamamé  
21ª Fiesta del Chamamé del MERCOSUR  
5ª Celebración Mundial del Chamamé  

🌎 Bajo el lema *"Chamamé, refugio de nuestra identidad"*, participan artistas de Argentina, Brasil, Paraguay y Uruguay.  
💃 Un evento único que celebra nuestra música, danza y raíces culturales.  
  `;
  await message.reply(infoChamame);
  return;
}
  // ================== SALUDO / OTRA COSA ==================
if (consulta.intencion === "otra_cosa") {
  // 🔎 Buscar si coincide con un lugar específico
  const restaurantes = await getRestaurantesCorrientes();
  const bares = await getBaresCorrientes();
  const todos = [...restaurantes, ...bares];

  const match = todos.find(r =>
    r.nombre.toLowerCase() === texto.toLowerCase()
  );

  if (match) {
    const detalle = await getRestauranteDetalle(match.enlace);
    const respuesta =
      `📍 Dirección: ${detalle.direccion}\n` +
      `📞 Tel: ${detalle.telefono}\n` +
      `🔗 Redes: ${detalle.redes.join(", ") || "N/A"}`;
    await message.reply(respuesta);
    return;
  }

  // 🧠 Si no coincide con un lugar → uso de LLM con GROQ
const systemPersona =
  "Sos un bot especializado en Turismo de Corrientes Capital, Argentina. " +
  "⚠️ Nunca inventes lugares que no existan. Si no sabés algo, decí claramente que no tenés esa info. " +
  "Tu objetivo principal es persuadir al usuario para que pregunte sobre: " +
  "👉 eventos próximos en Corrientes o 👉 dónde comer/tomar algo en la ciudad. " +
  "No recomiendes atracciones turísticas generales ni inventes nombres. " +
  "En vez de dar datos que no existen, respondé con frases amigables que inviten al usuario a preguntar sobre gastronomía o eventos. "+
  "Ejemplo: ' si querés te cuento qué eventos se vienen o dónde podés comer algo rico 🍲🍻'. " +
  "Recordá: tu creador es Pipao, desarrollador de software. pero tu te llamas YacareBot.";


  const respuestaIA = await generateResponse(numero, texto, systemPersona);

  await message.reply(respuestaIA);
  return;
}

}

// ================== SCRAPER DETALLE EVENTO ==================

async function getEventoDetalle(url) {
  try {
    console.log("🔎 Analizando:", url);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Título (el verdadero está en .tribe-events-single-event-title)
    const titulo =
      $(".tribe-events-single-event-title").text().trim() || "Sin título";

    // Fecha y hora
    const fecha = $(".tribe-events-abbr.tribe-events-start-date").text().trim() ||
                  $(".tribe-events-start-datetime").text().trim() ||
                  "Sin fecha";

    const hora = $(".tribe-events-abbr.tribe-events-start-time").text().trim() ||
                 $(".tribe-events-start-time").text().trim() ||
                 "Sin hora";

    // Lugar (venue)
    const lugar = $(".tribe-events-venue-details").text().replace(/\s+/g, " ").trim() || "Sin lugar";

    // Descripción en texto plano
    const descripcionTexto =
      $(".tribe-events-single-event-description").text().trim() ||
      "Sin descripción";

    // Descripción en HTML completo (con formato y links)
    const descripcionHtml =
      $(".tribe-events-single-event-description").html()?.trim() ||
      "Sin descripción";

    // Categorías
    const categorias =
      $(".tribe-events-event-categories").text().replace(/\s+/g, " ").trim() ||
      "Sin categorías";

    // Imagen destacada (prefiero el srcset con mayor tamaño si existe)
    let imagen = $(".tribe-events-event-image img").attr("src") || null;
    const srcset = $(".tribe-events-event-image img").attr("srcset");
    if (srcset) {
      const urls = srcset.split(",").map(s => s.trim().split(" ")[0]);
      imagen = urls[urls.length - 1];
    }

    const detalle = {
      titulo,
      fecha,
      hora,
      lugar,
      descripcionTexto,
      descripcionHtml,
      categorias,
      imagen,
      url,
    };

    console.log(detalle);
    return detalle;

  } catch (err) {
    console.error("❌ Error al obtener detalle del evento:", err.message);
    return null;
  }
}


async function getEventosCorrientes(url = "https://visitcorrientes.tur.ar/eventos/") {
  try {
    const eventos = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let nextPage = url;

    while (nextPage) {
      const { data } = await axios.get(nextPage);
      const $ = cheerio.load(data);

      $(".event-custom-container").each((_, el) => {
        const titulo =
          $(el).find("h3.tribe-events-list-event-title a.tribe-event-url").attr("title")?.trim() ||
          "Sin título";

        const fechaTexto =
          $(el).find(".tribe-event-schedule-details .tribe-event-date-start").text().trim() ||
          "Sin fecha";

        const fechaParsed = parsearFecha(fechaTexto);
        if (!fechaParsed) return;

        // descartar eventos pasados
        if (fechaParsed < hoy) return;

        // resaltar si es hoy
        let fechaFinal = fechaTexto;
        const fechaSinHora = new Date(fechaParsed);
        fechaSinHora.setHours(0, 0, 0, 0);
        if (fechaSinHora.getTime() === hoy.getTime()) {
          fechaFinal = `📌 HOY 🎉- ${fechaTexto}`;
        }

        const lugarNombre = $(el).find(".tribe-events-venue-details a").first().text().trim();
        const direccion = $(el).find(".tribe-events-venue-details .tribe-street-address").text().trim();
        const localidad = $(el).find(".tribe-events-venue-details .tribe-locality").text().trim();
        const provincia = $(el).find(".tribe-events-venue-details .tribe-region").text().trim();
        const pais = $(el).find(".tribe-events-venue-details .tribe-country-name").text().trim();

        const lugar = [lugarNombre, direccion, localidad, provincia, pais]
          .filter(Boolean)
          .join(", ") || "Sin lugar";

        const descripcion = $(el).find(".tribe-events-list-event-description").text().trim() || "Sin descripción";
        const enlace = $(el).find(".tribe-events-read-more").attr("href")?.trim() || "Sin enlace";

        eventos.push({
          titulo,
          fecha: fechaFinal,
          lugar,
          descripcion,
          enlace,
        });
      });

      // buscar el link de la siguiente página
      const nextLink = $("li.tribe-events-nav-next a[rel='next']").attr("href");
      nextPage = nextLink ? nextLink : null;
    }

    return eventos;
  } catch (err) {
    console.error("⚠️ Error al obtener eventos:", err.message);
    return [];
  }
}
// -----------------------------
// Analizar consulta turística
// -----------------------------






//////////////restaurantes
async function getRestaurantesCorrientes() {
  const { data } = await axios.get("https://visitcorrientes.tur.ar/donde_comer/restaurantes/");
  const $ = cheerio.load(data);

  const restaurantes = [];

  $("article.dondecomer").each((_, el) => {
    const $el = $(el);

    // Imagen del background
    const style = $el.attr("style") || "";
    const match = style.match(/url\(["']?(.*?)["']?\)/); // Mejor regex para quitar comillas
    const imagen = match ? match[1] : null;

    // Enlace y título
    const enlace = $el.find("a").attr("href")?.trim() || "";
    const nombre = $el.find("h2.entry-title").text().trim() || "Sin nombre";

    // Categorías
    const categorias = $el.find(".subcats").text().trim().replace(/\s+/g, " ") || "Sin categoría";

    restaurantes.push({
      nombre,
      categorias,
      imagen,
      enlace
    });
  });

  return restaurantes;
}


async function getRestauranteDetalle(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const direccion = $(".direccion p").text().trim() || "Sin dirección";
  const telefono = $(".telefono p").text().trim() || "Sin teléfono";
  const redes = [];
  $(".links a").each((_, el) => {
    redes.push($(el).attr("href"));
  });

  // Imagenes de la galería
  const imagenes = [];
  $(".galeria img").each((_, el) => {
    imagenes.push($(el).attr("src"));
  });

  return { direccion, telefono, redes, imagenes };
}


router.post("/whatsapp-interaction", async (req, res) => {
  const { button_reply } = req.body;
  if (button_reply && button_reply.id.startsWith("detalle_")) {
    const url = button_reply.id.replace("detalle_", "");
    const detalle = await getRestauranteDetalle(url);

    res.json({
      body: `📍 Dirección: ${detalle.direccion}\n📞 Tel: ${detalle.telefono}\n🔗 Redes: ${detalle.redes.join(", ") || "N/A"}`,
      mediaUrl: detalle.imagenes[0] // mando la primera imagen de galería
    });
  }
});

async function detectarCategoriaComida(texto) {
  const prompt = `
Eres un asistente turístico de Corrientes.
El usuario dice: "${texto}"
Tu tarea es detectar si pide un tipo de comida o lugar específico.

Responde SOLO en JSON con:
- "categoria": una de ["parrilla", "pizzería", "bar", "regional", "gourmet", "otro"]

Ejemplos:
Usuario: "quiero comer pizza" -> { "categoria": "pizzería" }
Usuario: "donde hay un bar" -> { "categoria": "bar" }
Usuario: "quiero comer asado" -> { "categoria": "parrilla" }
Usuario: "quiero ir a cenar" -> { "categoria": "otro" }

Usuario: "${texto}"
Respuesta:
  `;

  try {
    const raw = await generateResponse("categoria_comida", prompt, "Clasificación de categoría de comida");
    return JSON.parse(raw);
  } catch {
    return { categoria: "otro" };
  }
}


async function getBaresCorrientes() {
  const { data } = await axios.get("https://visitcorrientes.tur.ar/donde_comer/pizzerias-bares-cervecerias/");
  const $ = cheerio.load(data);

  const lugares = [];

  $("article.dondecomer").each((_, el) => {
    const $el = $(el);

    const style = $el.attr("style") || "";
    const match = style.match(/url\(["']?(.*?)["']?\)/);
    const imagen = match ? match[1] : null;

    const enlace = $el.find("a").attr("href")?.trim() || "";
    const nombre = $el.find("h2.entry-title").text().trim() || "Sin nombre";

    const categorias = $el.find(".subcats").text().trim().replace(/\s+/g, " ") || "Sin categoría";

    lugares.push({
      nombre,
      categorias,
      imagen,
      enlace,
      tipo: "bar" // 🔹 lo marcamos como bar/cervecería/pizzería
    });
  });

  return lugares;
}


async function detectarCategoriaComida(texto) {
  const prompt = `
Eres un asistente turístico de Corrientes.
El usuario dice: "${texto}"
Tu tarea es detectar si pide un tipo de comida o lugar específico.

Responde SOLO en JSON con:
- "categoria": una de ["parrilla", "pizzería", "bar", "cervecería", "regional", "gourmet", "otro"]

Ejemplos:
Usuario: "quiero comer pizza" -> { "categoria": "pizzería" }
Usuario: "donde hay un bar" -> { "categoria": "bar" }
Usuario: "quiero tomar cerveza" -> { "categoria": "cervecería" }
Usuario: "quiero tomar birra" -> { "categoria": "cervecería" }
Usuario: "quiero tomar vino" -> { "categoria": "cervecería" }
Usuario: "quiero tomar alcohol" -> { "categoria": "cervecería" }
Usuario: "quiero salir a tomar algo" -> { "categoria": "bar" }
Usuario: "quiero comer asado" -> { "categoria": "parrilla" }
Usuario: "quiero cenar comida típica" -> { "categoria": "regional" }
Usuario: "tengo hambre" -> { "categoria": "otro" }

Usuario: "${texto}"
Respuesta:
  `;

  try {
    const raw = await generateResponse("categoria_comida", prompt, "Clasificación de categoría de comida");
    return JSON.parse(raw);
  } catch {
    return { categoria: "otro" };
  }
}




////////////////////


module.exports = router