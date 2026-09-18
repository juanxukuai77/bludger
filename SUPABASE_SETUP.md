# Supabase 数据库设置（完整版）

## ⚠️ 重要说明
**登录/注册功能不需要建表**——Supabase Authentication 自带 `auth.users` 表。

**其他功能（机型筛选、公告、航班信息）需要建表**，全部 SQL 在下面，一次性跑完即可。

---

## 必跑 SQL（复制粘贴到 Supabase → SQL Editor → Run）

```sql
-- ============================================================
-- 1. 管理员表（把指定用户设为管理员）
-- ============================================================
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- ⚠️ 把下面 UUID 换成 3678163357@qq.com 这个用户在 Supabase 里的 user_id
-- 获取方式：Supabase → Authentication → Users → 找到该邮箱 → 复制 ID
insert into admins (user_id, email) values
  ('在这里填3678163357@qq.com的UUID'::uuid, '3678163357@qq.com')
on conflict (user_id) do nothing;

alter table admins enable row level security;

create policy "管理员自己可读" on admins
  for select using (auth.uid() = user_id);

-- ============================================================
-- 2. 全局公告表（单行，id 固定为 1）
-- ============================================================
create table if not exists site_announcement (
  id int primary key default 1,
  content text not null default '',
  updated_at timestamptz default now()
);

insert into site_announcement (id, content) values (1, '')
on conflict (id) do nothing;

alter table site_announcement enable row level security;

create policy "登录用户可读公告" on site_announcement
  for select using (true);

create policy "仅管理员可改公告" on site_announcement
  for update using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "禁止增删公告" on site_announcement
  for insert with check (false);
create policy "禁止删公告" on site_announcement
  for delete using (false);

-- ============================================================
-- 3. 航班信息表（管理员输入，全员实时同步）
-- ============================================================
create table if not exists flight_data (
  id int primary key default 1,
  content text not null default '',
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

insert into flight_data (id, content) values (1, '')
on conflict (id) do nothing;

alter table flight_data enable row level security;

create policy "登录用户可读航班信息" on flight_data
  for select using (true);

create policy "仅管理员可改航班信息" on flight_data
  for update using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "禁止增删航班信息" on flight_data
  for insert with check (false);
create policy "禁止删航班信息" on flight_data
  for delete using (false);

-- ============================================================
-- 4. 用户机型筛选配置表
-- ============================================================
create table if not exists user_settings (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  aircraft_types text[] not null default '{}'
);

alter table user_settings enable row level security;

create policy "自己看自己配置" on user_settings
  for select using (auth.uid() = user_id);

create policy "自己改自己配置" on user_settings
  for insert with check (auth.uid() = user_id);

create policy "自己更新自己配置" on user_settings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```


## 还需要开启实时订阅（航班信息实时同步用）

Supabase → **Database → Replication** → 找到 `flight_data` 表 → 开启 **Realtime**。

如果不开启，实时同步不会生效（需要刷新页面才能看到更新）。

---

## Auth 后台配置（必做，不管建不建表都要做）

1. **关闭邮箱确认**
   Authentication → Providers → Email → 关闭 `Confirm email`

2. **加网址白名单**
   Authentication → URL Configuration → Site URL 填：
   - 线上：`https://你的用户名.github.io`
   - 本地调试：`http://127.0.0.1:5500`

⚠️ 这些网址是在 Supabase 后台 Auth 设置里填的，不是放在 SQL 编辑器里运行！

---

## 权限矩阵

| 功能 | 普通用户 | 管理员（3678163357@qq.com） |
|------|---------|---------------------------|
| 看公告 | ✅ | ✅ |
| 改公告 | ❌ 数据库拒绝 | ✅ 有编辑窗口 |
| 看航班信息 | ✅ | ✅ |
| 改航班信息 | ✅ 只存本地 | ✅ 保存后全员实时同步 |
| 改机型筛选 | ✅ 存自己 | ✅ 存自己 |
| 每日首次弹公告 | ✅ | ✅ |

---

## 默认机型

`B733 B734 B737 B38M B744 B748 B752 B762 B763 B77L B77W B788 B789 A346 C909 C919 AN124`

如需修改默认值，改 `index.html` 里的 `DEFAULT_AIRCRAFT_TYPES`。
