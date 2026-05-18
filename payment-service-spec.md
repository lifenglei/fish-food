# 支付服务接口规范文档

> 本文档描述基于 Z-Pay（易支付）网关的支付服务设计，供其他项目作为独立 Node.js 服务对接参考。

---

## 一、整体架构

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│  前端/客户端  │─────>│  支付 Node 服务   │─────>│  Z-Pay 网关  │
│             │<─────│  (独立部署)       │<─────│ zpayz.cn    │
└─────────────┘      └──────────────────┘      └─────────────┘
       │                     │
       │                     │
       v                     v
┌─────────────┐      ┌──────────────────┐
│  业务系统API │      │  数据库 (Orders)  │
└─────────────┘      └──────────────────┘
```

支付服务作为独立 Node.js 服务部署，职责：
1. **发起支付** — 生成签名、构造支付参数、返回支付跳转 URL
2. **异步回调** — 接收 Z-Pay 支付结果通知，验签，持久化订单
3. **结果验证** — 供前端轮询/查询支付结果
4. **订单查询** — 按用户/订单号查询订单

---

## 二、环境变量配置

```bash
# Z-Pay 商户配置
PAYMENT_PID=2025123016571326          # 商户ID
PAYMENT_KEY=UIrkScNTLwustf6Q33aEHDuNKf3NRqzm  # MD5签名密钥
PAYMENT_API=https://zpayz.cn/submit.php       # Z-Pay 网关地址

# 回调地址（部署后替换为实际域名）
PAYMENT_NOTIFY_URL=https://your-domain.com/api/payment/callback
PAYMENT_RETURN_URL=https://your-domain.com/payment-success

# 数据库（按实际选用）
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 服务端口
PORT=3001
```

---

## 三、签名算法（MD5）

Z-Pay 使用 MD5 签名验证请求合法性，签名规则如下：

### 3.1 签名生成步骤

```
1. 将所有请求参数（不含 sign 和 sign_type）按参数名 ASCII 码升序排列
2. 将参数拼接为 "key=value&key=value" 格式（不含 URL 编码）
3. 去掉末尾的 "&"
4. 在末尾追加商户密钥（key），即: sortedParams + PAYMENT_KEY
5. 对整个字符串做 MD5 加密，结果转小写
```

### 3.2 TypeScript / Node.js 实现

```typescript
import { createHash } from 'crypto';

function generateSign(params: Record<string, any>, key: string): string {
  // 1. 过滤掉 sign、sign_type 和空值参数
  const filtered = Object.entries(params).filter(
    ([k, v]) => k !== 'sign' && k !== 'sign_type' && v !== null && v !== undefined && v !== ''
  );

  // 2. 按 key 的 ASCII 码排序
  filtered.sort(([a], [b]) => a.localeCompare(b));

  // 3. 拼接为 key=value& 格式
  const signStr = filtered.map(([k, v]) => `${k}=${String(v)}`).join('&');

  // 4. 追加商户密钥
  const finalStr = signStr + key;

  // 5. MD5 加密，小写输出
  return createHash('md5').update(finalStr).digest('hex');
}
```

### 3.3 签名示例

假设参数：
```
name=购买服务 - 点睛计划
money=199.00
type=alipay
out_trade_no=17040672000001234
notify_url=https://your-domain.com/api/payment/callback
pid=2025123016571326
return_url=https://your-domain.com/payment-success
sign_type=MD5
param={"email":"test@example.com","user_id":"uuid-xxx","product_id":"1"}
```

排序后拼接（不含 sign、sign_type）：
```
money=199.00&name=购买服务 - 点睛计划&notify_url=https://your-domain.com/api/payment/callback&out_trade_no=17040672000001234&param={"email":"test@example.com","user_id":"uuid-xxx","product_id":"1"}&pid=2025123016571326&return_url=https://your-domain.com/payment-success&type=alipay
```

追加密钥后 MD5：
```
md5("money=199.00&name=购买服务 - 点睛计划&notify_url=...&type=alipayUIrkScNTLwustf6Q33aEHDuNKf3NRqzm")
```

---

## 四、数据库设计

### 4.1 orders 表结构

```sql
CREATE TABLE orders (
  out_trade_no  TEXT PRIMARY KEY,           -- 商户订单号（唯一标识）
  trade_no      TEXT,                        -- Z-Pay 平台交易号
  name          TEXT NOT NULL,               -- 商品名称
  status        TEXT NOT NULL DEFAULT 'pending',  -- 订单状态
  amount        NUMERIC(10,2) NOT NULL,      -- 支付金额
  payment_type  TEXT,                        -- 支付方式: alipay / wxpay / wechat
  user_id       UUID,                        -- 用户ID（关联业务系统用户）
  product_id    TEXT,                        -- 产品ID（业务系统产品标识）
  email         TEXT,                        -- 用户邮箱
  pay_time      TIMESTAMPTZ,                -- 支付完成时间
  created_at    TIMESTAMPTZ DEFAULT NOW(),   -- 创建时间
  updated_at    TIMESTAMPTZ DEFAULT NOW()    -- 更新时间
);

