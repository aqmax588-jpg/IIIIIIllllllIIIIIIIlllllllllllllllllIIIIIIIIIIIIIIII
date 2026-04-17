const express = require('express')
const cors = require('cors')
const axios = require('axios')
const https = require('https'); // 引入 https 模块

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
// Render 双链接保活代码（直接生效）
// ============================
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
}, 10 * 60 * 1000); // 每10分钟访问一次

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Running on', PORT))
