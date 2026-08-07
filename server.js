const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
// ใช้ process.env.PORT หรือ fallback ไปที่ 8080 เพื่อหลีกเลี่ยงปัญหา Network Block
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ให้บริการไฟล์ Static
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint สำหรับค้นหาพัสดุ
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;

    if (!waybillNo) {
        return res.status(400).json({ 
            success: false, 
            message: 'กรุณาระบุหมายเลขพัสดุ' 
        });
    }

    console.log(`[${new Date().toISOString()}] Querying Waybill: ${waybillNo}`);

    try {
        const targetUrl = 'https://0x26.cn/index.php/OpenApi/Order/getOrderStatus';
        
        // ใช้ URLSearchParams ในตัวของ Node.js (ไม่ต้องลง package เสริม)
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
            timeout: 15000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://0x26.cn/static/h5/index.html',
                'Origin': 'https://0x26.cn'
            }
        });

        return res.json({
            success: true,
            waybillNo: waybillNo,
            data: response.data
        });

    } catch (error) {
        console.error(`[API Error]:`, error.message);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพัสดุ',
            error: error.message
        });
    }
});

// Health check endpoint สำหรับ Render
app.get('/health', (req, res) => res.status(200).send('OK'));

// หน้าเว็บหลัก
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'), (err) => {
        if (err) res.status(200).send('<h1>XCS Tracking API Online</h1>');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
