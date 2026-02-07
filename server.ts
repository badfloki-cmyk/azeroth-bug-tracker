import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './lib/db/mongodb.js';

// API Handlers
import loginHandler from './api/auth/login.js';
import registerHandler from './api/auth/register.js';
import ticketsHandler from './api/bugs/tickets.js';
import codeChangesHandler from './api/code-changes/index.js';
import profileHandler from './api/users/profile.js';
import githubWebhookHandler from './api/webhooks/github.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({
    verify: (req: any, res, buf) => {
        req.rawBody = buf;
    }
}));

// Connect to Database
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Helper to convert Vercel handler to Express handler
const vercelToExpress = (handler: any) => async (req: express.Request, res: express.Response) => {
    try {
        await handler(req, res);
    } catch (error: any) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// API Routes
app.all('/api/auth/login', vercelToExpress(loginHandler));
app.all('/api/auth/register', vercelToExpress(registerHandler));
app.all('/api/bugs/tickets', vercelToExpress(ticketsHandler));
app.all('/api/code-changes', vercelToExpress(codeChangesHandler));
app.all('/api/users/profile', vercelToExpress(profileHandler));
app.post('/api/webhooks/github', vercelToExpress(githubWebhookHandler));

// Serve static assets from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// For any request that doesn't match an API route, serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
