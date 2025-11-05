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
const allowedOrigins = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);

// Log allowed origins for easier debugging in Vercel logs
// eslint-disable-next-line no-console
console.log('CLIENT_ORIGIN=', process.env.CLIENT_ORIGIN);
// eslint-disable-next-line no-console
console.log('allowedOrigins=', allowedOrigins);

// If allowedOrigins contains a wildcard, allow all origins; otherwise, provide the list
const corsOptions = allowedOrigins.includes('*')
  ? { origin: true, credentials: true, optionsSuccessStatus: 200 }
  : { origin: allowedOrigins, credentials: true, optionsSuccessStatus: 200 };

app.use(cors(corsOptions));

// Also add manual headers to ensure preflight responses contain the expected headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    // probably a server-to-server or same-origin request
    return next();
  }

  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    // Preflight response
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    return res.status(200).end();
  }

  next();
});
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

