# 二流人预警 + Supabase 登录系统（含管理员、公告、航班同步）

## 功能一览

### 1️⃣ 登录界面 UI 美化（国画风）
- 青绿山水渐变背景 + 宣纸质感卡片 + 卷轴内边框
- 登录 / 注册模式切换（带错误/成功提示）

### 2️⃣ 每个用户可自定义筛选机型
- 从默认机型列表里**勾选**，只输出勾选的机型
- 每个用户独立保存，下次登录自动加载

### 3️⃣ 管理员系统
- `3678163357@qq.com` 为管理员（可在 `admins` 表配置）
- 管理员可见"📢 编辑公告"按钮 + 航班信息同步区

### 4️⃣ 全局公告
- 管理员可编辑公告内容，所有用户每日首次登录弹出
- 留空则不弹

### 5️⃣ 航班信息同步
- 管理员在"同步区"输入 → 保存后**全员实时自动同步**
- 普通用户也可改航班信息（只影响自己本地，不影响别人）
- 基于 Supabase Realtime 实时推送

### 6️⃣ 关于作者
- 个人信息旁下拉按钮 → 小红书 / 哔哩哔哩（链接内置，新标签页打开）

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

## 本次新增功能（续）

### 4️⃣ 关于作者按钮（个人信息旁边）
- 左上角头像旁新增 **"关于作者 ▾"** 下拉按钮
- 两个选项：**小红书** / **哔哩哔哩**，点选后**新标签页跳转**
  - 小红书：`https://xhslink.cn/o/7Lb3ao1166Q`
  - 哔哩哔哩：`https://b23.tv/JzeTBk4`
- 链接写在 `index.html` 的 `<a href="...">`，**要换链接直接改这里两行即可**
- 点页面其它地方自动收起下拉

### 5️⃣ 每日首次登录公告（悬浮弹层）
- 登录成功后自动检查 `user_settings.announcement` 字段
- **有内容 → 以悬浮卡片弹出**；**为空 → 不弹**
- **每人每天只弹一次**：用浏览器 `localStorage` 记录"今日已读"
- 点"我知道了"或 ✕ 关闭；**退出登录会清除已读标记**，这样重新登录算"首次"会再弹
- 样式见 `style-auth.css` 的 `#announceOverlay / .announce-card`

### 6️⃣ 公告内容随时可改（不用改代码、不用重新部署）
你（管理员）只需在自己的浏览器登录后，F12 → Console 执行：
```js
updateAnnouncement("2026-05-04 公告：新增 C919 彩绘识别，欢迎测试！")
```
- 这条会立刻写入你自己的 `user_settings.announcement` 行
- **⚠️ 关键点**：`user_settings` 是"每人一行"，所以改公告最干净的做法是——
  **把公告存在你自己的用户行里，并让读取逻辑读你这一行**。上面代码是"每人读自己的行"。
  👉 若想"管理员改一次、所有人看到"，见下方"全局公告"说明。

#### 🔧 想让所有人看到同一份公告（推荐）
把 `checkDailyAnnounce()` 里查 `user_id = uid` 的部分改成读一个**固定管理员 UUID**（你的 user id），
或在 Supabase 里建一张独立表 `site_settings(singleton_id, announcement)`，只维护一行：
```sql
create table site_settings (
  singleton_id int primary key default 1,
  announcement text default ''
);
-- 插入一行（只需一次）
insert into site_settings(announcement) values ('欢迎使用二流人预警！');
```
然后 `checkDailyAnnounce` 改成 `client.from('site_settings').select('announcement').eq('singleton_id',1).single()`，
`updateAnnouncement` 改成对 `site_settings` 做 upsert。**这样你改一次，全员即时生效。**

> 当前打包版本用的是"读自己行"的方式，逻辑完整可用；需要"全局公告"时按上面改 2 个函数即可，其余不用动。

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
