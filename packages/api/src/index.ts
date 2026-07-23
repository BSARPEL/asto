import 'dotenv/config';
import { createApp, getStoreBackend } from './app';

const PORT = Number(process.env.PORT || 8788);

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Asto API http://0.0.0.0:${PORT}/api (${process.env.NODE_ENV === 'production' ? 'production' : 'development'}, store=${getStoreBackend()})`,
  );
});
