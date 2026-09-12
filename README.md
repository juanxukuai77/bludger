# GitHub Pages + Supabase 登录系统

## 文件说明

```
index.html    ← 页面结构（登录框 + 内容区）
config.js     ← ⭐ 只需改这个文件，填入你的 Supabase 信息
auth.js       ← 登录/注册/退出/数据读写逻辑
style.css     ← 样式
```

## 快速开始

### 1. 修改 config.js

打开 `config.js`，填入你的 Supabase 信息：

```js
const SUPABASE_URL      = 'https://xxxx.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'
```

### 2. 设置 Supabase 数据库

详见 `SUPABASE_SETUP.md`，照抄 SQL 执行即可。

### 3. 把你的 HTML 内容放进去

把 `index.html` 中 `<!-- 这里放你原来的页面内容 -->` 部分
替换成你现有 HTML 的 `<body>` 内容即可。

然后在你的表单提交函数里调用 `supabase` 就行。

### 4. 上传到 GitHub → 开启 GitHub Pages → 完成

## 如何套到你现有的 HTML 里

**只需 3 步：**

1. **复制 3 个标签到你的 `<head>`：**
   ```html
   <link rel="stylesheet" href="style.css" />
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="config.js"></script>
   <script src="auth.js"></script>
   ```

2. **在你的 `<body>` 最顶部加上登录框：**
   ```html
   <div id="auth-container">
     <div class="auth-card">
       <h2 id="auth-title">登录</h2>
       <input id="email" type="email" placeholder="邮箱" />
       <input id="password" type="password" placeholder="密码（至少6位）" />
       <button onclick="handleAuth()">登录</button>
       <button onclick="toggleMode()">切换到注册</button>
       <p id="auth-message"></p>
     </div>
   </div>
   ```

3. **给你的主体内容包一层：**
   ```html
   <div id="app-container" style="display:none;">
     <!-- 你原来的所有内容放这里 -->
   </div>
   ```

搞定。未登录显示登录框，登录后自动显示你的页面。
