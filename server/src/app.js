import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import healthRouter from './routes/health.js';
import settingsRouter from './routes/settings.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/settings', settingsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Plain Language Layer API listening on http://localhost:${port}`);
});
