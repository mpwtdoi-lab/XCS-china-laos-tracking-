const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// เปิดใช้งาน CORS เพื่อให้ Frontend เรียกใช้งานได้โดยไม่ติด Block
app.use(cors());
app.use(express.json());

// ให้ Express ให้บริการไฟล์ Static (เช่น test.html, css, js) จากโฟลเดอร์ public (ถ้ามี)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// CONFIGURATION: กำหนด URL API ต้นทางที่นี่
// ==========================================
// TODO: หากทราบ Domain หรือ IP ที่ถูกต้องของ HL-Express ให้เปลี่ยนตรงนี้
const HL_EXPRESS_API_BASE = 'https://www.hl-express.cn'; 

// Route หลักสำหรับดึงข้อมูลพัสดุ
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;

    if (!waybillNo) {
        return res.status(400).json({ 
            success: false, 
            message: 'กรุณาระบุหมายเลขพัสดุ (Waybill Number)' 
        });
    }

    try {
        console.log(`[API Request] Searching for tracking number: ${waybillNo}`);

        // ส่ง Request ไปยัง API ต้นทาง
        const response = await axios.get(`${HL_EXPRESS_API_BASE}/api/track/${waybillNo}`, {
            timeout: 15000, // กำหนด Timeout 15 วินาที
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        // ส่งข้อมูลที่ได้จากต้นทางกลับไปให้ Frontend
        return res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error(`API Fetch Error: ${error.message}`);

        // จัดการ Error กรณีหา Domain ไม่พบ (ENOTFOUND)
        if (error.code === 'ENOTFOUND') {
            return res.status(502).json({
                success: false,
                message: `ไม่สามารถเชื่อมต่อกับโดเมน ${HL_EXPRESS_API_BASE} ได้ กรุณาตรวจสอบ Domain ต้นทาง`,
                error_code: error.code
            });
        }

        // จัดการ Error กรณี Timeout หรืออื่นๆ
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพัสดุจากระบบต้นทาง',
            error_details: error.message
        });
    }
});

// Route สำหรับตรวจสอบสถานะ Server (Health Check)
app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy and running!');
});

// หน้า Default กรณีเข้า URL หลัก
app.get('/', (req, res) => {
    // ถ้ามีไฟล์ test.html อยู่ในโฟลเดอร์ public
    const htmlPath = path.join(__dirname, 'public', 'test.html');
    res.sendFile(htmlPath, (err) => {
        if (err) {
            res.send('API Server is running. Use /api/track/:waybillNo to search.');
        }
    });
});

// เริ่มต้นเปิด Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
