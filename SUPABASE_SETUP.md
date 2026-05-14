# Supabase 集成配置指南

## 配置步骤

### 1. 在 Supabase 中创建数据库表

1. 登录您的 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 执行 `supabase-setup.sql` 文件中的 SQL 脚本

这将创建 `fish_types`、`fish` 和 `wishes` 表，并设置必要的权限策略。

### 2. 获取 Supabase 凭证

1. 在 Supabase Dashboard 中，进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL**（例如 `https://xxxxx.supabase.co`）
   - **service role key**（仅供后端使用）

### 3. 配置环境变量

#### 前端

在项目根目录创建 `.env.local` 文件（如果不存在），添加以下内容：

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

#### 后端

在 `backend/.env` 或你的部署环境中添加：

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 重启开发服务器

配置完成后，重启开发服务器：

```bash
npm run dev
npm run dev:backend
```

## 验证配置

配置成功后，你应该能够：

1. 在页面中选择鱼和鱼粮，然后提交一次投喂
2. 在最近投喂区域看到投喂流水（通过后端 API 拉取）
3. 后端可以正常写入 `wishes` 表

## 安全说明

- `VITE_API_BASE_URL` 是公开配置，可以放在前端
- `SUPABASE_SERVICE_ROLE_KEY` 只能放在后端
- 前端不再直接写 Supabase
- 数据库建议继续使用 RLS，并仅对后端开放写入能力

## 故障排除

如果遇到问题：

1. **检查环境变量**：确认前端和后端的 `.env` 配置正确
2. **检查数据库表**：确认已执行 `supabase-setup.sql`
3. **检查后端日志**：确认 `/api/health` 正常返回
4. **检查浏览器控制台**：查看前端是否正确请求后端 API
