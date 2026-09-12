# Supabase 数据库设置

## ⚠️ 重要提醒：只复制纯 SQL 代码！
- **不要**复制中文注释、网址、` ```sql ` 标记
- 只复制 `create table...`、`alter table...`、`create policy...` 这些纯 SQL
- 每次只跑一条 SQL（选中后点 Run），避免报错

---

## 第一步：建表（最小版本，先跑通再说）

进 Supabase → SQL Editor → New Query，把下面的**逐条**复制执行：

```sql
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);
```

```sql
create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date text not null,
  raw_data text not null,
  results jsonb,
  created_at timestamptz default now()
);
```

## 第二步：开启 RLS + 权限策略

```sql
alter table user_profiles enable row level security;
alter table saved_searches enable row level security;

create policy "自己看自己" on user_profiles for select using (auth.uid() = id);
create policy "自己建自己" on user_profiles for insert with check (auth.uid() = id);

create policy "看自己的记录" on saved_searches for select using (auth.uid() = user_id);
create policy "写自己的记录" on saved_searches for insert with check (auth.uid() = user_id);
create policy "改自己的记录" on saved_searches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "删自己的记录" on saved_searches for delete using (auth.uid() = user_id);
```

> 💡 如果不想建表也能登录（只是想加登录门，暂时不用数据库功能），
> 那**第一步和第二步可以跳过**。登录只需要 `auth.users` 表（Supabase 自动有的）。
> 等你后续要用"保存搜索记录"功能再加表。

## 第三步：配置 Auth（必做！）

Supabase → **Authentication → URL Configuration**：
- Site URL: `https://你的用户名.github.io`
- Redirect URLs: 加上 `https://你的用户名.github.io`
- 本地调试也加: `http://127.0.0.1:5500`

**Authentication → Providers → Email**：
- 学习阶段建议**关掉** "Confirm email"（不然注册后要验证邮箱才能登录）

## 第四步：拿到 API 信息（填到 config.js）

Supabase → **Settings → API**：
- **Project URL** → 填到 `config.js` 的 `SUPABASE_URL`
  - ⚠️ 只要 `https://xxxx.supabase.co`，**不要** `/rest/v1/`
- **anon / public key**（也叫 publishable key）→ 填到 `SUPABASE_ANON_KEY`
  - ⚠️ 只用 anon key，**绝不**用 service_role

---

## 常见报错排查

### ❌ `Cannot read properties of undefined (reading 'signUp')`
→ `config.js` 没加载好。检查：
1. URL 是否带了 `/rest/v1/`（要去掉）
2. `config.js` 最后一行 `window.supabase = supabase` 是否在
3. HTML 里 CDN → config.js → auth.js 顺序是否正确

### ❌ `invalid API key`
→ key 复制错了。去 Settings → API 重新复制 anon key，确保是完整的一长串。

### ❌ `Failed to fetch` / CORS 报错
→ URL Configuration 里没加你的网址。加上 `http://127.0.0.1:5500`（本地）和 `https://用户名.github.io`（线上）。

### ❌ 注册后没反应
→ Confirm email 没关。去 Authentication → Providers → Email → 关掉。

### ❌ SQL 报错 `syntax error at or near "https"`
→ 你把网址/中文说明一起复制到 SQL Editor 了。只复制纯 SQL 代码。
