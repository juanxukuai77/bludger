# 二流人预警 + Supabase 登录系统

## 这次修好了什么（对应你的两个 bug）

### ❌ 原问题 1：一点登录就打开新页面
**根因**：登录框是 `<form>`，按钮是 `type="submit"`，点击/回车会触发表单默认提交 → 跳转/新开页面。

**修复**：
- `<form>` 改成 `<div>`（不再有默认提交行为）
- 按钮 `onclick="return handleAuth()"`，函数末尾 `return false`

### ❌ 原问题 2：注册按钮不能点 / `signUp undefined`
**根因**：`config.js` 里 `const supabase = ...` 和 Supabase CDN 自带的全局变量重名，报
`Identifier 'supabase' has already been declared`，整个 config.js 执行失败，`supabaseClient` 没挂上。

**修复**：改用 `sbClient` 变量名 → 挂到 `window.supabaseClient`，`auth.js` 全部用 `window.supabaseClient`。

---

## 文件清单

| 文件 | 作用 |
|------|------|
| `index.html` | 你的主页面（已内联合并登录框，改好了） |
| `config.js` | ⭐ **只改这一个文件**（填 URL + KEY） |
| `auth.js` | 登录/注册/退出逻辑（已修复，不用改） |
| `style-auth.css` | 登录框样式（已在 index.html head 引入） |
| `_test_local.html` | 🧪 **本地自检用，不用上传 GitHub** |
| `SUPABASE_SETUP.md` | 数据库建表 SQL（可选） |

---

## 操作步骤

### 1️⃣ 改 `config.js`（唯一要改的文件）
```js
const SUPABASE_URL      = 'https://xxxx.supabase.co'   // ← 你的 URL（不要 /rest/v1/）
const SUPABASE_ANON_KEY = 'eyJhbGciOi......'           // ← 你的 anon key
```

### 2️⃣ 本地先自检（强烈推荐，省得来回传 GitHub）
**双击 `_test_local.html`** 用浏览器打开 → 按 F12 看 Console：
- 看到 `✅ supabaseClient 初始化成功` → 说明 config.js 没问题
- 点"登录"按钮，看到"模拟"提示但不跳转 → 说明按钮修好了

> 这个文件**只用浏览器打开，不用服务器**，也不会真连 Supabase，纯验证 JS。

### 3️⃣ Supabase 后台配置（必做）
- **Authentication → Providers → Email → 关闭 Confirm email**
- **Authentication → URL Configuration → Site URL** 填：
  - 线上：`https://你的用户名.github.io`
  - 本地：`http://127.0.0.1:5500`

### 4️⃣ 上传到 GitHub Pages
所有文件放仓库根目录 → Settings → Pages → main / root → 等 2 分钟。

---

## 关键提醒

1. **按钮一定要 `onclick="return handleAuth()"`**（带 return）
2. **脚本引入顺序**（index.html head 里已配好，不要改）：
   ```html
   <script src="...supabase-js@2"></script>  <!-- CDN -->
   <script src="config.js"></script>          <!-- 创建客户端 -->
   <script src="auth.js"></script>            <!-- 登录逻辑 -->
   ```
3. **config.js 只用 anon key**，绝不能用 service_role
4. 改完强制刷新：`Ctrl + F5`
