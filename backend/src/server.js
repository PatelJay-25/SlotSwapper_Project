import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectToDatabase } from './config/db.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import swapRoutes from './routes/swaps.js';

dotenv.config();

const app = express();
// Support proxies (required on some PaaS)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());

// Flexible CORS: support comma-separated origins (e.g., prod + preview URLs)
const rawOrigins = process.env.CLIENT_ORIGIN || '*';
const allowedOrigins = rawOrigins.split(',').map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SlotSwapper API is running',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', swapRoutes); // /swappable-slots, /swap-request, /swap-response/:id

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Avoid leaking internals
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectToDatabase();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});

export default app;

