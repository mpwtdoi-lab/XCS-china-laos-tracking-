const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Render จะส่งพอร์ตมาทาง process.env.PORT
const PORT = process.env.PORT || 10000;

// ป้องกัน App ล่มจาก Error ที่คาดไม่ถึง
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

// Cross-Origin Headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(__dirname));

// Route หน้าแรก
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'), (err) => {
        if (err) {
            res.status(200).send('<h1 style="text-align:center;margin-top:50px;">XCS Tracking API is Working!</h1>');
        }
    });
});

// API Endpoint
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
        return res.status(500).json({ success: false, message: error.message });
    }
});

// รันแบบ Bind ทุก Network Interface (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
