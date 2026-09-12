# 二流人预警 + Supabase 登录系统

## 📁 文件清单
```
index.html         ← 主页面（登录 + 航班识别，已整合）
config.js          ← ⭐ 只需改这个文件（填 Supabase 信息）
auth.js            ← 登录逻辑（已修复 DOMContentLoaded 问题）
style-auth.css     ← 登录界面样式
SUPABASE_SETUP.md  ← 数据库建表说明 + 报错排查
README.md          ← 本文件
images/            ← 飞机图片（B6719.jpg 等，需自己放）
```

## 🚀 快速开始（5步）

### 第1步：改 config.js
打开 config.js，填你的 Supabase 信息：
```js
const SUPABASE_URL = 'https://xxxx.supabase.co'   // ← 你的 Project URL（只要根域名！）
const SUPABASE_ANON_KEY = 'eyJhbGciOi......'      // ← 你的 anon key
```
⚠️ URL 不要带 `/rest/v1/`！

### 第2步：Supabase 建表（可选）
如果只是加登录门，可以跳过。需要"保存搜索记录"功能才跑 SQL。
详见 `SUPABASE_SETUP.md`。

### 第3步：配置 Auth 网址（必做）
Supabase → Authentication → URL Configuration
- Site URL: `https://你的用户名.github.io`
- Providers → Email → **关掉 Confirm email**

### 第4步：上传 GitHub
把所有文件放仓库根目录（含 images/），开 GitHub Pages

### 第5步：访问测试
打开 `https://你的用户名.github.io` → 注册 → 登录 → 使用！

## 🔧 已修复的问题（v2）
1. ✅ config.js 添加了 `window.supabase = supabase`（全局挂载）
2. ✅ auth.js 用 DOMContentLoaded 包裹（避免 DOM 未加载就读元素）
3. ✅ 统一用 `window.supabase.auth.xxx` 调用
4. ✅ index.html 中 CDN / config / auth 顺序调整到 head 里
5. ✅ SUPABASE_SETUP.md 简化 SQL + 加了报错排查

## ⚠️ 注意事项
- images/ 文件夹也要一起上传（飞机图片）
- config.js 里只能用 anon key，不能用 service_role
- 本地调试用 Live Server（VS Code 插件），地址 `http://127.0.0.1:5500`
- 有任何报错先 F12 → Console 看红字
