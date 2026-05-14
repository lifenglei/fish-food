# 在线喂鱼公益站

这是一个 Vite + React + TypeScript 的在线喂鱼公益站，前端负责展示与交互，后端 Node 服务负责读取/写入 Supabase 数据并承载后续扩展能力。

## 项目结构

- `frontend`：仓库根目录，运行 Vite 前端
- `backend`：Node + Express API，负责鱼群、投喂流水和后续扩展

## 本地开发

### 1. 安装依赖

```bash
npm install
npm install --prefix backend
```

### 2. 配置前端环境变量

在根目录创建 `.env.local`：

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

如果前端和后端同域部署，线上也可以保持相对路径 `/api`。

### 3. 配置后端环境变量

在 `backend/.env` 或运行环境中配置：

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 启动服务

分别启动两个进程：

```bash
npm run dev
npm run dev:backend
```

前端默认在 `http://localhost:3000`，后端默认在 `http://localhost:4000`。

## 可用 API

- `GET /api/health` - 健康检查
- `GET /api/fish/species` - 获取鱼种列表
- `GET /api/fish/catalog` - 获取鱼列表
- `GET /api/feedings?limit=40` - 获取最近投喂流水
- `POST /api/feedings` - 提交投喂记录

## 部署建议

### 前端

- 直接部署 `vite build` 生成的 `dist/` 静态资源
- 前端仅需要公开的 API 地址，不要把私密密钥放进浏览器

### 后端

- 将 `backend` 作为独立 Node 服务部署
- 运行前设置 `PORT`、`FRONTEND_ORIGIN`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`
- 后端负责访问 Supabase，不暴露 service role key 给前端

### 环境变量分工

**前端**
- `VITE_API_BASE_URL`

**后端**
- `PORT`
- `FRONTEND_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 说明

- 现在投喂提交不会再从浏览器直接写 Supabase
- 最近投喂列表和鱼种数据都通过后端 API 获取
- `vite.config.ts` 已移除 Gemini API Key 注入
- 后续要接第三方支付、Webhook、风控或更复杂的鉴权，也可以继续放在后端扩展
