import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

let client = null;
let initializing = false;
let checking = false;

function createClient() {
  client = new Client({
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
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu"
      ]
    }
  });

  client.isReady = false;

  client.on("qr", (qr) => {
    console.log("📱 Escaneá el QR solo la primera vez");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp listo");
    client.isReady = true;
  });

  client.on("authenticated", () => {
    console.log("🔒 Sesión autenticada");
  });

  client.on("auth_failure", (message) => {
    console.error("❌ Fallo autenticación:", message);
  });

  client.on("change_state", (state) => {
    console.log("🔄 Estado:", state);
  });

  client.on("disconnected", async (reason) => {
    console.log("⚠️ Cliente desconectado:", reason);
    client.isReady = false;

    try {
      await client.destroy();
    } catch {}

    setTimeout(() => {
      console.log("🔄 Reiniciando cliente...");
      startClient();
    }, 5000);
  });
}

async function startClient() {
  if (initializing) return;
  initializing = true;

  try {
    if (client) {
      try {
        await client.destroy();
      } catch {}
    }

    createClient();
    await client.initialize();

  } catch (err) {
    console.log("❌ Error iniciando:", err.message);

    setTimeout(() => startClient(), 5000);
  } finally {
    initializing = false;
  }
}

setInterval(async () => {
  if (checking || !client) return;
  checking = true;

  try {
    if (!client.isReady) return;

    const state = await client.getState();

    console.log("🟢 WhatsApp activo:", state);

  } catch (err) {
    console.log("⚠️ Error chequeando estado:", err.message);

    if (
      err.message.includes("detached Frame") ||
      err.message.includes("Session closed") ||
      err.message.includes("Execution context was destroyed")
    ) {
      console.log("♻️ Reiniciando cliente...");

      try {
        await client.destroy();
      } catch {}

      startClient();
    }
  } finally {
    checking = false;
  }
}, 300000);

startClient();

export default () => client;
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