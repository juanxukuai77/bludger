// =============================================
//  修改下面两行，换成你自己的 Supabase 信息
//  Project Settings → API 里可以找到
// =============================================

const SUPABASE_URL      = https://icymqoltdthmdmjlszuu.supabase.co/rest/v1/   // ← 改成你的 Project URL
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeW1xb2x0ZHRobWRtamxzenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY3NDIsImV4cCI6MjEwNDc4Mjc0Mn0.YYIOwzhaaNVNXlsGuBRo-pqEOXzjumjBXLygv7VOI-k          // ← 改成你的 anon public key

// =============================================
//  创建 Supabase 客户端（不用改）
// =============================================
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
