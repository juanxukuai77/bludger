// ==============================================
// ⭐⭐⭐ 只需改下面两行 ⭐⭐⭐
// 去 Supabase → Settings → API 里复制
//
// ⚠️ 注意：URL 只要根域名，不要 /rest/v1/ 后缀
//    正确：https://xxxx.supabase.co
//    错误：https://xxxx.supabase.co/rest/v1/
// ==============================================

const SUPABASE_URL = 'https://icymqoltdthmdmjlszuu.supabase.co/rest/v1/'   // ← 替换成你的 Project URL（根域名，带引号）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeW1xb2x0ZHRobWRtamxzenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY3NDIsImV4cCI6MjEwNDc4Mjc0Mn0.YYIOwzhaaNVNXlsGuBRo-pqEOXzjumjBXLygv7VOI-k'      // ← 替换成你的 anon / publishable key（带引号）

// ==============================================
// 下面的不用动
// ==============================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ⭐ 关键：挂到 window 全局，这样 auth.js 才能用
window.supabase = supabase
