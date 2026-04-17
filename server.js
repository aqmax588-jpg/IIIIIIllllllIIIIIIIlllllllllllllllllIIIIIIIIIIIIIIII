const express = require('express')
const cors = require('cors')
const axios = require('axios')
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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Running on', PORT))
// ============================
// Render 保活心跳 - 自动防休眠
// 每 10 分钟访问一次前端 + API
// 不影响登录、互踢、充值、查询任何功能
// ============================
const https = require('https');

const urls = [
  "https://iiiiiilllllliiiiiiillllllllllllllllliiii.onrender.com",
  "https://wallet-project-30bq.onrender.com/"
];

// 防止保活请求出错导致进程崩溃
process.on('uncaughtException', (err) => {
  console.log('保活过程中出现非致命错误:', err.message);
});

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
