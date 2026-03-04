import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/index.js';
import config from './config/index.js';

const app = express();

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'La Pollería 77 API' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
