import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  payment: {
    pid: process.env.PAYMENT_PID ?? '',
    key: process.env.PAYMENT_KEY ?? '',
    api: process.env.PAYMENT_API ?? 'https://zpayz.cn/submit.php',
    notifyUrl: process.env.PAYMENT_NOTIFY_URL ?? '',
    returnUrl: process.env.PAYMENT_RETURN_URL ?? '',
  },
};

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

if (!config.payment.pid || !config.payment.key) {
  console.warn('[payment-service] Missing PAYMENT_PID or PAYMENT_KEY — payment features will not work');
}
