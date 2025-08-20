 const qrcode = require('qrcode-terminal');
 const { Client, LocalAuth } = require('whatsapp-web.js');
 const puppeteer = require('puppeteer-core');
// Crear instancia del cliente de WhatsApp con autenticación local
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Agregar estos argumentos
    },
    // Si necesitas especificar la ruta del navegador, puedes agregar la opción executablePath:
    // executablePath: '/path/to/your/chrome',
});

// Bandera personalizada para saber si está listo
client.isReady = false;

 client.on('qr', (qr) => {
     qrcode.generate(qr, { small: true });
     console.log('Escanea el código QR con tu aplicación de WhatsApp.');
 });
 
 client.on('ready', () => {
     console.log('¡Cliente de WhatsApp listo y sesión guardada!');
 });
 
 client.on('authenticated', () => {
     console.log('Sesión autenticada.');
 });
 
 client.on('auth_failure', (message) => {
     console.error('Fallo de autenticación: ', message);
 });
 
 client.on('disconnected', (reason) => {
     console.log('Cliente desconectado:', reason);
 });
 

// Inicializar cliente
//client.initialize();

module.exports = client ;
