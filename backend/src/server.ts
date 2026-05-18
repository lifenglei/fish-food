import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ZodError, z } from 'zod';
import { addFeeding, getFishCatalog, getFishSpecies, getRecentFeedings, getTotalMerit } from './services/fishService.js';

const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? '';
const allowedOrigins = FRONTEND_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed`));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const feedingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
const feedInputSchema = z.object({
  fishId: z.string().uuid(),
  foodSlug: z.string().trim().min(1),
  wishDescription: z.string().trim().min(1).max(120),
  feederName: z.string().trim().max(32).optional(),
});

const asyncRoute =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

app.get(
  '/api/health',
  asyncRoute(async (_req, res) => {
    res.json({ ok: true, service: 'xmasavatar-ai-backend', uptime: Math.round(process.uptime()) });
  }),
);

app.get(
  '/api/fish/species',
  asyncRoute(async (_req, res) => {
    const species = await getFishSpecies();
    res.json(species);
  }),
);

app.get(
  '/api/fish/catalog',
  asyncRoute(async (_req, res) => {
    const catalog = await getFishCatalog();
    res.json(catalog);
  }),
);

app.get(
  '/api/feedings',
  asyncRoute(async (req, res) => {
    const { page, pageSize, startDate, endDate } = feedingsQuerySchema.parse(req.query);
    const offset = (page - 1) * pageSize;
    const result = await getRecentFeedings({ limit: pageSize, offset, startDate, endDate });
    res.json({ ...result, page, pageSize });
  }),
);

app.get(
  '/api/feedings/total-merit',
  asyncRoute(async (_req, res) => {
    const totalMerit = await getTotalMerit();
    res.json({ totalMerit });
  }),
);

app.post(
  '/api/feedings',
  asyncRoute(async (req, res) => {
    const payload = feedInputSchema.parse(req.body);
    const feeding = await addFeeding(payload);
    res.status(201).json(feeding);
  }),
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: '请求参数校验失败',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('[backend] Unhandled error:', error);
  res.status(500).json({ message });
});

app.listen(PORT, () => {
  console.log(`[backend] API server listening on http://localhost:${PORT}`);
});
