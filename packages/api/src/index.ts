import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { router } from './routes';

const app = express();
const PORT = Number(process.env.PORT || 8788);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', router);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Sunucu hatası' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Asto API http://0.0.0.0:${PORT}/api`);
});
