const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Middleware Configuration
app.use(cors()); // เปิดรับการเชื่อมต่อแบบ Cross-Origin (ป้องกันติด CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ให้บริการไฟล์ Static (เช่น test.html, css, js)
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// 2. Base API Target Config (ระบบติดตามพัสดุ HL Express)
const TARGET_API_URL = 'http://www.hl-express.cn';

// 3. API Route สำหรับเช็คพัสดุ
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;

    if (!waybillNo) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาระบุหมายเลขพัสดุ'
        });
    }

    console.log(`[${new Date().toISOString()}] Fetching tracking info for: ${waybillNo}`);

    try {
        // ยิง Request ไปยัง HL Express โดยจำลอง Browser Header เพื่อป้องกันการถูกปฏิเสธ
        const response = await axios.get(`${TARGET_API_URL}/track/index/doccode/${waybillNo}.html`, {
            timeout: 15000, // Timeout 15 วินาที
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive'
            }
        });

        // ส่งข้อมูล HTML หรือ Data ที่ดึงได้กลับไปที่ Frontend
        return res.json({
            success: true,
            waybillNo: waybillNo,
            data: response.data
        });

    } catch (error) {
        console.error(`[API Fetch Error]: ${error.message}`);

        if (error.code === 'ENOTFOUND') {
            return res.status(502).json({
                success: false,
                message: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ปลายทาง (${TARGET_API_URL}) ได้`,
                code: error.code
            });
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'การเชื่อมต่อกับ HL Express หมดเวลา (Timeout)',
                code: error.code
            });
        }

        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพัสดุ',
            error: error.message
        });
    }
});

// 4. Health Check Route (สำหรับ Render)
app.get('/health', (req, res) => {
    res.status(200).send('OK - Server is running normally');
});

// 5. Default Route
app.get('/', (req, res) => {
    const htmlFile = path.join(__dirname, 'test.html');
    res.sendFile(htmlFile, (err) => {
        if (err) {
            res.status(200).send('<h1>XCS China-Laos Tracking API Server is Live!</h1>');
        }
    });
});

// 6. Start Server
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`Target API: ${TARGET_API_URL}`);
    console.log(`=================================`);
});
