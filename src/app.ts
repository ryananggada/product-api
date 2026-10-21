import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import { parse } from 'yaml';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import { errorHandler } from './middleware/error';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(parse(fs.readFileSync('openapi.yaml', 'utf8'))),
);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

export default app;
