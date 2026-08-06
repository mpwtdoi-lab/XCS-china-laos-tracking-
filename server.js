const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// เสิร์ฟ static files ทุกตัวในโฟลเดอร์
app.use(express.static(__dirname));

// หน้าแรก Check ว่ามี test.html ไหม ป้องกัน Crash
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'test.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send('Server is running! (test.html not found in root)');
    }
});

// API Proxy
app.get('/api/track/:waybillNo', async (req, res) => {
    try {
        const { waybillNo } = req.params;
        const response = await axios.get(`https://www.hl-express.cn/api/track/${waybillNo}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch tracking data' });
    }
});

// กำหนด Port และ Bind กับ 0.0.0.0 อย่างถูกต้องสำหรับ Render
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
