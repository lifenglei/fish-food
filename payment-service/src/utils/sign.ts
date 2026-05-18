import { createHash } from 'crypto';

/**
 * Z-Pay MD5 签名生成
 * 1. 过滤 sign / sign_type / 空值
 * 2. 按 key ASCII 升序排列
 * 3. 拼接 key=value&key=value
 * 4. 末尾追加商户密钥
 * 5. MD5 加密，小写输出
 */
export function generateSign(params: Record<string, any>, key: string): string {
  const filtered = Object.entries(params).filter(
    ([k, v]) => k !== 'sign' && k !== 'sign_type' && v !== null && v !== undefined && v !== '',
  );

  filtered.sort(([a], [b]) => a.localeCompare(b));

  const signStr = filtered.map(([k, v]) => `${k}=${String(v)}`).join('&');
  const finalStr = signStr + key;

  return createHash('md5').update(finalStr).digest('hex');
}
