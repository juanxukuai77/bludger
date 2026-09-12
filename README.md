# 二流人预警 + Supabase 登录系统

## 📁 文件清单
```
index.html      ← 主页面（登录 + 航班识别，已整合）
config.js       ← ⭐ 只需改这个文件（填 Supabase 信息）
auth.js         ← 登录逻辑（一般不用改）
style-auth.css  ← 登录界面样式
SUPABASE_SETUP.md ← 数据库建表说明
images/         ← 你的飞机图片（B6719.jpg 等）
```

## 🚀 快速开始（5步）

### 第1步：改 config.js
打开 config.js，填你的 Supabase 信息：
```js
const SUPABASE_URL = 'https://xxxx.supabase.co'   // ← 你的 Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOi......'      // ← 你的 anon key
```

### 第2步：Supabase 建表
进 Supabase → SQL Editor → 执行 SUPABASE_SETUP.md 里的 SQL

### 第3步：配置 Auth 网址
Supabase → Authentication → URL Configuration
- Site URL: `https://你的用户名.github.io`
- Providers → Email → 关掉 "Confirm email"（学习用）

### 第4步：上传 GitHub
把所有文件放仓库根目录，开 GitHub Pages

### 第5步：访问测试
打开 `https://你的用户名.github.io` → 注册 → 登录 → 使用！

## ⚠️ 注意事项
- images/ 文件夹也要一起上传（飞机图片）
- config.js 里只能用 anon key，不能用 service_role
- 本地调试用 Live Server（VS Code 插件），地址填 http://127.0.0.1:5500
