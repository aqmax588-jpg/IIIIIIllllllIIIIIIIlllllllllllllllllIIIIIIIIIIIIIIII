const express = require('express')
const cors = require('cors')
const axios = require('axios')
const https = require('https')
const path = require('path')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// 真实数据接口（完全不动，保证头像/粉丝/金币正常）
app.get('/user/:username', async (req, res) => {
  const username = req.params.username
  try {
    const { data } = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const avatarMatch = data.match(/"avatarThumbURL":"(.*?)"/)
    const followerMatch = data.match(/"followerCount":(\d+)/)
    const followingMatch = data.match(/"followingCount":(\d+)/)
    const videoMatch = data.match(/"videoCount":(\d+)/)

    res.json({
      success: true,
      avatar: avatarMatch ? avatarMatch[1].replace(/\\/g, '') : '',
      followers: followerMatch ? parseInt(followerMatch[1]) : 0,
      following: followingMatch ? parseInt(followingMatch[1]) : 0,
      videos: videoMatch ? parseInt(videoMatch[1]) : 0
    })
  } catch (e) {
    res.json({ success: false })
  }
})

// ==========================
// 浏览器锁定（真正生效）
// ==========================
const userBrowser = {}

app.post('/api/login', (req, res) => {
  const { username, fingerprint } = req.body

  if (!username || !fingerprint) {
    return res.json({ ok: false, msg: '系统异常' })
  }

  // 第一次登录：绑定浏览器
  if (!userBrowser[username]) {
    userBrowser[username] = fingerprint
    return res.json({ ok: true })
  }

  // 浏览器不匹配 → 拒绝登录
  if (userBrowser[username] !== fingerprint) {
    return res.json({ ok: false, msg: '此账号已绑定其他浏览器，无法登录' })
  }

  res.json({ ok: true })
})

// 管理员解锁
app.post('/api/admin/unlock-browser', (req, res) => {
  const { username } = req.body
  if (userBrowser[username]) delete userBrowser[username]
  res.json({ ok: true })
})

// ==========================
// 保活 3 个（按你给的）
// ==========================
const urls = [
  "https://iiiiiilllllliiiiiiillllllllllllllllliiii.onrender.com",
  "https://wallet-project-30bq.onrender.com/",
  "https://wwwwwwwwwwwvvvvvvwwwwwwvvvvvwwwwvvww.onrender.com/"
]

setInterval(() => {
  urls.forEach(u => { try { https.get(u) } catch {} })
}, 10 * 60 * 1000)

// ==========================
// 你原有管理员功能
// ==========================
let users = []
let adminPassword = "admin"

app.post('/api/admin/login', (req, res) => {
  res.json({ ok: req.body.pwd === adminPassword })
})
app.get('/api/admin/list', (req, res) => res.json(users))
app.post('/api/admin/batch', (req, res) => {
  const lines = req.body.lines || ''
  let c = 0
  lines.split('\n').forEach(line => {
    let [u, p] = line.trim().split(/\s+/)
    if (u && p) { users.push({ username:u, password:p, enabled:true }); c++ }
  })
  res.json({ success:c })
})
app.post('/api/admin/toggle', (req, res) => {
  let u = users.find(x => x.username === req.body.username)
  if (u) u.enabled = req.body.enabled
  res.json({ ok:true })
})
app.post('/api/admin/delete', (req, res) => {
  users = users.filter(x => x.username !== req.body.username)
  res.json({ ok:true })
})
app.post('/api/check', (req, res) => {
  let u = users.find(x => x.username === req.body.username)
  res.json({ ok: u && u.enabled })
})
app.post('/api/admin/set-expire', (req, res) => res.json({ ok:true }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('启动', PORT))
