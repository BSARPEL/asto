import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { router } from './routes';
import { storeBackend } from './store';

const app = express();
const PORT = Number(process.env.PORT || 8788);
const isProd = process.env.NODE_ENV === 'production';

const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors(
    corsOrigins?.length
      ? { origin: corsOrigins }
      : isProd
        ? { origin: false }
        : undefined,
  ),
);
app.use(express.json({ limit: '1mb' }));
app.use('/api', router);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Sunucu hatası' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Asto API http://0.0.0.0:${PORT}/api (${isProd ? 'production' : 'development'}, store=${storeBackend})`,
  );
});