-- 索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### 4.2 订单状态枚举

| 状态 | 说明 |
|------|------|
| `pending` | 待支付（建议发起支付时就创建记录） |
| `paid` | 已支付 |
| `failed` | 支付失败 |
| `canceled` | 已取消 |

### 4.3 支付方式枚举

| 值 | 说明 |
|----|------|
| `alipay` | 支付宝 |
| `wxpay` | 微信支付 |
| `wechat` | 微信支付（别名） |

---

## 五、API 接口定义

### 5.1 发起支付

**POST** `/api/payment/create`

> 由业务系统调用，生成支付参数并返回跳转 URL 或表单数据。

#### 请求体

```json
{
  "product_id": "1",
  "product_name": "点睛计划",
  "amount": 199.00,
  "payment_type": "alipay",
  "user_id": "uuid-of-user",
  "email": "user@example.com"
}
```

#### 响应

```json
{
  "success": true,
  "data": {
    "out_trade_no": "17040672000001234",
    "pay_url": "https://zpayz.cn/submit.php?...",
    "form_params": {
      "name": "购买服务 - 点睛计划",
      "money": "199.00",
      "type": "alipay",
      "out_trade_no": "17040672000001234",
      "notify_url": "https://your-domain.com/api/payment/callback",
      "pid": "2025123016571326",
      "return_url": "https://your-domain.com/payment-success",
      "sign_type": "MD5",
      "param": "{\"email\":\"user@example.com\",\"user_id\":\"uuid\",\"product_id\":\"1\"}",
      "sign": "abc123def456..."
    }
  }
}
```

#### 处理逻辑

```typescript
// 伪代码
1. 参数校验（金额 >= 0.01，产品存在等）
2. 生成 out_trade_no = Date.now() + 4位随机数
3. 构造 params 对象
4. 调用 generateSign(params, PAYMENT_KEY) 生成签名
5. 可选：在数据库创建 pending 状态订单
6. 返回 form_params 供前端 POST 提交到 Z-Pay
```

---

### 5.2 支付异步回调（Z-Pay → 服务端）

**GET/POST** `/api/payment/callback`

> Z-Pay 在用户完成支付后异步调用此接口。**必须返回纯文本 `success`**，否则 Z-Pay 会重复回调。

#### Z-Pay 回调参数

| 参数 | 说明 |
|------|------|
| `pid` | 商户ID |
| `trade_no` | 平台交易号 |
| `out_trade_no` | 商户订单号 |
| `type` | 支付方式 (alipay/wxpay) |
| `name` | 商品名称 |
| `money` | 支付金额 |
| `trade_status` | 交易状态 (TRADE_SUCCESS) |
| `param` | 自定义参数（JSON字符串） |
| `sign` | 签名 |
| `sign_type` | 签名类型 (MD5) |

#### 处理流程

```
1. 解析所有 query 参数（注意 + 号替换为空格）
2. 验证签名：重新生成 sign 并比对
3. 验证商户ID：params.pid === PAYMENT_PID
4. 检查 trade_status === 'TRADE_SUCCESS'
5. 解析 param 字段获取 user_id / product_id / email
6. UPSERT 订单到数据库（以 out_trade_no 为唯一键）
7. 返回纯文本 'success'（状态码 200）
```

#### 关键实现

