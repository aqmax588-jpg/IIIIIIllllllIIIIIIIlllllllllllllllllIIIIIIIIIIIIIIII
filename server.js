const express = require('express')
const cors = require('cors')
const axios = require('axios')
const https = require('https');

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server running')
})

// 原版 TikTok 数据接口（完全不动）
app.get('/user/:username', async (req, res) => {
  const username = req.params.username
  try {
    const { data } = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const avatar = (data.match(/"avatarThumbURL":"(.*?)"/)?.[1] || '').replace(/\\u002F/g,'/')
    const followers = data.match(/"followerCount":(\d+)/)?.[1] || 0
    const following = data.match(/"followingCount":(\d+)/)?.[1] || 0
    const videos = data.match(/"videoCount":(\d+)/)?.[1] || 0

    res.json({
      success: true,
      avatar,
      followers: Number(followers),
      following: Number(following),
      videos: Number(videos)
    })
  } catch (e) {
    res.json({ success: false })
  }
})

// ============================
// 浏览器锁定（最小侵入）
// ============================
const userBrowser = {}

app.post('/api/login', (req, res) => {
  const { username, password, fingerprint } = req.body

  if (!username || !password) {
    return res.json({ ok: false, msg: 'Please enter username and password' })
  }

  // 第一次登录：绑定浏览器
  if (!userBrowser[username]) {
    userBrowser[username] = { browser: fingerprint }
    return res.json({ ok: true, token: 'logged' })
  }

  // 浏览器不匹配
  if (userBrowser[username].browser && userBrowser[username].browser !== fingerprint) {
    return res.json({ ok: false, msg: 'Only allowed on first login browser' })
  }

  res.json({ ok: true, token: 'logged' })
})

// 管理端解锁浏览器
app.post('/api/admin/unlock-browser', (req, res) => {
  const { username } = req.body
  if (userBrowser[username]) {
    userBrowser[username].browser = null
  }
  res.json({ ok: true })
})

// ============================
// 保活（原样）
// ============================
const urls = [
  "https://iiiiiilllllliiiiiiillllllllllllllllliiii.onrender.com",
  "https://wallet-project-30bq.onrender.com/"
];

process.on('uncaughtException', (err) => {
  console.log('保活过程中出现非致命错误:', err.message);
});

console.log("✅ 保活模块已加载，10分钟后将开始心跳...");

setInterval(() => {
  console.log("[保活] 开始心跳...");
  urls.forEach(url => {
    https.get(url, (res) => {
      console.log("[保活] " + url + " → " + res.statusCode);
    }).on('error', (err) => {
      console.log("[保活失败] " + url + " → " + err.message);
    });
  });
}, 10 * 60 * 1000);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Running on', PORT))
