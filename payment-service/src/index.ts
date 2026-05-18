import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { config } from './config.js';
import paymentRouter from './routes/payment.js';
import ordersRouter from './routes/orders.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'payment-service', uptime: Math.round(process.uptime()) });
});

// 业务路由
app.use(paymentRouter);
app.use(ordersRouter);

// 全局错误处理
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: '请求参数校验失败',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('[payment-service] Unhandled error:', error);
  res.status(500).json({ success: false, message });
});

app.listen(config.port, () => {
  console.log(`[payment-service] listening on http://localhost:${config.port}`);
});
