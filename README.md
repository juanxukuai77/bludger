# 二流人预警 + Supabase 登录系统（含自定义筛选机型）

## 本次新增功能

### 1️⃣ 登录界面 UI 美化（国画风）
- 青绿山水渐变背景 + 宣纸质感卡片 + 卷轴内边框
- 卡片入场动画、按钮悬浮效果
- 登录 / 注册模式切换（带错误/成功提示）

### 2️⃣ 每个用户可自定义筛选机型（核心需求 ✅）
- 登录后右上角点 **"⚙️ 我的筛选机型"** 打开面板
- 输入机型代码（如 `B737`、`A320`、`C919`）点添加 / 回车
- 标签式展示，**点 × 删除**
- **自动保存到 Supabase**：每个用户独立，下次登录自动加载

### 3️⃣ 工作原理
```
登录 → auth.js 从 user_settings 表读该用户的 aircraft_types
     → 写入 window.userAircraftTypes
     → 主页面 processData() 用它构建筛选的 typeSet
添加/删除机型 → saveUserSettings() → upsert 回数据库
下次登录 → 自动加载该用户自己的列表
```
> 未登录或用户无配置时，使用默认机型列表（`AIRCRAFT_TYPE_CONFIG`）。

---

## 文件清单

| 文件 | 作用 |
|------|------|
| `index.html` | 主页面（已内联合并美化登录框 + 设置面板） |
| `config.js` | ⭐ **只改这一个文件**（填 URL + KEY） |
| `auth.js` | 登录/注册/退出 + 机型配置保存/加载 |
| `style-auth.css` | 登录框 + 设置面板样式 |
| `SUPABASE_SETUP.md` | **建表 SQL（user_settings 表）** |
| `_test_local.html` | 🧪 本地自检页（不用服务器，**不上传 GitHub**） |
| `_test_node.js` | 🧪 Node 自动化测试（开发用，可不传） |

---

## 操作步骤

### ① 改 `config.js`（唯一要改的文件）
```js
const SUPABASE_URL      = 'https://xxxx.supabase.co'   // ← 你的 URL（不要 /rest/v1/）
const SUPABASE_ANON_KEY = 'eyJhbGciOi......'           // ← 你的 anon key
```

### ② 跑一次建表 SQL（**这次必跑**，为了机型保存功能）
去 Supabase → SQL Editor → New Query → 粘贴 `SUPABASE_SETUP.md` 里的 SQL → Run：
```sql
create table user_settings (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  aircraft_types text[] not null default '{}'
);
alter table user_settings enable row level security;
create policy "自己看自己配置" on user_settings for select using (auth.uid() = user_id);
create policy "自己改自己配置" on user_settings for insert with check (auth.uid() = user_id);
create policy "自己更新自己配置" on user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### ③ Supabase Auth 配置（必做）
- **Authentication → Providers → Email → 关闭 Confirm email**
- **Authentication → URL Configuration → Site URL** 填：
  - 线上：`https://你的用户名.github.io`
  - 本地：`http://127.0.0.1:5500`

### ④ 本地自检（强烈推荐，省得来回传）
**双击 `_test_local.html`** → F12 看 Console：
- ✅ `supabaseClient 初始化成功`
- 点登录 → 不跳转、提示成功
- 点"⚙️ 我的筛选机型" → 添加 `C919` → 显示"✅ 已保存"
- Console 出现 `[模拟] upsert user_settings {...}` = 成功写入

> ⚠️ 此文件只本地验证，不用上传 GitHub。

### ⑤ 上传到 GitHub Pages
所有文件放仓库根目录 → Settings → Pages → main / root → 等 2 分钟。

---

## 自检（线上）
打开网页 → F12 → Console → 输入：
```js
window.supabaseClient   // 应返回对象
window.userAircraftTypes // 登录后应返回该用户的机型数组
```
改完强制刷新：`Ctrl + F5`。

---

## 常见问题
- **添加机型没保存？** 检查 `user_settings` 表是否建了 + RLS 策略是否粘贴
- **保存报 401/权限？** anon key 是否正确 + 是否关闭 Confirm email
- **机型不生效？** 添加后页面会自动重新筛选；若没反应，F12 看是否有报错

---

## 关键提醒
1. `config.js` 只用 **anon key**，绝不能用 service_role
2. 脚本引入顺序（index.html head 已配好，别改）：
   ```html
   <script src="...supabase-js@2"></script>
   <script src="config.js"></script>
   <script src="auth.js"></script>
   ```
3. 按钮一律 `onclick="return xxx()"`（带 return，防跳转）
