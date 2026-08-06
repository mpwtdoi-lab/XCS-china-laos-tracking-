const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// เปิดใช้งาน CORS และ JSON Parser
app.use(cors());
app.use(express.json());

// เสิร์ฟ static files ทั้งหมดในโฟลเดอร์หลัก
app.use(express.static(__dirname));

// หน้าแรก (/) : ตรวจสอบว่ามีไฟล์ test.html ไหม ป้องกัน Server ตก
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'test.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send('Server is running successfully! (test.html is missing)');
    }
});

// API Proxy สำหรับดึงข้อมูลการติดตามพัสดุ
app.get('/api/track/:waybillNo', async (req, res) => {
    try {
        const { waybillNo } = req.params;
        const response = await axios.get(`https://www.hl-express.cn/api/track/${waybillNo}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('API Fetch Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch tracking data from external API' });
    }
});

// กำหนด Port จาก Environment Variable ของ Render (ถ้าไม่มีจะใช้ 3000)
// เปลี่ยนบรรทัดนี้ใน server.js
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
