import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js"; // 👈 importar TODO el paquete
import path from "path";
import { fileURLToPath } from "url";

const { Client, LocalAuth } = pkg;

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio fijo para guardar la sesión
const sessionPath = path.join(__dirname, "sesion_whatsappp");

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "cliente_unico",   // si querés múltiples clientes, cambiás esto
    dataPath: sessionPath        // 👈 acá se guarda la sesión
  }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
    // executablePath: "/path/to/chrome" // opcional
  }
});



client.isReady = false;

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('📱 Escaneá el código QR solo la primera vez.');
});

client.on('ready', () => {
    console.log('✅ ¡Cliente de WhatsApp listo y sesión guardada en:', sessionPath);
});

client.on('authenticated', () => {
    console.log('🔒 Sesión autenticada.');
});

client.on('auth_failure', (message) => {
    console.error('❌ Fallo de autenticación: ', message);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado:', reason);
});

// Inicializar cliente
//client.initialize();

export default client; 
