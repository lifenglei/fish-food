import { supabase } from '../lib/supabase.js';

const ORDERS_TABLE = 'orders';

export interface Order {
  out_trade_no: string;
  trade_no: string | null;
  name: string;
  status: string;
  amount: number;
  payment_type: string | null;
  user_id: string | null;
  product_id: string | null;
  email: string | null;
  pay_time: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderRow {
  out_trade_no: string;
  trade_no: string | null;
  name: string;
  status: string;
  amount: number;
  payment_type: string | null;
  user_id: string | null;
  product_id: string | null;
  email: string | null;
  pay_time: string | null;
  created_at: string;
  updated_at: string;
}

function mapOrder(row: OrderRow): Order {
  return {
    out_trade_no: row.out_trade_no,
    trade_no: row.trade_no,
    name: row.name,
    status: row.status,
    amount: Number(row.amount),
    payment_type: row.payment_type,
    user_id: row.user_id,
    product_id: row.product_id,
    email: row.email,
    pay_time: row.pay_time,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) return email;
  return email[0] + '***' + email.slice(atIndex);
}

export async function createOrder(input: {
  out_trade_no: string;
  name: string;
  amount: number;
  payment_type: string;
  user_id: string;
  product_id: string;
  email: string;
}): Promise<Order> {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .insert({
      out_trade_no: input.out_trade_no,
      name: input.name,
      status: 'pending',
      amount: input.amount,
      payment_type: input.payment_type,
      user_id: input.user_id,
      product_id: input.product_id,
      email: input.email,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapOrder(data as OrderRow);
}

export async function updateOrderPaid(params: {
  out_trade_no: string;
  trade_no: string;
  name: string;
  amount: number;
  payment_type: string;
  user_id: string;
  product_id: string;
  email: string;
}): Promise<void> {
  const { error } = await supabase
    .from(ORDERS_TABLE)
    .upsert(
      {
        out_trade_no: params.out_trade_no,
        trade_no: params.trade_no,
        name: params.name,
        status: 'paid',
        amount: params.amount,
        payment_type: params.payment_type,
        user_id: params.user_id,
        product_id: params.product_id,
        email: params.email,
        pay_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'out_trade_no' },
    );

  if (error) throw error;
}

export async function getOrder(outTradeNo: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('*')
    .eq('out_trade_no', outTradeNo)
    .maybeSingle();

  if (error) throw error;
  return data ? mapOrder(data as OrderRow) : null;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as OrderRow));
}

export async function getLatestPaidOrder(): Promise<{
  email: string;
  name: string;
  pay_time: string;
} | null> {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select('email, name, pay_time')
    .eq('status', 'paid')
    .order('pay_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    email: maskEmail(data.email) ?? '',
    name: data.name,
    pay_time: data.pay_time ?? '',
  };
}
