const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Middleware Configuration
app.use(cors()); // เปิดรับการเชื่อมต่อแบบ Cross-Origin (ไม่ติด CORS Block)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ให้บริการไฟล์ Static (เช่น test.html, css, js) จากโฟลเดอร์ root หรือ public
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// 2. Base API Target Config
// ⚠️ หมายเหตุ: โดเมน 'www.hl-express.cn' ยังค้นหา DNS ไม่พบ (ENOTFOUND)
// หากได้ URL/Domain หรือ IP ที่ถูกต้องแล้ว ให้เปลี่ยนตรงนี้ได้เลยครับ
const TARGET_API_URL = 'https://www.hl-express.cn';

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
        // ยิง Request ไปยัง API ต้นทาง
        const response = await axios.get(`${TARGET_API_URL}/api/track/${waybillNo}`, {
            timeout: 10000, // กำหนด Timeout 10 วินาที
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Connection': 'keep-alive'
            }
        });

        // ส่งข้อมูลจากต้นทางกลับไปให้ Frontend
        return res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error(`[API Fetch Error]: ${error.message}`);

        // จัดการ Error กรณีไม่พบ Domain (ENOTFOUND)
        if (error.code === 'ENOTFOUND') {
            return res.status(502).json({
                success: false,
                message: `ไม่พบโดเมนปลายทาง (${TARGET_API_URL}) กรุณาตรวจสอบ URL ใน server.js`,
                code: error.code
            });
        }

        // จัดการ Error กรณี Timeout
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'การเชื่อมต่อกับระบบต้นทางหมดเวลา (Timeout)',
                code: error.code
            });
        }

        // Error อื่นๆ
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดจาก Server หรือระบบต้นทาง',
            error: error.message
        });
    }
});

// 4. Health Check Route (สำหรับเช็คสถานะการทำงานของ Render)
app.get('/health', (req, res) => {
    res.status(200).send('OK - Server is running normally');
});

// 5. Default Route (แสดงหน้าแรก)
app.get('/', (req, res) => {
    // พยายามส่งไฟล์ test.html ถ้ามีอยู่ในโปรเจกต์
    const htmlFile = path.join(__dirname, 'test.html');
    res.sendFile(htmlFile, (err) => {
        if (err) {
            // ถ้าไม่มีไฟล์ test.html ให้แสดงข้อความต้อนรับ
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
