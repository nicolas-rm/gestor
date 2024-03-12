import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// Cors
import cors from 'cors';

// Morgan
import morgan from 'morgan';

// Enviar Correos
import nodemailer from 'nodemailer';

// Dontenv
import dotenv from 'dotenv';
dotenv.config();

// ====== Enviar Correos ======
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env['EMAIL'],
        pass: process.env['PASSWORD']
    }
});

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
    const server = express();
    const serverDistFolder = dirname(fileURLToPath(import.meta.url));
    const browserDistFolder = resolve(serverDistFolder, '../browser');
    const indexHtml = join(serverDistFolder, 'index.server.html');

    const commonEngine = new CommonEngine();

    server.set('view engine', 'html');
    server.set('views', browserDistFolder);

    // Configuración del middleware CORS
    server.use(cors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        optionsSuccessStatus: 200
    }));

    ;
    // Configuración de Morgan
    server.use(morgan('dev'));

    // Middleware para parsear JSON
    server.use(express.json());

    // Robots.txt
    server.get('/robots.txt', (req, res) => {
        res.sendFile('robots.txt', { root: './dist/gestor-inmobiliario/browser/robots.txt' });
    });

    // Ruta para enviar correos
    server.post('/api/send-email', async (req, res) => {

        // URL DE DONDE SE ESTA ENVIANDO EL CORREO
        const { from, subject, text, name } = req.body;

        const message = `Nombre: ${name}\nCorreo: ${from}\n\n${text}`;

        try {
            // Send email
            const response = await sendEmail(from, subject, message);

            // Send a success response
            res.status(200).json({ message: 'Correo enviado exitosamente' })
        } catch (error) {
            console.error('Error al enviar el correo:', error);

            // Send an error response
            res.status(500).json({ error: 'Error al enviar el correo' });
        }
    });

    // Ruta para archivos estáticos
    server.get('*.*', express.static(browserDistFolder, {
        maxAge: '1y'
    }));

    // Ruta para todas las demás solicitudes
    server.get('*', async (req, res, next) => {
        const { protocol, originalUrl, baseUrl, headers } = req;

        try {
            const html = await commonEngine.render({
                bootstrap,
                documentFilePath: indexHtml,
                url: `${protocol}://${headers.host}${originalUrl}`,
                publicPath: browserDistFolder,
                providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
            });

            console.log('Página renderizada exitosamente');
            console.log('URL:', `${protocol}://${headers.host}${originalUrl}`);
            res.send(html);
        } catch (error) {
            console.log('Error al renderizar la página')
            console.log(error)

            // Codigo de error
            next(error);
        }
    });

    // Pagina no encontrada
    server.use((req, res, next) => {
        res.status(404).send('Página no encontrada');
    });

    return server;
}

async function sendEmail(from: string, subject: string, text: string) {
    const mailOptions = {
        from,
        to: process.env['EMAIL'],
        subject,
        text,
        replyTo: from
    };

    return await transporter.sendMail(mailOptions);
}

function run(): void {
    const port = Number(process.env['PORT']) || 3000;

    // Iniciar el servidor Node
    const server = app();
    server.listen(port, '0.0.0.0', () => {
        console.log(`Node Express server listening on http://0.0.0.0:${port}`);
    });
}

run();
