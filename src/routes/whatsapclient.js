import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

let initializing = false;
let checking = false;

const client = new Client({
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

// ================= EVENTOS =================

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

// ================= INIT CONTROLADO =================

async function startClient() {
  if (initializing) return;
  initializing = true;

  try {
    await client.initialize();
  } catch (err) {
    console.log("❌ Error iniciando:", err.message);
  } finally {
    initializing = false;
  }
}

// ================= CHEQUEO =================

setInterval(async () => {
  if (checking) return;
  checking = true;

  try {
    if (!client.isReady) return;

    const state = await client.getState().catch(() => null);

    if (state) {
      console.log("🟢 WhatsApp activo:", state);
    }

  } catch (err) {
    console.log("⚠️ Error chequeando estado:", err.message);

    if (err.message.includes("detached Frame")) {
      console.log("♻️ Reiniciando por error de frame...");

      try {
        await client.destroy();
      } catch {}

      setTimeout(() => startClient(), 3000);
    }
  } finally {
    checking = false;
  }
}, 300000);

// ================= START =================

startClient();

export default client;
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