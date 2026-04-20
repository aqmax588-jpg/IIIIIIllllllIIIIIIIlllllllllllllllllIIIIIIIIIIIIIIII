const express = require('express')
const cors = require('cors')
const axios = require('axios')
const https = require('https');

const app = express()

app.use(cors())

app.get('/', (req, res) => {
  res.send('Server running')
})

app.get('/user/:username', async (req, res) => {
  const username = req.params.username
  try {
    const { data } = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
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
// Render 保活链接（已去重 + 补充你给的）
// ============================
const urls = [
  "https://iiiiiilllllliiiiiiillllllllllllllllliiii.onrender.com",
  "https://wallet-project-30bq.onrender.com/",
  "https://wwwwwwwwwwwvvvvvvwwwwwwvvvvvwwwwvvww.onrender.com/",
  "https://wwwwwwwwwwwvvvvvvwwwwwwvvvvvwwwwvvww.onrender.com/admin.html",
  "https://tk-proxy-2026.onrender.com"
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
