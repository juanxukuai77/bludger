// ==============================================
// config.js
// ⭐ 只需改【最下面两行】的引号里面的内容
// ==============================================

// 去 Supabase → Settings → API 复制
// ⚠️ URL 只要根域名，不要 /rest/v1/
//    ✅ https://xxxx.supabase.co
//    ❌ https://xxxx.supabase.co/rest/v1/
const SUPABASE_URL      = 'https://icymqoltdthmdmjlszuu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeW1xb2x0ZHRobWRtamxzenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY3NDIsImV4cCI6MjEwNDc4Mjc0Mn0.YYIOwzhaaNVNXlsGuBRo-pqEOXzjumjBXLygv7VOI-k'

// ==============================================
// 下面不用动
// Supabase CDN（@supabase/supabase-js@2）加载后会自动在全局创建
// window.supabase，所以我们用「新名字 sbClient」创建客户端，
// 再挂到 window.supabaseClient，供 auth.js 使用。
//
// ⚠️ 不能用 `const supabase = ...`，会和 CDN 的全局变量重名，
//    报 "Identifier 'supabase' has already been declared"。
// ==============================================
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
window.supabaseClient = sbClient
