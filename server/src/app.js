import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';
import settingsRouter from './routes/settings.js';
import documentsRouter from './routes/documents.js';
import termsRouter from './routes/terms.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// credentials: true lets the browser send the session cookie if the client ever calls this API cross-origin
// (in development the Vite proxy keeps everything same-origin, so this is only a safety net).
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
// Everything below needs a signed-in user. /api/health and /api/auth stay public.
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/documents', requireAuth, documentsRouter);
app.use('/api/terms', requireAuth, termsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Plain Language Layer API listening on http://localhost:${port}`);
});
