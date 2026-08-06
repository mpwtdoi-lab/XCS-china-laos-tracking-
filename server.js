const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// ให้บริการ Static Files จากโฟลเดอร์ปัจจุบัน
app.use(express.static(__dirname));

// หน้าแรก ให้ส่ง test.html
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'test.html'));
});

// API Proxy ดึงข้อมูลพัสดุ
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;
    try {
        const response = await axios.get(`https://www.hl-express.cn/api/track/${waybillNo}`, {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('API Fetch Error:', error.message);
        res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลจากระบบจีนได้' });
    }
});

// ให้ Render เป็นคนกำหนด Port เอง
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});