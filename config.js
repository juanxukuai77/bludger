const SUPABASE_URL = 'https://icymqoltdthmdmjlszuu.supabase.co' 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeW1xb2x0ZHRobWRtamxzenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY3NDIsImV4cCI6MjEwNDc4Mjc0Mn0.YYIOwzhaaNVNXlsGuBRo-pqEOXzjumjBXLygv7VOI-k'

// 改个名，比如 supabaseClient，避免和 CDN 自带的 window.supabase 冲突
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 挂到全局，供 auth.js 使用
window.supabaseClient = supabaseClient
