import helmet from 'helmet';
import cors from 'cors';
import env from '../config/env.js';

export function seguridadBase(app) {
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type']
    })
  );
}
