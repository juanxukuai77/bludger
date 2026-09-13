// ==============================================
// auth.js —— 登录 / 注册 / 退出 + 机型筛选配置
//
// 数据表（Supabase 里建一张，SQL 见 SUPABASE_SETUP.md）：
//   user_settings(user_id uuid primary key, aircraft_types text[])
//
// 每个用户一条记录，aircraft_types 存该用户要筛选的机型数组。
// 登录后自动加载 → 写入 window.userAircraftTypes
// 页面里的 processData / typeSet 会读取它作为筛选依据。
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
  return false
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
    client.auth.signInWithPassword({ email, password }).then(({ error }) => {
      if (error) { setMsg(error.message, 'error') }
      else       { setMsg('登录成功！', 'success'); setTimeout(() => window.location && window.location.reload(), 400) }
    })
  } else {
    client.auth.signUp({ email, password }).then(({ error }) => {
      if (error) { setMsg(error.message, 'error') }
      else {
        setMsg('注册成功！请登录', 'success')
        ensureUserSettings(client, email)
        setTimeout(() => { isLoginMode = true; toggleMode() }, 1000)
      }
    })
  }
  return false
}

// 新用户注册后，若没有配置行则插入默认机型
function ensureUserSettings(client, email) {
  const user = (client.auth.getUser && client.auth.getUser().then) ? null : null
  // 用当前会话拿 user_id
  client.auth.getUser().then(({ data }) => {
    const uid = data?.user?.id
    if (!uid) return
    client.from('user_settings').select('user_id').eq('user_id', uid).single().then(({ data: row }) => {
      if (!row) {
        // 取默认机型列表（与 AIRCRAFT_TYPE_CONFIG 一致）
        const defaults = (window.DEFAULT_AIRCRAFT_TYPES || []).map(s => s.toUpperCase())
        client.from('user_settings').insert({ user_id: uid, aircraft_types: defaults })
      }
    })
  })
}

// ---------- 退出 ----------
function logout() {
  const client = window.supabaseClient
  if (client) client.auth.signOut().then(() => { window.location && window.location.reload() })
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
// 页面加载完成后：监听登录状态 + 加载用户机型配置
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
  const client = window.supabaseClient
  if (!client) {
    console.error('[auth.js] window.supabaseClient 不存在，检查 config.js')
    return
  }

  client.auth.getUser().then(({ data }) => applyAuthState(!!data?.user))
  client.auth.onAuthStateChange((event, session) => applyAuthState(!!session?.user))
})

// 根据登录状态显示 / 隐藏内容
function applyAuthState(isLoggedIn) {
  const overlay   = document.getElementById('login-overlay')
  const app       = document.getElementById('app-content')
  const logoutBtn = document.getElementById('logoutBtn')
  if (isLoggedIn) {
    if (overlay)   overlay.style.display   = 'none'
    if (app)       app.style.display       = 'block'
    if (logoutBtn) logoutBtn.style.display = 'block'
    loadUserSettings()   // 登录后加载该用户的机型列表
  } else {
    if (overlay)   overlay.style.display   = 'flex'
    if (app)       app.style.display       = 'none'
    if (logoutBtn) logoutBtn.style.display = 'none'
  }
}

// ==============================================
// 机型配置：加载 / 保存 / 增删（每个用户独立）
// ==============================================
let currentTypes = []

// 从 Supabase 加载当前用户的机型列表 → 写入 window.userAircraftTypes
function loadUserSettings() {
  const client = window.supabaseClient
  if (!client) return

  client.auth.getUser().then(({ data }) => {
    const uid = data?.user?.id
    if (!uid) return

    client.from('user_settings')
      .select('aircraft_types')
      .eq('user_id', uid)
      .single()
      .then(({ data: row, error }) => {
        if (error && error.code !== 'PGRST116') { // PGRST116 = 无记录
          console.error('[loadUserSettings]', error)
          return
        }

        // 若没有配置行，用默认值初始化
        if (!row) {
          const defaults = (window.DEFAULT_AIRCRAFT_TYPES || []).map(s => s.toUpperCase())
          client.from('user_settings')
            .insert({ user_id: uid, aircraft_types: defaults })
            .then(() => { currentTypes = defaults; applyTypesToApp(defaults) })
          return
        }

        const types = (row.aircraft_types || []).map(s => s.toUpperCase())
        currentTypes = types
        applyTypesToApp(types)
        renderTypeTags()
      })
  })
}

// 把机型列表应用到主页面的筛选逻辑
// （主页面读取 window.userAircraftTypes 来构建 typeSet）
function applyTypesToApp(types) {
  window.userAircraftTypes = types   // 主页面 processData 读取这个
  // 若主页面已就绪（window.processData 存在），重新筛选一次
  if (typeof window.processData === 'function') window.processData()
}

// 打开 / 关闭设置面板
function toggleSettings() {
  const panel = document.getElementById('settingsPanel')
  if (!panel) return false
  panel.classList.toggle('open')
  if (panel.classList.contains('open')) renderTypeTags()
  return false
}

// 渲染标签
function renderTypeTags() {
  const box = document.getElementById('typeTags')
  const empty = document.getElementById('settingsStatus')
  if (!box) return
  box.innerHTML = ''
  if (currentTypes.length === 0) {
    box.innerHTML = '<span class="type-tags-empty">暂无机型，添加后系统会按此筛选</span>'
    return
  }
  currentTypes.forEach(t => {
    const span = document.createElement('span')
    span.className = 'type-tag'
    span.innerHTML = `${t} <span class="del" onclick="removeAircraftType('${t}')">&times;</span>`
    box.appendChild(span)
  })
}

// 添加机型
function addAircraftType() {
  const input = document.getElementById('newTypeInput')
  const val   = input.value.trim().toUpperCase()
  if (!val) return false
  if (currentTypes.includes(val)) {
    setSettingsStatus('该机型已存在', 'error')
    return false
  }
  currentTypes.push(val)
  input.value = ''
  saveUserSettings()
  renderTypeTags()
  applyTypesToApp(currentTypes)
  return false
}

// 删除机型
function removeAircraftType(type) {
  currentTypes = currentTypes.filter(t => t !== type)
  saveUserSettings()
  renderTypeTags()
  applyTypesToApp(currentTypes)
  return false
}

// 保存到 Supabase
function saveUserSettings() {
  const client = window.supabaseClient
  if (!client) { setSettingsStatus('保存失败：客户端未初始化', 'error'); return }

  client.auth.getUser().then(({ data }) => {
    const uid = data?.user?.id
    if (!uid) { setSettingsStatus('保存失败：未登录', 'error'); return }

    // upsert：有则更新，无则插入
    client.from('user_settings')
      .upsert({ user_id: uid, aircraft_types: currentTypes })
      .then(({ error }) => {
        if (error) { console.error(error); setSettingsStatus('保存失败：' + error.message, 'error') }
        else       { setSettingsStatus('✅ 已保存（每个用户独立保存，下次登录自动加载）') }
      })
  })
}

function setSettingsStatus(text, type) {
  const el = document.getElementById('settingsStatus')
  if (el) {
    el.textContent = text
    el.className = 'settings-status' + (type ? ' ' + type : '')
  }
}
