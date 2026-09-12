// ==========================================
// 只需改下面两行
// 去 Supabase → Settings → API 里复制
// ==========================================

const SUPABASE_URL = https://icymqoltdthmdmjlszuu.supabase.co/rest/v1/  // ← 注意：只要根网址，不要 /rest/v1/
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeW1xb2x0ZHRobWRtamxzenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY3NDIsImV4cCI6MjEwNDc4Mjc0Mn0.YYIOwzhaaNVNXlsGuBRo-pqEOXzjumjBXLygv7VOI-k

// ==========================================
// 下面的不用动
// ==========================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
window.supabaseClient = supabase // ← 关键：挂到全局，让 auth.js 能读到
