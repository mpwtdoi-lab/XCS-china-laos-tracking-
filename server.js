const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
// Render จะส่งค่า PORT มาให้เสมอ
const PORT = process.env.PORT || 10000;

// ดักจับ Error ระดับ Global ไม่ให้ Process ดับเด็ดขาด
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// ตั้งค่า CORS Header
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Request Logger (ดูใน Render Log ได้เวลาคนเข้าเว็บ)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// หน้าแรก
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'test.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.status(200).send(`
            <div style="text-align:center; padding:50px; font-family:sans-serif;">
                <h1 style="color:#0d6efd;">XCS Tracking API Online</h1>
                <p>ระบบพร้อมใช้งาน (ไม่พบไฟล์ test.html ใน Root Directory)</p>
            </div>
        `);
    }
});

// API ค้นหาพัสดุ
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;

    if (!waybillNo) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุหมายเลขพัสดุ' });
    }

    try {
        const targetUrl = 'https://0x26.cn/index.php/OpenApi/Order/getOrderStatus';
        
        const formData = new URLSearchParams();
        formData.append('v', '3.1');
        formData.append('auth', 'b39aba698b7d588f8237fec222d959fb');
        formData.append('search_all', waybillNo);
        formData.append('query_range', 'group');
        formData.append('log_types', 'tt_depart,tt_arrive,depart,arrive,deliver,sign,custom,receipt,create_reservation,reservation_accept,reservation_cancel_accept,reservation_to_order,reservation_merge_order,trans_order,order_taking_dispatch,reserved_dispatch,shuttle_load,b_shuttle_accept,delivery_load,back,cancel_back,tr_pda_scan_load,tr_pda_scan_unload,tr_unload,tr_load,online_trans_reject,online_trans_accept,online_trans_cancel_accept,trans_arrival,tr_reload,tt_create_auto_delivery');

        const response = await axios.post(targetUrl, formData.toString(), {
            params: {
                logid: '001786100803036',
                app_info: JSON.stringify({ from: 'h5', os_type: 'other' })
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://0x26.cn/static/h5/index.html'
            }
        });

        return res.json({ success: true, waybillNo, data: response.data });

    } catch (error) {
        console.error("API Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Health check
app.get('/health', (req, res) => res.status(200).send('OK'));

// **จุดสำคัญที่สุด**: ต้องใส่ '0.0.0.0' เพื่อเปิดรับ Network ภายนอกบน Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
});
