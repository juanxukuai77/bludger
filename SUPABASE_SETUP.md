# Supabase 数据库设置（照抄执行即可）

## 第 1 步：建表

进 Supabase → SQL Editor → New Query → 粘贴执行：

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
```

> 如果你的表单字段不同，把 `content` 换成你自己的字段名即可。

## 第 2 步：开启 RLS（行级安全，必须做）

```sql
alter table messages enable row level security;
```

## 第 3 步：写权限策略（每人只能看/改自己的数据）

```sql
-- 读取：登录用户可以看所有（留言板场景）
-- 如果只想看自己的，把 using(true) 改成 using(auth.uid() = user_id)
create policy "任何人可读" on messages for select using (true);

-- 写入：只能插入自己的 user_id
create policy "登录用户可写" on messages for insert
  with check (auth.uid() = user_id);

-- 修改：只能改自己的
create policy "登录用户可改" on messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 删除：只能删自己的
create policy "登录用户可删" on messages for delete
  using (auth.uid() = user_id);
```

## 第 4 步：配置允许访问的域名

Supabase → Authentication → URL Configuration：

Site URL 填你的 GitHub Pages 地址：
```
https://你的用户名.github.io
```

Redirect URLs 也加上：
```
https://你的用户名.github.io
```

如果本地调试，再加：
```
http://127.0.0.1:5500
```

## 第 5 步：关闭邮件确认（可选，方便测试）

Authentication → Providers → Email → 关闭 "Confirm email"

> ⚠️ 生产环境建议保持开启
