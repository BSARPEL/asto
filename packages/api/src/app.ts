import cors from 'cors';
import express from 'express';
import { router } from './routes';
import { storeBackend } from './store';

export function createApp() {
  const app = express();
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

  return app;
}

export function getStoreBackend() {
  return storeBackend;
}
