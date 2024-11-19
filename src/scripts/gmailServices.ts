import fs from 'fs';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// Rutas de archivos
const CREDENTIALS_PATH = './gmailapi.json';
const TOKEN_PATH = './src/config/token.json';


// Scopes requeridos para enviar correos
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

export async function authorizeGmail() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    console.log(credentials)
    const { client_id, client_secret, redirect_uris } = credentials.web;
    console.log(client_id)

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Verifica si ya existe un token guardado
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    } else {
        // Genera URL para autenticación inicial
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this URL:', authUrl);

        // Espera el código manualmente
        throw new Error('Obtén el código de autorización de la URL e intercámbialo por un token.');
    }
}


export async function getAccessToken(oAuth2Client: any, code: string) {
    const token = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(token.tokens);

    // Guarda el token para uso futuro
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token.tokens));
    console.log('Token almacenado en:', TOKEN_PATH);

    return oAuth2Client;
}


export async function sendEmail(oAuth2Client: any, to: string, subject: string, body: string) {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const email = [
        `To: ${to}`,
        'Subject: ' + subject,
        'Content-Type: text/html; charset=utf-8',
        '',
        body,
    ].join('\n');

    const encodedMessage = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
        },
    });

    console.log('Correo enviado a:', to);
}