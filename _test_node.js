// 测试：今日/明日切换 + 普通用户同步按钮 + 按日独立数据同步
const fs = require('fs')
let passed = 0, failed = 0
const errors = []

function assert(name, cond) {
  if (cond) { passed++; console.log('  ✓ ' + name) }
  else { failed++; errors.push(name); console.log('  ✗ FAIL: ' + name) }
}

const html = fs.readFileSync(__dirname + '/index.html', 'utf8')
const auth = fs.readFileSync(__dirname + '/auth.js', 'utf8')
const css  = fs.readFileSync(__dirname + '/style-auth.css', 'utf8')

console.log('\n【1】日期选择：今日 / 明日 Tab')
assert('有日期切换 Tab 容器（#dayTabs）', html.includes('id="dayTabs"'))
assert('有"今日"按钮', html.includes("data-day=\"today\"") && html.includes('🟢 今日'))
assert('有"明日"按钮', html.includes("data-day=\"tomorrow\"") && html.includes('🔵 明日'))
assert('移除旧的 date input', !html.includes("id=\"datePicker\""))
assert('移除旧的确认日期按钮', !html.includes("id=\"confirmDateBtn\""))
assert('切换日期调用 switchDay', html.includes("switchDay('today')") && html.includes("switchDay('tomorrow')"))
assert('有今日/明日 Tab 样式', html.includes('.day-tab'))

console.log('\n【2】原始数据区按钮分工')
assert('管理员"同步给所有用户"按钮（sync-btn）', html.includes('id="sync-btn"') && html.includes('同步给所有用户'))
assert('普通用户"同步管理员数据"按钮（pull-btn）', html.includes('id="pull-btn"') && html.includes('同步管理员数据'))
assert('管理员与普通用户共用同一原始数据框', (html.match(/flight-info-display/g) || []).length >= 2)

console.log('\n【3】按日独立数据：表结构含 today / tomorrow 两列')
assert('flight_data 读取 today 列', auth.includes("select('today, tomorrow')"))
assert('pickDayContent 按天取值', auth.includes('function pickDayContent'))
assert('切换日期加载对应天数据', auth.includes('function switchFlightDay') && auth.includes('loadFlightData(day)'))
assert('管理员同步只更新当前天这一列', auth.includes('updateObj[day] = text'))
assert('今日明日分别提示', auth.includes('今日数据已同步给所有用户') && auth.includes('明日数据已同步给所有用户'))

console.log('\n【4】普通用户主动拉取管理员数据')
assert('pullFlightData 函数存在', auth.includes('async function pullFlightData'))
assert('拉取时查询 flight_data', auth.includes("from('flight_data')") && auth.includes('.single()'))
assert('拉取后覆盖本地副本', auth.includes('localStorage.setItem(flightLocalKey(day), serverContent)'))
assert('管理员看不到拉取按钮（pull 对管理员提示）', auth.includes('你是管理员，直接编辑后点"同步给所有用户"即可'))

console.log('\n【5】本地缓存按天隔离')
assert('本地 key 带日期后缀', auth.includes("drainage_flight_local:' + day"))
assert('缓存键按天区分（today / tomorrow 各一份）', (auth.match(/flightLocalKey\(day\)/g) || []).length >= 5)

console.log('\n【6】按钮显隐逻辑')
assert('管理员显示 sync-btn / 隐藏 pull-btn', auth.includes("syncBtn.style.display  = isAdmin ? 'inline-flex' : 'none'"))
assert('普通用户显示 pull-btn / 隐藏 sync-btn', auth.includes("pullBtn.style.display  = isAdmin ? 'none' : 'inline-flex'"))
assert('登出时 pull-btn 默认显示', auth.includes("pullBtn)  pullBtn.style.display  = 'inline-flex'"))

console.log('\n【7】实时同步：只响应当前查看的日期')
assert('实时监听 flight_data 变更', auth.includes("table: 'flight_data'"))
assert('实时按天判断 newRow.today / newRow.tomorrow', auth.includes('newRow.today') && auth.includes('newRow.tomorrow'))
assert('只对当前日期做响应', auth.includes('// 只对“当前正在查看的那一天”做响应'))

console.log('\n【8】原有功能完整性（回归）')
assert('登录遮罩存在', html.includes('login-overlay'))
assert('个人中心弹层存在', html.includes('profileOverlay'))
assert('关于作者下拉存在', html.includes('authorMenu'))
assert('简笔人头像存在', html.includes('avatar-icon'))
assert('管理员公告编辑按钮存在', html.includes('admin-announce-btn'))
assert('每日公告弹层存在', html.includes('daily-announce'))
assert('机型筛选面板存在', html.includes('settingsPanel'))
assert('config.js 挂载 supabaseClient', fs.readFileSync(__dirname + '/config.js', 'utf8').includes('window.supabaseClient'))
assert('顶部栏 sticky 定位', html.includes('.topbar') && css.includes('position: sticky'))

console.log('\n========================================')
console.log(`结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) {
  console.log('\n失败项：')
  errors.forEach(e => console.log('  - ' + e))
  process.exit(1)
} else {
  console.log('全部通过 ✅')
}
