import { config } from '../config.js';
import { generateSign } from '../utils/sign.js';

export function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
}

export interface CreatePaymentParams {
  product_id: string;
  product_name: string;
  amount: number;
  payment_type: string;
  user_id: string;
  email: string;
  return_url?: string;
}

export interface PaymentResult {
  out_trade_no: string;
  pay_url: string;
  form_params: Record<string, string>;
}

export function createPayment(input: CreatePaymentParams): PaymentResult {
  const out_trade_no = generateOrderNo();

  const paramJson = JSON.stringify({
    user_id: input.user_id,
    product_id: input.product_id,
    email: input.email,
  });

  const params: Record<string, string> = {
    name: `购买服务 - ${input.product_name}`,
    money: input.amount.toFixed(2),
    type: input.payment_type,
    out_trade_no,
    notify_url: config.payment.notifyUrl,
    pid: config.payment.pid,
    return_url: input.return_url || config.payment.returnUrl,
    sign_type: 'MD5',
    param: paramJson,
  };

  const sign = generateSign(params, config.payment.key);

  return {
    out_trade_no,
    pay_url: config.payment.api,
    form_params: {
      ...params,
      sign,
    },
  };
}
