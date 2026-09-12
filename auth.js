// ==============================================
// 登录系统 - auth.js
// ==============================================

// 获取DOM元素（登录界面）
const loginOverlay = document.getElementById('login-overlay')
const appContent = document.getElementById('app-content')
const loginForm = document.getElementById('login-form')
const loginEmail = document.getElementById('login-email')
const loginPassword = document.getElementById('login-password')
const loginSubmitBtn = document.getElementById('login-submit')
const loginToggle = document.getElementById('login-toggle')
const loginTitle = document.getElementById('login-title')
const loginMessage = document.getElementById('login-message')

let isRegisterMode = false

// 切换 登录/注册 模式
loginToggle.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode
    loginTitle.textContent = isRegisterMode ? '注册账号' : '登录'
    loginSubmitBtn.textContent = isRegisterMode ? '注册' : '登录'
    loginToggle.textContent = isRegisterMode ? '已有账号？去登录' : '没有账号？去注册'
    loginMessage.textContent = ''
})

// 提交（登录 or 注册）
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = loginEmail.value.trim()
    const password = loginPassword.value

    if (!email || !password) {
        showLoginMessage('请输入邮箱和密码', 'error')
        return
    }

    if (password.length < 6) {
        showLoginMessage('密码至少6位', 'error')
        return
    }

    setLoading(true)

    try {
        if (isRegisterMode) {
            // 注册
            const { data, error } = await supabase.auth.signUp({ email, password })
            if (error) throw error
            showLoginMessage('注册成功！请检查邮箱验证（或直接登录）', 'success')
            // 自动切回登录模式
            setTimeout(() => {
                isRegisterMode = false
                loginTitle.textContent = '登录'
                loginSubmitBtn.textContent = '登录'
                loginToggle.textContent = '没有账号？去注册'
            }, 1500)
        } else {
            // 登录
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            // 成功 → onAuthStateChange 会自动处理页面切换
        }
    } catch (err) {
        showLoginMessage(err.message, 'error')
    } finally {
        setLoading(false)
    }
})

// 退出登录
function logout() {
    supabase.auth.signOut().then(() => {
        // 清空输入
        loginEmail.value = ''
        loginPassword.value = ''
    })
}

// 监听登录状态变化
supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        // 已登录 → 显示主应用，隐藏登录界面
        loginOverlay.style.display = 'none'
        appContent.style.display = 'block'
        // 触发原始应用的初始化
        if (window.initApp && event === 'SIGNED_IN') {
            // 首次登录时重新初始化
        }
    } else {
        // 未登录 → 显示登录界面，隐藏主应用
        loginOverlay.style.display = 'flex'
        appContent.style.display = 'none'
    }
})

// 页面加载时检查是否已有登录状态
window.addEventListener('load', async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session && session.user) {
        loginOverlay.style.display = 'none'
        appContent.style.display = 'block'
    } else {
        loginOverlay.style.display = 'flex'
        appContent.style.display = 'none'
    }
})

// ===== 工具函数 =====
function showLoginMessage(msg, type) {
    loginMessage.textContent = msg
    loginMessage.className = 'login-msg ' + (type || '')
}

function setLoading(loading) {
    loginSubmitBtn.disabled = loading
    loginSubmitBtn.textContent = loading
        ? (isRegisterMode ? '处理中...' : '登录中...')
        : (isRegisterMode ? '注册' : '登录')
}

// 把 logout 暴露给全局（给HTML的onclick用）
window.logout = logout
