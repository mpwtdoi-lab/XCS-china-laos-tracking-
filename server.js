const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

// อนุญาตให้ยิง Cross-Origin ได้
app.use(cors());
app.use(express.json());

// 1. ให้บริการหน้าเว็บหลัก (test.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'), (err) => {
        if (err) {
            console.error('ไม่พบไฟล์ test.html:', err);
            res.status(500).send('Error: test.html not found on server');
        }
    });
});

// 2. API Proxy ดึงข้อมูลพัสดุจากจีน (ป้องกันเว็บพังและติด CORS)
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;
    
    try {
        // ดึงข้อมูลจาก API จีน
        const response = await axios.get(`https://www.hl-express.cn/api/track/${waybillNo}`, {
            timeout: 10000, // ตั้งเวลาหมดอายุ 10 วินาที
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error.message);
        // หากส่งผ่าน API ไม่ได้ จะส่ง Error กลับไปให้ Frontend จัดการโดยไม่ทำให้ Server Crash
        res.status(502).json({ 
            success: false, 
            message: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບຈີນໄດ້ (ไม่สามารถเชื่อมต่อระบบจีนได้)',
            error: error.message 
        });
    }
});

// 3. กำหนด Port ให้ Render ดึงไปใช้โดยอัตโนมัติ
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(` Server ready on port ${PORT}`);
});