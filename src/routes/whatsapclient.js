import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import path from "path";
import { fileURLToPath } from "url";

const { Client, LocalAuth } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📱 Escaneá el QR solo la primera vez");
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

client.on("disconnected", async (reason) => {
  console.log("⚠️ Cliente desconectado:", reason);
  client.isReady = false;

  console.log("🔄 Reiniciando cliente...");
  await client.destroy();
  await client.initialize();
});

setInterval(async () => {
  if (client.isReady) {
    try {
      await client.getState();
      console.log("🟢 WhatsApp activo");
    } catch (err) {
      console.log("⚠️ Error chequeando estado:", err);
    }
  }
}, 300000);

client.initialize();

export default client;