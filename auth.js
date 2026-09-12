// ==============================================
// auth.js —— 登录 / 注册 / 退出
// 对应 index.html 里的元素 id：
//   #login-email / #login-password / #login-message
//   #login-submit / #login-toggle / #login-title
//   #login-overlay / #app-content / #logoutBtn
// ==============================================

let isLoginMode = true

// ---------- 切换登录 / 注册模式 ----------
function toggleMode() {
  isLoginMode = !isLoginMode
  const title  = document.getElementById('login-title')
  const btn    = document.getElementById('login-submit')
  const toggle = document.getElementById('login-toggle')

  if (isLoginMode) {
    title.textContent = '二流人预警'
    btn.textContent   = '登录'
    toggle.textContent = '没有账号？去注册'
  } else {
    title.textContent = '注册账号'
    btn.textContent   = '注册'
    toggle.textContent = '已有账号？去登录'
  }
  setMsg('')
  return false // 阻止默认行为
}

// ---------- 登录 / 注册提交 ----------
function handleAuth() {
  const email    = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value

  if (!email || !password) { setMsg('请填写邮箱和密码', 'error'); return false }
  if (password.length < 6) { setMsg('密码至少 6 位', 'error'); return false }

  const client = window.supabaseClient
  if (!client) {
    setMsg('系统错误：客户端未初始化，请检查 config.js', 'error')
    console.error('[auth.js] window.supabaseClient 不存在')
    return false
  }

  if (isLoginMode) {
    // 登录
    client.auth.signInWithPassword({ email, password }).then(({ error }) => {
      if (error) { setMsg(error.message, 'error') }
      else       { setMsg('登录成功！', 'success'); setTimeout(() => location.reload(), 400) }
    })
  } else {
    // 注册
    client.auth.signUp({ email, password }).then(({ error }) => {
      if (error) { setMsg(error.message, 'error') }
      else {
        setMsg('注册成功！请登录', 'success')
        setTimeout(() => { isLoginMode = true; toggleMode() }, 1000)
      }
    })
  }

  return false // ⚠️ 关键：阻止表单默认提交 / 页面跳转（修复"打开新页面"问题）
}

// ---------- 退出 ----------
function logout() {
  const client = window.supabaseClient
  if (client) client.auth.signOut().then(() => location.reload())
  return false
}

// ---------- 提示信息 ----------
function setMsg(text, type) {
  const el = document.getElementById('login-message')
  if (el) {
    el.textContent = text
    el.className   = 'login-msg' + (type ? ' ' + type : '')
  }
}

// ==============================================
// 页面加载完成后：监听登录状态 + 初始检查
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
  const client = window.supabaseClient
  if (!client) {
    console.error('[auth.js] window.supabaseClient 不存在，检查 config.js')
    return
  }

  // 初始检查当前会话
  client.auth.getUser().then(({ data }) => applyAuthState(!!data?.user))
  // 监听登录状态变化
  client.auth.onAuthStateChange((event, session) => applyAuthState(!!session?.user))
})

// 根据登录状态显示 / 隐藏内容
function applyAuthState(isLoggedIn) {
  const overlay = document.getElementById('login-overlay')
  const app     = document.getElementById('app-content')
  const logoutBtn = document.getElementById('logoutBtn')
  if (isLoggedIn) {
    if (overlay)   overlay.style.display = 'none'
    if (app)       app.style.display    = 'block'
    if (logoutBtn) logoutBtn.style.display = 'block'
  } else {
    if (overlay)   overlay.style.display = 'flex'
    if (app)       app.style.display    = 'none'
    if (logoutBtn) logoutBtn.style.display = 'none'
  }
}
