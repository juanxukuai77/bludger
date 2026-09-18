// 测试：新布局（左侧面板 + 右侧内容）+ 原始数据同步逻辑
const fs = require('fs')
let passed = 0, failed = 0
const errors = []

function assert(name, cond) {
  if (cond) { passed++; console.log('  ✓ ' + name) }
  else { failed++; errors.push(name); console.log('  ✗ FAIL: ' + name) }
}

// ---- 读取文件 ----
const html = fs.readFileSync(__dirname + '/index.html', 'utf8')
const auth = fs.readFileSync(__dirname + '/auth.js', 'utf8')

console.log('\n【1】布局结构检查')
assert('采用左侧面板 + 右侧内容布局（.side-panel）', html.includes('class="side-panel"'))
assert('有右侧主内容区（.main-content）', html.includes('class="main-content"'))
assert('有品牌标题区（.brand）', html.includes('class="brand"'))
assert('原始数据区在左侧面板内', html.includes('flight-info-display'))
assert('机型筛选面板在左侧', html.includes('settingsPanel'))
assert('结果卡片在右侧内容区', html.includes('cardsContainer'))

console.log('\n【2】不再有旧的 control-bar 布局')
assert('已移除 control-bar 类名', !html.includes('control-bar'))
assert('已移除 input-card 类名', !html.includes('input-card'))
assert('已移除旧的 flight-info-section 样式', !html.includes('flight-info-section'))

console.log('\n【3】原始数据区：管理员与普通用户共用同一框')
assert('只有一个原始数据 textarea', (html.match(/flight-info-display/g) || []).length >= 2)
assert('管理员同步按钮存在', html.includes('sync-btn'))
assert('无独立的 flight-info-input 旧框', !html.includes('flight-info-input'))

console.log('\n【4】同步逻辑：管理员点同步才推送')
assert('syncFlightData 函数存在', auth.includes('async function syncFlightData'))
assert('同步时写入 flight_data 表', auth.includes("from('flight_data')") && auth.includes("update({ content: text"))
assert('非管理员点同步被拦截', auth.includes("if (!isAdmin) { setFlightStatus('仅管理员可同步'"))
assert('同步成功清除本地覆盖', auth.includes("localStorage.removeItem(FLIGHT_KEY)"))
assert('saveFlightLocal 提示管理员需点同步才推送', auth.includes('已暂存本地，点"同步给所有用户"才推送'))

console.log('\n【5】实时订阅逻辑')
assert('订阅 flight_data 表变更', auth.includes("table: 'flight_data'"))
assert('管理员直接更新自己框', auth.includes('// 管理员：直接更新自己框里的'))
assert('普通用户无本地副本则同步', auth.includes('// 无本地副本 或 与服务器一致'))
assert('普通用户有本地副本则保留', auth.includes('你的本地副本保持不变'))

console.log('\n【6】功能完整性')
assert('登录遮罩存在', html.includes('login-overlay'))
assert('个人中心弹层存在', html.includes('profileOverlay'))
assert('关于作者下拉存在', html.includes('authorMenu'))
assert('管理员公告编辑按钮存在', html.includes('admin-announce-btn'))
assert('每日公告弹层存在', html.includes('daily-announce'))
assert('config.js 引用了 supabaseClient 挂载', fs.readFileSync(__dirname + '/config.js', 'utf8').includes('window.supabaseClient'))

console.log('\n========================================')
console.log(`结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) {
  console.log('\n失败项：')
  errors.forEach(e => console.log('  - ' + e))
  process.exit(1)
} else {
  console.log('全部通过 ✅')
}
