import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { query } from './database/connection';
import schedulerService from './services/schedulerService';
import challengeRoutes from './routes/challenges';
import notificationRoutes from './routes/notifications';
import { setupSwagger } from './config/swagger';

// Load environment variables
dotenv.config();

const app = express();
// Railway sets PORT automatically, fallback to 3001 for local dev
const PORT = parseInt(process.env.PORT || '3001');

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration - Allow Railway domain
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.CORS_ORIGIN,
  process.env.RAILWAY_STATIC_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => allowed && origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(null, true); // Be permissive in production, restrict in your env vars
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Simple root endpoint (no database required)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ProcastiNot API',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint with better error handling
app.get('/health', async (req, res) => {
  try {
    // Test database connection with timeout
    const dbTest = await Promise.race([
      query('SELECT 1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);
    
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      port: PORT,
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api/challenges', challengeRoutes);
app.use('/api', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Store server instance for graceful shutdown
let server: any = null;

// Improved graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close((err: any) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ HTTP server closed');
      
      // Stop scheduler
      try {
        schedulerService.stop();
        console.log('✅ Scheduler stopped');
      } catch (error) {
        console.error('❌ Error stopping scheduler:', error);
      }
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server with better error handling
const startServer = async () => {
  try {
    console.log(`🔧 Starting server on port ${PORT}...`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test database connection with retry logic
    let dbConnected = false;
    let retries = 3;
    
    while (!dbConnected && retries > 0) {
      try {
        await query('SELECT 1');
        console.log('✅ Database connection successful');
        dbConnected = true;
      } catch (error) {
        retries--;
        console.error(`❌ Database connection failed. Retries left: ${retries}`, error);
        
        if (retries > 0) {
          console.log('⏳ Retrying database connection in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!dbConnected) {
      throw new Error('Failed to connect to database after multiple retries');
    }
    
    // DISABLED: Scheduler causing email timeouts and crashes
    // schedulerService.start();
    
    // Start HTTP server - bind to 0.0.0.0 for Railway
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Binding to 0.0.0.0:${PORT} for Railway`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Log Railway-specific URLs if available
      if (process.env.RAILWAY_STATIC_URL) {
        console.log(`🚂 Railway URL: ${process.env.RAILWAY_STATIC_URL}`);
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      }
    });
    
    // Set server timeout
    server.timeout = 30000; // 30 seconds
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;