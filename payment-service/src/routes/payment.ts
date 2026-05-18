import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { createPayment } from '../services/zpayService.js';
import { createOrder, updateOrderPaid, getOrder } from '../services/orderService.js';
import { generateSign } from '../utils/sign.js';

const router = Router();

// ---------- POST /api/payment/create ----------
const createSchema = z.object({
  product_id: z.string().min(1),
  product_name: z.string().min(1),
  amount: z.number().min(0.01),
  payment_type: z.enum(['alipay', 'wxpay', 'wechat']).default('alipay'),
  user_id: z.string().min(1),
  email: z.string().email(),
  return_url: z.string().url().optional(),
});

router.post('/api/payment/create', async (req: Request, res: Response) => {
  try {
    const input = createSchema.parse(req.body);
    const result = createPayment(input);

    await createOrder({
      out_trade_no: result.out_trade_no,
      name: `购买服务 - ${input.product_name}`,
      amount: input.amount,
      payment_type: input.payment_type,
      user_id: input.user_id,
      product_id: input.product_id,
      email: input.email,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: '参数校验失败',
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return;
    }
    console.error('[payment] create error:', error);
    res.status(500).json({ success: false, message: '创建支付失败' });
  }
});

// ---------- GET|POST /api/payment/callback ----------
// Z-Pay 异步回调，必须返回纯文本 'success'
router.all('/api/payment/callback', async (req: Request, res: Response) => {
  try {
    const rawParams: Record<string, string> = {};
    const source = { ...req.query, ...req.body };
    for (const [k, v] of Object.entries(source)) {
      if (typeof v === 'string') {
        rawParams[k] = v;
      } else if (v !== undefined && v !== null) {
        rawParams[k] = String(v);
      }
    }

    const receivedSign = rawParams.sign;
    const calculatedSign = generateSign(rawParams, config.payment.key);
    if (receivedSign !== calculatedSign) {
      res.status(200).type('text').send('fail');
      return;
    }

    if (rawParams.pid !== config.payment.pid) {
      res.status(200).type('text').send('success');
      return;
    }

    if (rawParams.trade_status === 'TRADE_SUCCESS') {
      const { out_trade_no, trade_no, money, type, name } = rawParams;

      let userId = '';
      let productId = '';
      let email = '';
      try {
        const paramObj = JSON.parse(rawParams.param || '{}');
        userId = paramObj.user_id || '';
        productId = paramObj.product_id || '';
        email = paramObj.email || '';
      } catch {
        // ignore
      }

      await updateOrderPaid({
        out_trade_no,
        trade_no: trade_no ?? '',
        name: name ?? '',
        amount: parseFloat(money ?? '0'),
        payment_type: type ?? '',
        user_id: userId,
        product_id: productId,
        email,
      });
    }

    res.status(200).type('text').send('success');
  } catch (error) {
    console.error('[payment] callback error:', error);
    res.status(200).type('text').send('success');
  }
});

// ---------- GET /api/payment/verify ----------
router.get('/api/payment/verify', async (req: Request, res: Response) => {
  try {
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') {
        params[k] = v;
      }
    }

    const outTradeNo = params.out_trade_no;
    if (!outTradeNo) {
      res.json({ success: false, message: '缺少必要参数' });
      return;
    }

    const receivedSign = params.sign;
    if (receivedSign) {
      const calculatedSign = generateSign(params, config.payment.key);
      if (receivedSign !== calculatedSign) {
        res.json({ success: false, message: '签名验证失败' });
        return;
      }
    }

    const order = await getOrder(outTradeNo);
    if (!order) {
      res.json({ success: false, message: '订单不存在' });
      return;
    }

    if (order.status !== 'paid') {
      res.json({ success: false, message: '订单状态异常' });
      return;
    }

    res.json({ success: true, message: '支付验证成功', order });
  } catch (error) {
    console.error('[payment] verify error:', error);
    res.status(500).json({ success: false, message: '验证失败' });
  }
});

export default router;