```typescript
// 回调处理核心逻辑
async function handleCallback(params: Record<string, string>) {
  // 1. 验签
  const receivedSign = params.sign;
  const calculatedSign = generateSign(params, PAYMENT_KEY);
  if (receivedSign !== calculatedSign) {
    return { status: 200, body: 'fail' };
  }

  // 2. 验证商户ID
  if (params.pid !== PAYMENT_PID) {
    return { status: 200, body: 'success' }; // 仍返回 success 防重复
  }

  // 3. 处理支付成功
  if (params.trade_status === 'TRADE_SUCCESS') {
    const { out_trade_no, trade_no, money, type, name } = params;

    // 解析 param
    let userId = '', productId = '', email = '';
    try {
      const paramObj = JSON.parse(params.param || '{}');
      userId = paramObj.user_id || '';
      productId = paramObj.product_id || '';
      email = paramObj.email || '';
    } catch (e) { /* 忽略 */ }

    // 4. UPSERT 订单
    await db.query(`
      INSERT INTO orders (out_trade_no, trade_no, name, status, amount, payment_type, user_id, product_id, email, pay_time, updated_at)
      VALUES ($1, $2, $3, 'paid', $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (out_trade_no) DO UPDATE SET
        trade_no = EXCLUDED.trade_no,
        status = 'paid',
        payment_type = EXCLUDED.payment_type,
        pay_time = NOW(),
        updated_at = NOW()
    `, [out_trade_no, trade_no, name, money, type, userId, productId, email]);
  }

  // 5. 始终返回 success
  return { status: 200, body: 'success' };
}
```

---

### 5.3 支付结果验证

**GET** `/api/payment/verify`

> 前端支付成功页调用，验证订单是否真实支付成功。

#### 请求参数（Query String）

透传 Z-Pay return_url 回来的所有参数：`out_trade_no`, `money`, `sign` 等。

#### 响应

```json
// 成功
{
  "success": true,
  "message": "支付验证成功",
  "order": {
    "out_trade_no": "17040672000001234",
    "trade_no": "ZPAY202501010001",
    "name": "购买服务 - 点睛计划",
    "status": "paid",
    "amount": "199.00",
    "payment_type": "alipay",
    "user_id": "uuid-xxx",
    "email": "user@example.com",
    "pay_time": "2025-01-01T12:00:00Z"
  }
}

// 失败
{
  "success": false,
  "message": "签名验证失败" | "订单不存在" | "订单状态异常"
}
```

#### 处理逻辑

```
1. 从 query string 解析参数
2. 验证签名
3. 查询数据库中 out_trade_no 对应的订单
4. 检查 order.status === 'paid'
5. 返回结果
```

---

### 5.4 订单查询

**GET** `/api/orders/:out_trade_no`

> 查询单个订单详情。

#### 响应

```json
{
  "success": true,
  "order": { ... }
}
```

---

### 5.5 用户订单列表

**GET** `/api/orders/user/:user_id`

> 查询某用户的所有订单。

#### 响应

```json
{
  "success": true,
  "orders": [
    { "out_trade_no": "...", "status": "paid", ... },
    ...
  ]
}
```

---

### 5.6 最新已支付订单

**GET** `/api/orders/latest`

> 获取最新一条已支付订单（用于展示购买通知）。

#### 响应

```json
{
  "success": true,
  "order": {
    "email": "u***@example.com",
    "name": "购买服务 - 点睛计划",
    "pay_time": "2025-01-01T12:00:00Z"
  }
}
```

> 注意：邮箱需脱敏处理（如 `test@example.com` → `t***@example.com`）

---

## 六、支付流程时序图

```
用户              前端                支付服务              Z-Pay              数据库
 │                │                    │                    │                   │
 │  点击购买       │                    │                    │                   │
 │───────────────>│                    │                    │                   │
 │                │  POST /payment/create                   │                   │
 │                │───────────────────>│                    │                   │
 │                │                    │  创建pending订单    │                   │
 │                │                    │──────────────────────────────────────>│
 │                │  返回 form_params   │                    │                   │
 │                │<───────────────────│                    │                   │
 │                │                    │                    │                   │
 │                │  POST form到Z-Pay  │                    │                   │
 │                │───────────────────────────────────────>│                   │
 │                │                    │                    │                   │
 │  在Z-Pay页面完成支付                 │                    │                   │
 │──────────────────────────────────────────────────────>│                   │
 │                │                    │                    │                   │
 │                │                    │  GET /callback     │                   │
 │                │                    │<───────────────────│                   │
 │                │                    │  验签+UPSERT订单    │                   │
 │                │                    │──────────────────────────────────────>│
 │                │                    │  返回 'success'    │                   │
 │                │                    │───────────────────>│                   │
 │                │                    │                    │                   │
 │  跳转到return_url                   │                    │                   │
 │<───────────────────────────────────────────────────────│                   │
 │                │                    │                    │                   │
 │                │  GET /payment/verify                    │                   │
 │                │───────────────────>│                    │                   │
 │                │                    │  查询订单状态       │                   │
 │                │                    │──────────────────────────────────────>│
 │                │  返回验证结果       │                    │                   │
 │                │<───────────────────│                    │                   │
 │  显示支付结果   │                    │                    │                   │
 │<───────────────│                    │                    │                   │
```

---

## 七、前端对接指南

### 7.1 发起支付

前端通过隐藏表单 POST 提交到 Z-Pay 网关（避免 CORS 问题）：

```typescript
async function startPayment(plan: { name: string; price: number; id: string }) {
  // 1. 调用支付服务创建订单
  const res = await fetch('https://payment-service.com/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: plan.id,
      product_name: plan.name,
      amount: plan.price,
      payment_type: 'alipay',
      user_id: currentUser.id,
      email: currentUser.email,
    }),
  });
  const { data } = await res.json();

  // 2. 创建隐藏表单提交到 Z-Pay
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = data.pay_url; // Z-Pay 网关地址
  form.style.display = 'none';

  Object.entries(data.form_params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
```

### 7.2 支付成功页验证

```typescript
// payment-success 页面
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  fetch(`https://payment-service.com/api/payment/verify?${params.toString()}`)
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        // 显示支付成功
      } else {
        // 显示失败，提供重试按钮
      }
    });
}, []);
```

---

## 八、Z-Pay return_url 跳转参数

用户在 Z-Pay 完成支付后，Z-Pay 会 302 跳转到 `return_url`，并附带以下 query 参数：

| 参数 | 说明 |
|------|------|
| `pid` | 商户ID |
| `trade_no` | 平台交易号 |
| `out_trade_no` | 商户订单号 |
| `type` | 支付方式 |
| `name` | 商品名称 |
| `money` | 支付金额 |
| `trade_status` | 交易状态 |
| `param` | 自定义参数 |
| `sign` | 签名 |
| `sign_type` | 签名类型 |

前端 `payment-success` 页面应使用这些参数调用 `/api/payment/verify` 验证。

---

## 九、注意事项与最佳实践

### 9.1 安全

1. **签名密钥不要暴露到前端** — `PAYMENT_KEY` 只在服务端使用
2. **回调验签必须做** — 防止伪造回调请求
3. **回调始终返回 `success`** — 否则 Z-Pay 会重复通知（最多 3 次）
4. **金额校验** — 回调时校验 `money` 是否与订单一致

### 9.2 订单号生成

```typescript
// 推荐格式：时间戳 + 随机数，保证唯一性
function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
}
```

### 9.3 防重复回调

Z-Pay 在未收到 `success` 响应时会重复回调（间隔递增）。使用 `upsert`（INSERT ON CONFLICT UPDATE）处理：

```sql
INSERT INTO orders (...) VALUES (...)
ON CONFLICT (out_trade_no) DO UPDATE SET
  status = 'paid',
  trade_no = EXCLUDED.trade_no,
  pay_time = NOW(),
  updated_at = NOW();
