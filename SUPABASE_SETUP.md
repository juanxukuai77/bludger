# Supabase 数据库设置

## ⚠️ 重要说明
**本次登录/注册功能不需要跑这段 SQL！**

Supabase 的 **Authentication** 模块自带 `auth.users` 表，注册和登录直接用这个表。
只有当你后续要扩展以下功能时才需要建表：
- 保存用户的搜索记录
- 用户个人资料
- 留言/评论

---

## 如果需要建表（可选，后续扩展用）

去 Supabase → SQL Editor → New Query → 粘贴执行：

```sql
-- 用户资料表
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- 保存的搜索记录
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date text not null,
  raw_data text not null,
  results jsonb,
  created_at timestamptz default now()
);

-- 开启 RLS
alter table user_profiles enable row level security;
alter table saved_searches enable row level security;

-- 策略：只能操作自己的数据
create policy "自己看自己" on user_profiles for select using (auth.uid() = id);

create policy "自己看自己的搜索" on saved_searches for select using (auth.uid() = user_id);
create policy "自己加自己的搜索" on saved_searches for insert with check (auth.uid() = user_id);
create policy "自己改自己的搜索" on saved_searches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "自己删自己的搜索" on saved_searches for delete using (auth.uid() = user_id);
```

---

## 现在必须做的：Auth 配置（必做）

1. **关闭邮箱确认**（否则注册后要验证邮箱，前端看着像没反应）
   Authentication → Providers → Email → 关闭 `Confirm email`

2. **加网址白名单**
   Authentication → URL Configuration → Site URL 填：
   - 线上：`https://你的用户名.github.io`
   - 本地调试：`http://127.0.0.1:5500`

⚠️ 这些网址是**在 Supabase 后台的 Auth 设置里填的**，不是放在 SQL 编辑器里运行！
