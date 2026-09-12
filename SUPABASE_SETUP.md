# Supabase 数据库设置

## 第一步：建表
在 Supabase → SQL Editor → New Query 里执行：

```sql
-- 用户表（记录谁在用）
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- 保存的查询记录（可选：让用户保存查询结果）
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date text not null,
  raw_data text not null,
  results jsonb,
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;
alter table saved_searches enable row level security;

-- 策略：用户只能看自己的数据
create policy "自己看自己" on user_profiles for select using (auth.uid() = id);
create policy "自己建自己" on user_profiles for insert with check (auth.uid() = id);

create policy "看自己的记录" on saved_searches for select using (auth.uid() = user_id);
create policy "写自己的记录" on saved_searches for insert with check (auth.uid() = user_id);
create policy "改自己的记录" on saved_searches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "删自己的记录" on saved_searches for delete using (auth.uid() = user_id);

-- 新用户自动创建 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 第二步：配置 Auth
Supabase → Authentication → URL Configuration：
- Site URL: `https://你的用户名.github.io`
- Redirect URLs: `https://你的用户名.github.io`
- 本地调试加: `http://127.0.0.1:5500`

Authentication → Providers → Email：
- 学习阶段建议关掉 "Confirm email"

## 第三步：拿到 API 信息
Supabase → Settings → API：
- Project URL → 填到 config.js 的 SUPABASE_URL
- anon / public key → 填到 config.js 的 SUPABASE_ANON_KEY
