// =============================================
//  登录系统核心逻辑
// =============================================

let isLoginMode = true // true = 登录模式，false = 注册模式

// ---------- 切换登录 / 注册 ----------
function toggleMode() {
  isLoginMode = !isLoginMode
  document.getElementById('auth-title').textContent = isLoginMode ? '登录' : '注册'
  document.querySelector('#auth-container button').textContent = isLoginMode ? '登录' : '注册'
  document.getElementById('auth-message').textContent = ''
}

// ---------- 处理登录 / 注册 ----------
async function handleAuth() {
  const email    = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value.trim()
  const msg      = document.getElementById('auth-message')

  if (!email || !password) {
    msg.textContent = '请填写邮箱和密码'
    return
  }
  if (password.length < 6) {
    msg.textContent = '密码至少6位'
    return
  }

  if (isLoginMode) {
    // ---- 登录 ----
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { msg.textContent = '登录失败：' + error.message; return }
    msg.textContent = '登录成功！'
  } else {
    // ---- 注册 ----
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { msg.textContent = '注册失败：' + error.message; return }
    msg.textContent = '注册成功！请登录'
    toggleMode() // 注册完切回登录
  }
}

// ---------- 退出 ----------
async function logout() {
  await supabase.auth.signOut()
}

// ---------- 监听登录状态变化 ----------
supabase.auth.onAuthStateChange((event, session) => {
  const authContainer = document.getElementById('auth-container')
  const appContainer = document.getElementById('app-container')

  if (session?.user) {
    // ✅ 已登录：隐藏登录框，显示主体
    authContainer.style.display = 'none'
    appContainer.style.display  = 'block'
    document.getElementById('user-email').textContent = session.user.email

    // 登录后加载数据
    loadData()
  } else {
    // ❌ 未登录：显示登录框，隐藏主体
    authContainer.style.display = 'flex'
    appContainer.style.display  = 'none'
  }
})

// =============================================
//  以下是"登录后才能操作"的示例功能
//  你可以替换成自己的表单提交逻辑
// =============================================

// ---------- 页面加载时读取数据 ----------
async function loadData() {
  const { data, error } = await supabase
    .from('messages')           // ← 改成你自己的表名
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('读取失败:', error); return }

  const ul = document.getElementById('data-list')
  ul.innerHTML = ''
  for (const row of data) {
    const li = document.createElement('li')
    li.textContent = row.content
    ul.appendChild(li)
  }
}

// ---------- 表单提交（只有登录后才能执行） ----------
async function handleSubmit(e) {
  e.preventDefault()

  // 确认当前用户已登录
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { alert('请先登录'); return }

  const input = document.getElementById('form-input')
  const content = input.value.trim()
  if (!content) return

  // 写入数据库
  const { error } = await supabase
    .from('messages')                     // ← 改成你自己的表名
    .insert({ user_id: user.id, content }) // ← content 改成你自己的字段名

  if (error) { alert('提交失败：' + error.message); return }

  input.value = ''
  loadData() // 刷新列表
}
