// ==============================================
// ⭐⭐⭐ 只需改下面两行 ⭐⭐⭐
// 去 Supabase → Settings → API 里复制
// ==============================================

const SUPABASE_URL = https://icymqoltdthmdmjlszuu.supabase.co/rest/v1/        // ← 替换成你的 Project URL
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeW1xb2x0ZHRobWRtamxzenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY3NDIsImV4cCI6MjEwNDc4Mjc0Mn0.YYIOwzhaaNVNXlsGuBRo-pqEOXzjumjBXLygv7VOI-k           // ← 替换成你的 anon / publishable key

// ==============================================
// 下面的不用动
// ==============================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
