const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

// Definís un directorio fijo para guardar la sesión
const sessionPath = path.join(__dirname, 'sesion_whatsapp');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "cliente_unico",  // Si querés manejar varios, cambiás el nombre
        dataPath: sessionPath       // 👈 acá se guarda la sesión
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // executablePath: '/path/to/chrome' // opcional
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

module.exports = client;
