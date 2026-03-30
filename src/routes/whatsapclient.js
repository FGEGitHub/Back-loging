import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

let client = null;
let initializing = false;
let restarting = false;
let checking = false;
let sending = false;

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

    try {
      if (newClient.pupBrowser) {
        newClient.pupBrowser.on("disconnected", () => {
          console.log("⚠️ Navegador Puppeteer desconectado");
          restartClient();
        });
      }
    } catch {}
  });

  newClient.on("change_state", (state) => {
    console.log("🔄 Estado:", state);

    if (
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
      client.isReady = false;

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
    restarting = false;
    startClient();
  }, 5000);
}

async function startClient() {
  if (initializing) return;

  initializing = true;

  try {
    console.log("🚀 Inicializando WhatsApp...");

    client = createClient();

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
    if (sending) {
      return {
        ok: false,
        error: "Hay otro mensaje enviándose"
      };
    }

    sending = true;

    if (!client || !client.isReady) {
      throw new Error("WhatsApp no listo");
    }

    const state = await client.getState().catch(() => null);

    if (!state || state !== "CONNECTED") {
      throw new Error(`WhatsApp no conectado (${state})`);
    }

    if (!client.pupPage || client.pupPage.isClosed()) {
      throw new Error("Página de WhatsApp cerrada");
    }

    const chatId = number.includes("@c.us")
      ? number
      : `${number}@c.us`;

    console.log(`📨 Enviando mensaje a ${chatId}`);

    const result = await Promise.race([
      client.sendMessage(chatId, message),
      new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error("Timeout enviando mensaje"));
        }, 30000)
      )
    ]);

    console.log("✅ Mensaje enviado");

    return {
      ok: true,
      result
    };
  } catch (err) {
    console.log("❌ Error enviando:", err.message);

    if (
      err.message.includes("detached Frame") ||
      err.message.includes("Session closed") ||
      err.message.includes("Execution context was destroyed") ||
      err.message.includes("Target closed") ||
      err.message.includes("Página de WhatsApp cerrada")
    ) {
      restartClient();
    }

    return {
      ok: false,
      error: err.message
    };
  } finally {
    sending = false;
  }
}

setInterval(async () => {
  if (checking) return;

  checking = true;

  try {
    if (!client || !client.isReady) return;

    const state = await client.getState().catch(() => null);

    console.log("🟢 WhatsApp activo:", state);

    if (
      !state ||
      state === "UNPAIRED" ||
      state === "UNPAIRED_IDLE" ||
      state === "DISCONNECTED"
    ) {
      restartClient();
    }

    if (!client.pupPage || client.pupPage.isClosed()) {
      console.log("⚠️ Página cerrada");
      restartClient();
    }
  } catch (err) {
    console.log("⚠️ Error chequeando estado:", err.message);

    if (
      err.message.includes("detached Frame") ||
      err.message.includes("Session closed") ||
      err.message.includes("Execution context was destroyed") ||
      err.message.includes("Target closed")
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