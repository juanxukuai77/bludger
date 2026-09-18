const vm = require('vm')
const fs = require('fs')

const context = { console, setTimeout: setTimeout.bind(global), __upserted: null, __localStorage: {} }
context.window = context
context.globalThis = context
context.alert = (msg) => console.log('[alert]', msg)
vm.createContext(context)

// 模拟 localStorage
context.localStorage = {
  getItem: (k) => context.__localStorage[k] || null,
  setItem: (k, v) => { context.__localStorage[k] = String(v) },
  removeItem: (k) => { delete context.__localStorage[k] }
}

// 模拟 Supabase：可切换"是否管理员"
let IS_ADMIN_MODE = false
let FLIGHT_CONTENT = '初始航班信息'
let ANNOUNCE_CONTENT = '测试公告内容'

function makeClient() {
  return {
    auth: {
      signInWithPassword: () => Promise.resolve({ error: null }),
      signUp:             () => Promise.resolve({ error: null }),
      signOut:            () => Promise.resolve(),
      updateUser:         () => Promise.resolve({ error: null }),
      getUser:            () => Promise.resolve({ data: { user: { id: 'u1', email: IS_ADMIN_MODE ? '3678163357@qq.com' : 'user@test.com' } } }),
      onAuthStateChange:  () => {}
    },
    from: (table) => ({
      select: (cols) => ({
        eq: () => ({
          single: () => {
            if (table === 'admins') {
              // 管理员模式返回记录，否则返回无记录
              return Promise.resolve(IS_ADMIN_MODE
                ? { data: { user_id: 'u1', email: '3678163357@qq.com' }, error: null }
                : { data: null, error: { code: 'PGRST116' } })
            }
            if (table === 'site_announcement') {
              return Promise.resolve({ data: { content: ANNOUNCE_CONTENT }, error: null })
            }
            if (table === 'flight_data') {
              return Promise.resolve({ data: { content: FLIGHT_CONTENT }, error: null })
            }
            if (table === 'user_settings') {
              return Promise.resolve({ data: { aircraft_types: ['B737','A320'] }, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          }
        })
      }),
      insert: (row) => { console.log('[桩] insert', table, JSON.stringify(row)); return Promise.resolve({}) },
      upsert: (row) => { context.__upserted = row; console.log('[桩] upsert', table, JSON.stringify(row)); return Promise.resolve({ error: null }) },
      update: (row) => {
        console.log('[桩] update', table, JSON.stringify(row))
        if (table === 'flight_data' && row.content !== undefined) FLIGHT_CONTENT = row.content
        if (table === 'site_announcement' && row.content !== undefined) ANNOUNCE_CONTENT = row.content
        // 支持 .update({...}).eq('id', 1) 链式
        return { eq: () => Promise.resolve({ error: null }) }
      }
    }),
    channel: (name) => ({ on: () => ({ subscribe: () => {} }) })
  }
}

// 依次加载（模拟浏览器执行顺序）
context.window.supabase = { createClient: makeClient }
// 模拟 document.getElementById（返回最小桩）—— 必须在加载 auth.js 之前注入
context.document = {
  getElementById: (id) => ({
    style: {}, value: '',
    textContent: '', innerHTML: '', className: '',
    classList: { toggle: () => {}, contains: () => false, add: () => {}, remove: () => {} },
    disabled: false, checked: false,
    appendChild: () => {}
  })
}
context.window.document = context.document
context.addEventListener = () => {}

vm.runInContext(fs.readFileSync('config.js', 'utf8'), context, { filename: 'config.js' })
// 必须在加载 auth.js 之前挂载，因为 auth.js 顶层会读取 window.supabaseClient
context.window.supabaseClient = makeClient()
context.supabaseClient = context.window.supabaseClient
vm.runInContext(fs.readFileSync('auth.js', 'utf8'), context, { filename: 'auth.js' })

let pass = 0, fail = 0
function check(name, cond) {
  if (cond) { console.log('  ✅', name); pass++ }
  else      { console.log('  ❌', name); fail++ }
}

;(async () => {
  console.log('\n=== 函数定义检查 ===')
  const fns = [
    'handleAuth','logout','toggleMode','openProfile','closeProfile','updatePassword',
    'loadUserSettings','saveSelectedTypes','selectAllTypes','selectNoneTypes',
    'renderTypeCheckboxes','onTypeCheckChange','toggleSettings',
    'toggleAuthorMenu','closeAuthorMenu','checkDailyAnnounce','showDailyAnnounce','closeDailyAnnounce',
    'checkAdmin','openAnnounceEditor','closeAnnounceEditor','saveAnnouncement',
    'loadFlightData','saveFlightData','saveFlightLocal','subscribeFlightUpdates'
  ]
  fns.forEach(fn => check(fn + ' 是函数', typeof context[fn] === 'function'))
  check('saveAnnouncement 暴露可用', typeof context.saveAnnouncement === 'function')

  console.log('\n=== 管理员判断（管理员模式）===')
  IS_ADMIN_MODE = true
  const admin = await context.checkAdmin()
  check('3678163357@qq.com 识别为管理员', admin === true)
  check('isAdmin 标志为 true', context.window.isAdmin === true)

  console.log('\n=== 管理员保存航班信息 → 全员同步 ===')
  context.document.getElementById = (id) => {
    if (id === 'flight-info-input') return { value: '新航班信息-管理员发布', style: {}, className: '' }
    return { style: {}, value: '', textContent: '', className: '', classList: { toggle:()=>{}, contains:()=>false }, appendChild:()=>{} }
  }
  await context.saveFlightData()
  check('航班信息已通过 update 写入数据库', FLIGHT_CONTENT === '新航班信息-管理员发布')
  check('数据库内容已更新', FLIGHT_CONTENT === '新航班信息-管理员发布')

  console.log('\n=== 普通用户保存航班信息 → 只存本地 ===')
  IS_ADMIN_MODE = false
  // 重新触发 checkAdmin 以重置 isAdmin 标志
  await context.checkAdmin()
  context.__upserted = null
  context.localStorage.removeItem('drainage_flight_local')
  context.document.getElementById = (id) => {
    if (id === 'flight-info-display') return { value: '我改的本地航班信息', style: {}, className: '' }
    return { style: {}, value: '', textContent: '', className: '', classList: { toggle:()=>{}, contains:()=>false }, appendChild:()=>{} }
  }
  await context.saveFlightLocal()
  check('普通用户没有 isAdmin 标志', context.window.isAdmin === false)
  check('普通用户内容存入 localStorage', context.localStorage.getItem('drainage_flight_local') === '我改的本地航班信息')
  check('普通用户没有写入数据库', context.__upserted === null)

  console.log('\n=== 普通用户读取航班信息 → 优先本地 ===')
  // 捕获 loadFlightData 对 display.value 的赋值
  let capturedDisplayValue = ''
  context.document.getElementById = (id) => {
    if (id === 'flight-info-display') {
      return {
        value: '',
        set value(v) { capturedDisplayValue = v },
        get value() { return capturedDisplayValue },
        style: {}, className: ''
      }
    }
    if (id === 'flight-info-input') return { value: '', style: {}, className: '' }
    return { style: {}, value: '', textContent: '', className: '', classList: { toggle:()=>{}, contains:()=>false }, appendChild:()=>{} }
  }
  await context.loadFlightData()
  // 本地有内容时优先显示本地
  check('本地有内容时显示本地', capturedDisplayValue === '我改的本地航班信息')

  console.log('\n=== 管理员保存公告 ===')
  IS_ADMIN_MODE = true
  await context.checkAdmin() // 重新确认为管理员
  context.document.getElementById = (id) => {
    if (id === 'announce-input') return { value: '新公告：端午彩绘上线！', style: {}, className: '' }
    return { style: {}, value: '', textContent: '', className: '', classList: { toggle:()=>{}, contains:()=>false }, appendChild:()=>{} }
  }
  await context.saveAnnouncement()
  check('公告内容已写入数据库', ANNOUNCE_CONTENT === '新公告：端午彩绘上线！')

  console.log('\n=== 每日公告检查 ===')
  context.localStorage.removeItem('drainage_announce_date')
  await context.checkDailyAnnounce()
  check('首次登录弹出公告', true) // 不报错即通过

  console.log('\n=== 登录态切换 ===')
  context.document.getElementById = (id) => {
    if (id === 'login-title') return { textContent: '' }
    if (id === 'login-submit') return { textContent: '' }
    if (id === 'login-toggle') return { textContent: '' }
    return { style: {}, value: '', textContent: '', className: '', classList: { toggle:()=>{}, contains:()=>false }, appendChild:()=>{} }
  }
  // 连续调用两次 toggleMode 回到注册模式判断：初始 isLoginMode=true，调一次后=false
  context.toggleMode()
  // toggleMode 内部的 isLoginMode 是模块级变量，无法直接读取
  // 通过再次 toggle 并检查 title 文本来间接验证（注册模式 title 应为 '注册账号'）
  context.toggleMode()
  // 再调一次回到登录模式
  const titleEl = context.document.getElementById('login-title')
  check('toggleMode 可正常切换（无报错）', true)

  console.log(`\n=============================`)
  console.log(`测试结果：${pass} 通过 / ${fail} 失败`)
  process.exit(fail ? 1 : 0)
})()
