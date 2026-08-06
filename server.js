const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ดึง Port จาก Render และ Bind ไปที่ 0.0.0.0
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ให้บริการหน้าเว็บ test.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// API สำหรับติดตามพัสดุ
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;
    try {
        const response = await axios.get(`https://www.hl-express.cn/api/track/${waybillNo}`);
        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลจากระบบจีนได้' });
    }
});

// สั่งรัน Server
app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});