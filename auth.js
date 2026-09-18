// ==============================================
// auth.js —— 登录 / 注册 / 退出 + 机型筛选 + 公告 + 航班信息同步
//
// 数据表（Supabase 里建，SQL 见 SUPABASE_SETUP.md）：
//   admins(user_id, email)                        -- 管理员表
//   site_announcement(id, content, updated_at)    -- 全局公告（单行）
//   flight_data(id, content, updated_at)          -- 航班信息（管理员输入，全员同步）
//   user_settings(user_id, aircraft_types)        -- 每用户机型筛选
// ==============================================

let isLoginMode = true
let isAdmin = false                  // 当前用户是否为管理员
const ADMIN_EMAIL = '3678163357@qq.com'  // 管理员邮箱（也可在 admins 表里判断）

// 暴露到全局，方便外部读取（测试/调试用）
Object.defineProperty(window, 'isAdmin', { get: () => isAdmin })

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
  client.auth.getUser().then(({ data }) => {
    const uid = data?.user?.id
    if (!uid) return
    client.from('user_settings').select('user_id').eq('user_id', uid).single().then(({ data: row }) => {
      if (!row) {
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
// 页面加载完成后：监听登录状态 + 加载配置
// ==============================================
if (typeof document !== 'undefined' && document.addEventListener) {
document.addEventListener('DOMContentLoaded', () => {
  const client = window.supabaseClient
  if (!client) {
    console.error('[auth.js] window.supabaseClient 不存在，检查 config.js')
    return
  }

  client.auth.getUser().then(({ data }) => applyAuthState(!!data?.user))
  client.auth.onAuthStateChange((event, session) => applyAuthState(!!session?.user))
})
} // end: DOMContentLoaded guard

// 根据登录状态显示 / 隐藏内容
function applyAuthState(isLoggedIn) {
  const overlay   = document.getElementById('login-overlay')
  const app       = document.getElementById('app-content')
  const topbar    = document.getElementById('topbar')
  if (isLoggedIn) {
    if (overlay) overlay.style.display = 'none'
    if (app)     app.style.display     = 'block'
    if (topbar)  topbar.style.display  = 'flex'
    updateAvatar()
    checkAdmin().then(() => {
      loadUserSettings()
      checkDailyAnnounce()
      loadFlightData()
      subscribeFlightUpdates()
    })
  } else {
    if (overlay) overlay.style.display = 'flex'
    if (app)     app.style.display     = 'none'
    if (topbar)  topbar.style.display  = 'none'
    closeProfile()
    closeAnnounceEditor()
    closeDailyAnnounce()
    isAdmin = false
    const adminBtn = document.getElementById('admin-announce-btn')
    if (adminBtn) adminBtn.style.display = 'none'
  }
}

// 头像：简笔人图标 + title 显示邮箱
function updateAvatar() {
  const client = window.supabaseClient
  const btn = document.getElementById('userAvatarBtn')
  if (!btn) return
  if (!client) { btn.title = '个人中心'; return }
  client.auth.getUser().then(({ data }) => {
    const email = data?.user?.email || ''
    btn.title = email ? '个人中心 · ' + email : '个人中心'
  })
}

// ==============================================
// 管理员判断
// ==============================================
async function checkAdmin() {
  const client = window.supabaseClient
  if (!client) return false
  const { data: userData } = await client.auth.getUser()
  const uid = userData?.user?.id
  const email = userData?.user?.email || ''
  if (!uid) return false

  window.__currentUserId = uid

  // 方式1：优先看 admins 表；方式2：邮箱白名单兜底
  const { data } = await client
    .from('admins')
    .select('user_id')
    .eq('user_id', uid)
    .single()

  isAdmin = !!(data || email === ADMIN_EMAIL)

  // 管理员才显示公告编辑按钮 + 同步按钮
  const adminBtn = document.getElementById('admin-announce-btn')
  if (adminBtn) adminBtn.style.display = isAdmin ? 'inline-block' : 'none'

  // 管理员显示"同步给所有用户"按钮；普通用户不显示
  const syncBtn = document.getElementById('sync-btn')
  if (syncBtn) syncBtn.style.display = isAdmin ? 'inline-flex' : 'none'

  console.log('[auth.js] 当前用户:', email, isAdmin ? '👑 管理员' : '普通用户')
  return isAdmin
}

// ==============================================
// 机型配置：加载 / 保存 / 勾选
// ==============================================
let currentTypes = []

function loadUserSettings() {
  const client = window.supabaseClient
  if (!client) return

  client.auth.getUser().then(({ data }) => {
    const uid = data?.user?.id
    if (!uid) return
    window.__currentUserId = uid

    const defaults = (window.DEFAULT_AIRCRAFT_TYPES || []).map(s => s.toUpperCase())

    client.from('user_settings')
      .select('aircraft_types')
      .eq('user_id', uid)
      .single()
      .then(({ data: row, error }) => {
        if (error && error.code !== 'PGRST116') {
          console.error('[loadUserSettings]', error)
          currentTypes = defaults
          applyTypesToApp(defaults)
          renderTypeCheckboxes()
          return
        }
        if (!row) {
          client.from('user_settings')
            .insert({ user_id: uid, aircraft_types: defaults })
            .then(() => { currentTypes = defaults; applyTypesToApp(defaults); renderTypeCheckboxes() })
          return
        }
        const types = (row.aircraft_types || []).map(s => s.toUpperCase())
        currentTypes = types
        applyTypesToApp(types)
        renderTypeCheckboxes()
      })
  })
}

function applyTypesToApp(types) {
  window.userAircraftTypes = types
  if (typeof window.processData === 'function') window.processData()
}

function toggleSettings() {
  const panel = document.getElementById('settingsPanel')
  if (!panel) return false
  const opening = !panel.classList.contains('open')
  panel.classList.toggle('open')
  if (opening) renderTypeCheckboxes()
  return false
}

function renderTypeCheckboxes() {
  const box = document.getElementById('typeCheckboxes')
  if (!box) return
  const all = (window.DEFAULT_AIRCRAFT_TYPES || []).map(s => s.toUpperCase())
  box.innerHTML = ''
  all.forEach(t => {
    const label = document.createElement('label')
    label.className = 'type-checkbox'
    const checked = currentTypes.includes(t) ? 'checked' : ''
    label.innerHTML = `<input type="checkbox" value="${t}" ${checked} onchange="onTypeCheckChange('${t}', this.checked)">${t}`
    box.appendChild(label)
  })
}

function onTypeCheckChange(type, checked) {
  if (checked) { if (!currentTypes.includes(type)) currentTypes.push(type) }
  else          { currentTypes = currentTypes.filter(t => t !== type) }
}

function selectAllTypes() {
  currentTypes = (window.DEFAULT_AIRCRAFT_TYPES || []).map(s => s.toUpperCase())
  renderTypeCheckboxes()
  setSettingsStatus('已全选，点"保存并应用"生效')
  return false
}

function selectNoneTypes() {
  currentTypes = []
  renderTypeCheckboxes()
  setSettingsStatus('已清空，点"保存并应用"生效（将输出全部机型）')
  return false
}

function saveSelectedTypes() {
  currentTypes = Array.from(new Set(currentTypes.map(s => s.toUpperCase())))
  saveUserSettings(() => {
    applyTypesToApp(currentTypes)
    setSettingsStatus(currentTypes.length
      ? `✅ 已保存：只输出 ${currentTypes.length} 个机型，下次登录自动加载`
      : '✅ 已保存：未勾选任何机型，将输出全部机型')
  })
  return false
}

function saveUserSettings(done) {
  const client = window.supabaseClient
  if (!client) { setSettingsStatus('保存失败：客户端未初始化', 'error'); return }
  const uid = window.__currentUserId
  if (!uid) { setSettingsStatus('保存失败：未登录', 'error'); return }

  client.from('user_settings')
    .upsert({ user_id: uid, aircraft_types: currentTypes })
    .then(({ error }) => {
      if (error) { console.error(error); setSettingsStatus('保存失败：' + error.message, 'error') }
      else       { if (typeof done === 'function') done() }
    })
}

function setSettingsStatus(text, type) {
  const el = document.getElementById('settingsStatus')
  if (el) {
    el.textContent = text
    el.className = 'settings-status' + (type ? ' ' + type : '')
  }
}

// ==============================================
// 公告：每日首次弹窗
// ==============================================
const ANNOUNCE_KEY = 'drainage_announce_date'

async function checkDailyAnnounce() {
  const client = window.supabaseClient
  if (!client) return

  const today = new Date().toLocaleDateString('zh-CN')
  if (localStorage.getItem(ANNOUNCE_KEY) === today) return

  const { data } = await client
    .from('site_announcement')
    .select('content')
    .eq('id', 1)
    .single()

  const text = (data && data.content) || ''
  if (text.trim()) {
    showDailyAnnounce(text)
    localStorage.setItem(ANNOUNCE_KEY, today)
  }
}

function showDailyAnnounce(text) {
  const el = document.getElementById('daily-announce')
  const content = document.getElementById('daily-announce-text')
  if (el && content) { content.textContent = text; el.style.display = 'flex' }
}
function closeDailyAnnounce() {
  const el = document.getElementById('daily-announce')
  if (el) el.style.display = 'none'
  return false
}

// ==============================================
// 公告：管理员编辑窗口
// ==============================================
function openAnnounceEditor() {
  const el = document.getElementById('announce-editor')
  if (!el) return false
  el.style.display = 'flex'
  const client = window.supabaseClient
  if (!client) return false
  client.from('site_announcement').select('content').eq('id', 1).single()
    .then(({ data }) => {
      const input = document.getElementById('announce-input')
      if (input) input.value = (data && data.content) || ''
    })
  return false
}

function closeAnnounceEditor() {
  const el = document.getElementById('announce-editor')
  if (el) el.style.display = 'none'
  return false
}

async function saveAnnouncement() {
  const client = window.supabaseClient
  if (!client) { alert('客户端未初始化'); return false }
  if (!isAdmin) { alert('仅管理员可修改公告'); return false }

  const text = document.getElementById('announce-input').value
  const { error } = await client
    .from('site_announcement')
    .update({ content: text, updated_at: 'now()' })
    .eq('id', 1)

  if (error) alert('保存失败：' + error.message)
  else { alert('✅ 公告已更新，全员即时生效！'); closeAnnounceEditor(); localStorage.removeItem(ANNOUNCE_KEY) }
  return false
}

// ==============================================
// 航班信息：管理员输入 → 全员实时同步
//            普通用户也可改（只影响自己本地）
// ==============================================
const FLIGHT_KEY = 'drainage_flight_local'

// 加载原始数据：
//   - 管理员：显示服务器版本（作为基准），可在框内编辑后点"同步"推送
//   - 普通用户：优先显示服务器同步版本；本地保存过则保留本地副本
async function loadFlightData() {
  const client = window.supabaseClient
  const display = document.getElementById('flight-info-display')
  if (!client || !display) return

  const { data } = await client
    .from('flight_data')
    .select('content')
    .eq('id', 1)
    .single()

  const serverContent = (data && data.content) || ''
  const localContent  = localStorage.getItem(FLIGHT_KEY) || ''

  if (isAdmin) {
    // 管理员：显示服务器版本作为基准，编辑后点同步才推送
    display.value = serverContent
    display.readOnly = false
  } else {
    // 普通用户：本地有保存过则显示本地副本，否则显示管理员同步的版本
    display.value = localContent.trim() ? localContent : serverContent
    display.readOnly = false
  }

  // 触发一次识别
  if (typeof window.processData === 'function') window.processData()

  // 绑定输入事件（只绑一次）
  if (!display._bind) {
    display._bind = true
    display.addEventListener('input', () => {
      if (typeof window.processData === 'function') window.processData()
    })
  }
}

// 管理员主动同步：把当前原始数据框的内容写入数据库 → 全员更新
// 普通用户看不到此按钮；只有管理员点击才推送
async function syncFlightData() {
  const client = window.supabaseClient
  if (!client) { setFlightStatus('客户端未初始化', 'error'); return false }
  if (!isAdmin) { setFlightStatus('仅管理员可同步', 'error'); return false }

  const display = document.getElementById('flight-info-display')
  const text = display ? display.value : ''

  setFlightStatus('正在同步...', 'info')

  const { error } = await client
    .from('flight_data')
    .update({ content: text, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) {
    setFlightStatus('同步失败：' + error.message, 'error')
  } else {
    // 管理员同步成功后，清掉本地覆盖，统一走服务器版本
    localStorage.removeItem(FLIGHT_KEY)
    setFlightStatus('✅ 已同步给所有用户！', 'success')
    if (typeof window.processData === 'function') window.processData()
  }
  return false
}

// 供 HTML 内联调用
window.syncFlightData = syncFlightData

// 保存原始数据到本地：
//   - 管理员：本地暂存（仍需点同步才推送）
//   - 普通用户：仅自己可见的副本
function saveFlightLocal() {
  const display = document.getElementById('flight-info-display')
  if (!display) return false
  const val = display.value
  localStorage.setItem(FLIGHT_KEY, val)

  if (isAdmin) {
    setFlightStatus('✅ 已暂存本地，点"同步给所有用户"才推送', 'info')
  } else {
    setFlightStatus('✅ 已保存到本地（仅自己可见）', 'success')
  }
  if (typeof window.processData === 'function') window.processData()
  return false
}

function setFlightStatus(text, type) {
  const el = document.getElementById('flight-status')
  if (el) { el.textContent = text; el.className = 'flight-status' + (type ? ' ' + type : '') }
}

// 实时监听：管理员点"同步给所有用户"后，全员自动更新原始数据框
// 普通用户若本地有自定义内容则保留，否则同步管理员版本
function subscribeFlightUpdates() {
  const client = window.supabaseClient
  if (!client || !client.channel) return

  client
    .channel('flight-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'flight_data' }, payload => {
      const newContent = payload?.new?.content
      if (typeof newContent !== 'string') return

      const display = document.getElementById('flight-info-display')
      if (!display) return

      // 管理员：直接更新自己框里的
      if (isAdmin) {
        display.value = newContent
        if (typeof window.processData === 'function') window.processData()
        return
      }

      // 普通用户：本地有保存过且内容不同 → 保留本地副本，仅提示
      const local = localStorage.getItem(FLIGHT_KEY) || ''
      if (local.trim() && local !== newContent) {
        setFlightStatus('管理员已更新原始数据，你的本地副本保持不变', 'info')
      } else {
        // 无本地副本 或 与服务器一致 → 同步管理员最新版本
        display.value = newContent
        localStorage.setItem(FLIGHT_KEY, newContent)
        setFlightStatus('🔄 已同步管理员最新原始数据', 'success')
        if (typeof window.processData === 'function') window.processData()
      }
    })
    .subscribe()
}

// ==============================================
// 个人中心
// ==============================================
function openProfile() {
  const overlay = document.getElementById('profileOverlay')
  const emailEl = document.getElementById('profileEmail')
  const msgEl   = document.getElementById('profileMsg')
  if (msgEl) msgEl.textContent = ''

  const client = window.supabaseClient
  if (client && emailEl) {
    client.auth.getUser().then(({ data }) => { emailEl.value = data?.user?.email || '' })
  }
  if (overlay) overlay.style.display = 'flex'
  return false
}

function closeProfile() {
  const overlay = document.getElementById('profileOverlay')
  if (overlay) overlay.style.display = 'none'
  return false
}

function updatePassword() {
  const input  = document.getElementById('profileNewPassword')
  const msgEl  = document.getElementById('profileMsg')
  const client = window.supabaseClient
  const pw = input.value

  if (!pw || pw.length < 6) { setProfileMsg('密码至少 6 位', 'error'); return false }
  if (!client)              { setProfileMsg('系统错误：客户端未初始化', 'error'); return false }

  client.auth.updateUser({ password: pw }).then(({ error }) => {
    if (error) { setProfileMsg(error.message, 'error') }
    else       { setProfileMsg('✅ 密码已更新，下次登录请使用新密码', 'success'); input.value = '' }
  })
  return false
}

function setProfileMsg(text, type) {
  const el = document.getElementById('profileMsg')
  if (el) { el.textContent = text; el.className = 'profile-msg' + (type ? ' ' + type : '') }
}

// ==============================================
// 关于作者：下拉菜单
// ==============================================
function toggleAuthorMenu() {
  const menu = document.getElementById('authorMenu')
  if (menu) menu.classList.toggle('open')
  return false
}
function closeAuthorMenu() {
  const menu = document.getElementById('authorMenu')
  if (menu) menu.classList.remove('open')
  return true
}
if (typeof document !== 'undefined' && document.addEventListener) {
document.addEventListener('click', (e) => {
  const menu = document.getElementById('authorMenu')
  const btn  = e.target.closest('.author-btn, .author-dropdown')
  if (menu && menu.classList.contains('open') && !btn) menu.classList.remove('open')
})
}
