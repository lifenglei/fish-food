import { Router, type Request, type Response } from 'express';
import { getOrder, getUserOrders, getLatestPaidOrder } from '../services/orderService.js';

const router = Router();

// ---------- GET /api/orders/latest ----------
router.get('/api/orders/latest', async (_req: Request, res: Response) => {
  try {
    const order = await getLatestPaidOrder();
    res.json({ success: true, order });
  } catch (error) {
    console.error('[orders] latest error:', error);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

// ---------- GET /api/orders/user/:user_id ----------
router.get('/api/orders/user/:user_id', async (req: Request, res: Response) => {
  try {
    const user_id = String(req.params.user_id);
    const orders = await getUserOrders(user_id);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('[orders] user orders error:', error);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

// ---------- GET /api/orders/:out_trade_no ----------
router.get('/api/orders/:out_trade_no', async (req: Request, res: Response) => {
  try {
    const out_trade_no = String(req.params.out_trade_no);
    const order = await getOrder(out_trade_no);
    if (!order) {
      res.json({ success: false, message: '订单不存在' });
      return;
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error('[orders] get order error:', error);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

export default router;
