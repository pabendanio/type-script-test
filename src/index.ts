import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from './config/database';
import userRoutes from './routes/userRoutes';
import { BirthdaySchedulerService } from './services/BirthdaySchedulerService';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/user', userRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Start birthday scheduler
    const birthdayScheduler = new BirthdaySchedulerService();
    
    // Recover any missed messages on startup
    await birthdayScheduler.recoverMissedMessages();
    
    // Start the scheduler
    birthdayScheduler.start();

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`👥 User API available at http://localhost:${PORT}/user`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();