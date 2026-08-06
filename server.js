const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

app.get('/api/track/:waybillNo', async (req, res) => {
    try {
        const waybillNo = req.params.waybillNo;
        
        // URL จริงจาก Network Tab ในรูปภาพ
        const chinaUrl = 'http://0x26.cn/index.php/OpenApi/Order/getOrderStatus';
        
        // Query string params ตรงตาม Request URL ในภาพ
        const params = {
            logid: '001786023084558',
            app_info: '{"from":"h5","os_type":"other"}'
        };

        const formData = new URLSearchParams();
        formData.append('v', '3.1');
        formData.append('auth', 'b39aba698b7d588f8237fec222d959fb');
        formData.append('search_all', waybillNo);
        formData.append('query_range', 'group');
        formData.append('log_types', 'tt_depart,tt_arrive,depart,arrive,deliver,sign,custom,receipt,create,reservation,reservation_accept,reservation_cancel_accept,reservation_to_order,reservation_merge_order,trans_order,order_taking_dispatch,reserved_dispatch,shuttle_load,b_shuttle_accept,delivery_load,back,cancel_back,tr_pda_scan_load,tr_pda_scan_unload,tr_unload,tr_load,online_trans_reject,online_trans_accept,online_trans_cancel_accept,trans_arrival,tr_reload,tt_create_auto_delivery');

        const response = await axios.post(chinaUrl, formData.toString(), {
            params: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // ใส่ Cookie จากในรูปเพื่อเลียนแบบหน้าเว็บจริง
                'Cookie': 'lib.track.fingerprint=9bd9a76a-2114-4e6c-915d-f7e688d2bf3e; PHPSESSID=c6b560df8b7f4f79295cfc6ecea4bd56'
            },
            timeout: 10000
        });

        console.log('--- สำเร็จ! ข้อมูลตอบกลับจากจีน ---');
        console.log(JSON.stringify(response.data, null, 2));

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('--- เกิดข้อผิดพลาด ---');
        if (error.response) {
            console.error('Status Code:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }

        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบจีน',
            details: error.message 
        });
    }
});

app.listen(3000, () => {
    console.log('🚀 Server พร้อมทำงานที่ http://localhost:3000');
});