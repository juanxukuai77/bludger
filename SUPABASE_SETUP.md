# Supabase 数据库设置（用户自定义机型配置）

## ⚠️ 重要说明
**登录/注册功能不需要建表**——Supabase Authentication 自带 `auth.users` 表。

**只有"每个用户保存自己的筛选机型"这个功能需要建表。**
如果你暂时不想要这个功能，可以跳过，系统会用默认的机型列表。

---

## 必跑 SQL（复制粘贴到 Supabase → SQL Editor → Run）

```sql
-- 用户配置表：每个用户一条记录，aircraft_types 存该用户要筛选的机型
create table user_settings (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  aircraft_types text[] not null default '{}'
);

-- 开启行级安全（必须）
alter table user_settings enable row level security;

-- 策略：用户只能读写自己的配置
create policy "自己看自己配置"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "自己改自己配置"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "自己更新自己配置"
  on user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## Auth 后台配置（必做，不管建不建表都要做）

1. **关闭邮箱确认**（否则注册后要验证邮箱，前端看着像没反应）
   Authentication → Providers → Email → 关闭 `Confirm email`

2. **加网址白名单**
   Authentication → URL Configuration → Site URL 填：
   - 线上：`https://你的用户名.github.io`
   - 本地调试：`http://127.0.0.1:5500`

⚠️ 这些网址是**在 Supabase 后台 Auth 设置里填的**，不是放在 SQL 编辑器里运行！

---

## 工作原理

```
用户登录
  ↓
auth.js 从 user_settings 表读取该 user_id 的 aircraft_types
  ↓
写入 window.userAircraftTypes
  ↓
主页面 processData() 用它构建筛选的 typeSet
  ↓
用户在"⚙️ 我的筛选机型"面板增删 → 点添加/删除自动 upsert 回数据库
  ↓
下次登录自动加载，每人独立
```

默认机型（新用户/无配置时使用）：
`B733 B734 B737 B38M B744 B748 B752 B762 B763 B77L B77W B788 B789 A346 C909 C919 AN124`

如需修改默认值，改 `index.html` 里的 `AIRCRAFT_TYPE_CONFIG`。
