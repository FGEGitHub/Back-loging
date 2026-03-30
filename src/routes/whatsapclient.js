import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

let client = null;
let initializing = false;
let checking = false;
let restarting = false;

function createClient() {
  const newClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: "./src/routes/sesion_whatsapp",
      clientId: "bot-dtc"
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process"
      ]
    }
  });

  newClient.isReady = false;

  newClient.on("qr", (qr) => {
    console.log("📱 Escaneá el QR solo la primera vez");
    qrcode.generate(qr, { small: true });
  });

  newClient.on("authenticated", () => {
    console.log("🔒 Sesión autenticada");
  });

  newClient.on("ready", async () => {
    console.log("✅ WhatsApp listo");
    newClient.isReady = true;
    restarting = false;

    try {
      const state = await newClient.getState();
      console.log("🟢 Estado inicial:", state);
    } catch {}
  });

  newClient.on("change_state", (state) => {
    console.log("🔄 Estado:", state);

    if (
      state === "CONFLICT" ||
      state === "UNPAIRED" ||
      state === "UNPAIRED_IDLE" ||
      state === "DISCONNECTED"
    ) {
      restartClient();
    }
  });

  newClient.on("auth_failure", async (message) => {
    console.log("❌ Error de autenticación:", message);
    newClient.isReady = false;
    restartClient();
  });

  newClient.on("disconnected", async (reason) => {
    console.log("⚠️ Cliente desconectado:", reason);
    newClient.isReady = false;
    restartClient();
  });

  return newClient;
}

async function restartClient() {
  if (restarting) return;
  restarting = true;

  console.log("♻️ Reiniciando cliente WhatsApp...");

  try {
    if (client) {
      try {
        client.removeAllListeners();
      } catch {}

      try {
        await client.destroy();
      } catch {}
    }
  } catch (err) {
    console.log("⚠️ Error destruyendo cliente:", err.message);
  }

  client = null;

  setTimeout(() => {
    startClient();
  }, 5000);
}

async function startClient() {
  if (initializing) return;
  initializing = true;

  try {
    client = createClient();

    console.log("🚀 Inicializando WhatsApp...");
    await client.initialize();

  } catch (err) {
    console.log("❌ Error iniciando WhatsApp:", err.message);

    setTimeout(() => {
      startClient();
    }, 5000);
  } finally {
    initializing = false;
  }
}

export function getClient() {
  return client;
}

export function isClientReady() {
  return !!client && client.isReady === true;
}

export async function sendWhatsappMessage(number, message) {
  try {
    if (!client || !client.isReady) {
      throw new Error("WhatsApp no listo");
    }

    const chatId = number.includes("@c.us")
      ? number
      : `${number}@c.us`;

    const result = await client.sendMessage(chatId, message);

    return {
      ok: true,
      result
    };
  } catch (err) {
    console.log("❌ Error enviando:", err.message);

    if (
      err.message.includes("detached Frame") ||
      err.message.includes("Session closed") ||
      err.message.includes("Execution context was destroyed")
    ) {
      restartClient();
    }

    return {
      ok: false,
      error: err.message
    };
  }
}

setInterval(async () => {
  if (checking) return;
  checking = true;

  try {
    if (!client || !client.isReady) {
      checking = false;
      return;
    }

    const state = await client.getState();

    console.log("🟢 WhatsApp activo:", state);

    if (
      state === "CONFLICT" ||
      state === "UNPAIRED" ||
      state === "UNPAIRED_IDLE" ||
      state === "DISCONNECTED"
    ) {
      restartClient();
    }
  } catch (err) {
    console.log("⚠️ Error chequeando estado:", err.message);

    if (
      err.message.includes("detached Frame") ||
      err.message.includes("Session closed") ||
      err.message.includes("Execution context was destroyed")
    ) {
      restartClient();
    }
  } finally {
    checking = false;
  }
}, 60000);

startClient();
/* import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import path from "path";
import { fileURLToPath } from "url";

const { Client, LocalAuth } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './src/routes/sesion_whatsapp'
  }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.isReady = false;

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('📱 Escaneá el código QR solo la primera vez.');
});

client.on('ready', () => {
  console.log('✅ WhatsApp listo');
  client.isReady = true;
});

client.on('authenticated', () => {
  console.log('🔒 Sesión autenticada.');
});

client.on('auth_failure', (message) => {
  console.error('❌ Fallo de autenticación: ', message);
});

client.on('disconnected', (reason) => {
  console.log('⚠️ Cliente desconectado:', reason);
  client.isReady = false;
});

client.initialize();

export default client; */