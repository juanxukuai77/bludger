// ==========================================
// auth.js —— 直接覆盖你原来的
// ==========================================

// 登录/注册模式切换
let isLoginMode = true

function toggleMode() {
  isLoginMode = !isLoginMode
  const title = document.getElementById('auth-title')
  const btn = document.getElementById('auth-submit-btn')
  const toggle = document.getElementById('auth-toggle-text')

  if (isLoginMode) {
    title.textContent = '登录'
    btn.textContent = '登录'
    toggle.innerHTML = '没有账号？<a href="#" onclick="toggleMode();return false;">去注册</a>'
  } else {
    title.textContent = '注册'
    btn.textContent = '注册'
    toggle.innerHTML = '已有账号？<a href="#" onclick="toggleMode();return false;">去登录</a>'
  }
  document.getElementById('auth-message').textContent = ''
}

// 提交登录/注册
async function handleAuth() {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (!email || !password) {
    showMsg('请填写邮箱和密码', 'error')
    return
  }
  if (password.length < 6) {
    showMsg('密码至少 6 位', 'error')
    return
  }

  const client = window.supabaseClient
  if (!client) {
    showMsg('系统错误：supabase 客户端未初始化', 'error')
    console.error('window.supabaseClient 不存在，检查 config.js')
    return
  }

  let error
  if (isLoginMode) {
    const res = await client.auth.signInWithPassword({ email, password })
    error = res.error
  } else {
    const res = await client.auth.signUp({ email, password })
    error = res.error
  }

  if (error) {
    showMsg(error.message, 'error')
  } else {
    showMsg(isLoginMode ? '登录成功！' : '注册成功！', 'success')
    if (isLoginMode) {
      // 登录成功后刷新页面，让 onAuthStateChange 接管
      setTimeout(() => location.reload(), 500)
    }
  }
}

// 退出登录
async function logout() {
  const client = window.supabaseClient
  if (client) {
    await client.auth.signOut()
    location.reload()
  }
}

// 显示消息
function showMsg(text, type) {
  const el = document.getElementById('auth-message')
  if (el) {
    el.textContent = text
    el.style.color = type === 'error' ? '#ef4444' : '#22c55e'
  }
}

// ==========================================
// 页面加载后：监听登录状态
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const client = window.supabaseClient

  if (!client) {
    console.error('supabaseClient 未找到，检查 config.js 是否正确挂载了 window.supabaseClient')
    return
  }

  // 监听登录状态变化
  client.auth.onAuthStateChange((event, session) => {
    const overlay = document.getElementById('auth-overlay')
    const app = document.getElementById('app-container')

    if (session?.user) {
      // 已登录 → 隐藏登录框，显示内容
      if (overlay) overlay.style.display = 'none'
      if (app) app.style.display = 'block'
    } else {
      // 未登录 → 显示登录框，隐藏内容
      if (overlay) overlay.style.display = 'flex'
      if (app) app.style.display = 'none'
    }
  })

  // 页面一打开先检查当前会话
  client.auth.getUser().then(({ data }) => {
    const overlay = document.getElementById('auth-overlay')
    const app = document.getElementById('app-container')
    if (data?.user) {
      if (overlay) overlay.style.display = 'none'
      if (app) app.style.display = 'block'
    } else {
      if (overlay) overlay.style.display = 'flex'
      if (app) app.style.display = 'none'
    }
  })
})