```

### 9.4 param 字段

`param` 是自定义透传字段，Z-Pay 不做处理。建议传递 JSON 字符串包含：
- `user_id` — 业务系统用户ID
- `product_id` — 产品ID
- `email` — 用户邮箱

回调时从 `param` 字段解析回来即可关联业务数据。

### 9.5 支付方式扩展

当前硬编码为 `alipay`。如需支持微信支付，将 `type` 改为 `wxpay`，前端增加选择入口即可。Z-Pay 支持的类型包括：

| type 值 | 说明 |
|---------|------|
| `alipay` | 支付宝 |
| `wxpay` | 微信支付 |
| `qqpay` | QQ钱包 |

---

## 十、独立 Node.js 服务参考结构

```
payment-service/
├── src/
│   ├── index.ts              # 入口，Express/Fastify 启动
│   ├── config.ts             # 环境变量读取
│   ├── routes/
│   │   ├── payment.ts        # /api/payment/create, /callback, /verify
│   │   └── orders.ts         # /api/orders/*
│   ├── services/
│   │   ├── zpay.ts           # Z-Pay 签名、构造参数
│   │   └── order.ts          # 订单 CRUD
│   ├── utils/
│   │   └── sign.ts           # MD5 签名工具函数
│   └── db/
│       ├── index.ts          # 数据库连接
│       └── schema.ts         # 表结构定义
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 十一、错误码对照

| 场景 | 返回 | 说明 |
|------|------|------|
| 签名验证失败 | `fail` (纯文本) | 回调接口返回 |
| 商户ID不匹配 | `success` (纯文本) | 仍返回 success 防重复回调 |
| 参数缺失 | `{ success: false, message: "缺少必要参数" }` | verify 接口返回 |
| 订单不存在 | `{ success: false, message: "订单不存在" }` | verify 接口返回 |
| 订单未支付 | `{ success: false, message: "订单状态异常" }` | verify 接口返回 |
| 支付成功 | `{ success: true, order: {...} }` | verify 接口返回 |
