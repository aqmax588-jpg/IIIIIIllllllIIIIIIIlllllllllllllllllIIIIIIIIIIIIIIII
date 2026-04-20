const express = require('express')
const cors = require('cors')
const axios = require('axios')
const https = require('https');
const path = require('path');

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// TikTok 真实数据接口
app.get('/user/:username', async (req, res) => {
  const username = req.params.username
  try {
    const { data } = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    })

    const avatarMatch = data.match(/"avatarThumbURL":"(.*?)"/)
    const followersMatch = data.match(/"followerCount":(\d+)/)
    const followingMatch = data.match(/"followingCount":(\d+)/)
    const videosMatch = data.match(/"videoCount":(\d+)/)

    res.json({
      success: true,
      avatar: avatarMatch ? avatarMatch[1].replace(/\\u002F/g,'/') : '',
      followers: followersMatch ? Number(followersMatch[1]) : 0,
      following: followingMatch ? Number(followingMatch[1]) : 0,
      videos: videosMatch ? Number(videosMatch[1]) : 0
    })
  } catch (e) {
    console.error('获取数据失败:', e.message)
    res.json({ success: false })
  }
})

// ======================
// 浏览器锁定（账号绑定浏览器）
// ======================
const userBrowserBind = {}

app.post('/api/login', (req, res) => {
  const { username, password, fingerprint } = req.body;

  if (!username || !password || !fingerprint) {
    return res.json({ ok: false, msg: '参数不完整' });
  }

  if (!userBrowserBind[username]) {
    userBrowserBind[username] = { browser: fingerprint };
    return res.json({ ok: true, token: 'logged' });
  }

  if (userBrowserBind[username].browser !== fingerprint) {
    return res.json({ ok: false, msg: '只能在首次登录的浏览器使用' });
  }

  res.json({ ok: true, token: 'logged' });
})

// 管理员解锁浏览器
app.post('/api/admin/unlock-browser', (req, res) => {
  const { username } = req.body;
  if (userBrowserBind[username]) {
    userBrowserBind[username].browser = null;
  }
  res.json({ ok: true });
})

// ======================
// 保活链接（你原来的 3 个我都补上了）
// ======================
const urls = [
  "https://iiiiiilllllliiiiiiillllllllllllllllliiii.onrender.com",
  "https://wallet-project-30bq.onrender.com/",
  "https://wwwwwwwwwwwvvvvvvwwwwwwvvvvvwwwwvvww.onrender.com//"
];

process.on('uncaughtException', (err) => {
  console.log('保活错误:', err.message);
});

console.log("✅ 保活已启动");

setInterval(() => {
  console.log("[保活] 正在请求...");
  urls.forEach(url => {
    https.get(url, (res) => {
      console.log("[保活成功] " + url + " → " + res.statusCode);
    }).on('error', (err) => {
      console.log("[保活失败] " + url);
    });
  });
}, 10 * 60 * 1000);

// ======================
// 管理员相关接口（你原有逻辑）
// ======================
let users = [];
let adminPassword = "admin";

app.post('/api/admin/login', (req, res) => {
  const { pwd } = req.body;
  res.json({ ok: pwd === adminPassword });
})

app.get('/api/admin/list', (req, res) => {
  res.json(users);
})

app.post('/api/admin/batch', (req, res) => {
  const { lines } = req.body;
  let count = 0;
  lines.split('\n').forEach(line => {
    let [user, pwd] = line.trim().split(/\s+/);
    if (user && pwd) {
      users.push({
        username: user,
        password: pwd,
        enabled: true,
        createdAt: new Date()
      });
      count++;
    }
  })
  res.json({ success: count });
})

app.post('/api/admin/set-expire', (req, res) => {
  res.json({ ok: true });
})

app.post('/api/admin/toggle', (req, res) => {
  const { username, enabled } = req.body;
  let u = users.find(x => x.username === username);
  if (u) u.enabled = enabled;
  res.json({ ok: true });
})

app.post('/api/admin/delete', (req, res) => {
  const { username } = req.body;
  users = users.filter(x => x.username !== username);
  res.json({ ok: true });
})

app.post('/api/check', (req, res) => {
  const { username } = req.body;
  let u = users.find(x => x.username === username);
  res.json({ ok: u && u.enabled });
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('服务已启动:', PORT))
