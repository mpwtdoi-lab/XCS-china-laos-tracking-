const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Render จะส่งพอร์ตมาทาง process.env.PORT
const PORT = process.env.PORT || 10000;

// ⚠️ ต้องตั้งค่า Environment Variable นี้บน Render (Settings -> Environment)
// ห้าม hardcode ค่านี้ลงในโค้ดอีกต่อไป
const AUTH_TOKEN = process.env.XCS_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.warn('⚠️  WARNING: ยังไม่ได้ตั้งค่า XCS_AUTH_TOKEN ใน Environment Variables — API tracking จะไม่ทำงาน');
}

// ป้องกัน App ล่มจาก Error ที่คาดไม่ถึง
// (แค่ log ไว้ ไม่สั่งปิด process เพราะจะทำให้ server restart วนไปเรื่อยๆ
//  ทุกครั้งที่เจอ error เล็กๆ น้อยๆ จาก request หนึ่งครั้ง)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
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

// Serve Static Files — เสิร์ฟเฉพาะไฟล์ในโฟลเดอร์ /public เท่านั้น
// (ห้ามใช้ __dirname ตรงๆ เพราะจะทำให้ server.js / package.json / .env
//  ถูกดาวน์โหลดได้จากภายนอกด้วย)
app.use(express.static(path.join(__dirname, 'public')));

// Route หน้าแรก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'), (err) => {
    if (err) {
      res.status(200).send('<h1 style="text-align:center;margin-top:50px;">XCS Tracking API is Working!</h1>');
    }
  });
});

// ตรวจสอบรูปแบบเลขพัสดุแบบง่ายๆ (ตัวอักษร/ตัวเลข ความยาว 5-30 ตัว)
function isValidWaybillNo(no) {
  return typeof no === 'string' && /^[A-Za-z0-9]{5,30}$/.test(no);
}

// API Endpoint
app.get('/api/track/:waybillNo', async (req, res) => {
  const { waybillNo } = req.params;

  if (!waybillNo || !isValidWaybillNo(waybillNo)) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุหมายเลขพัสดุที่ถูกต้อง' });
  }

  if (!AUTH_TOKEN) {
    return res.status(500).json({ success: false, message: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า AUTH_TOKEN' });
  }

  try {
    const targetUrl = 'https://0x26.cn/index.php/OpenApi/Order/getOrderStatus';

    const formData = new URLSearchParams();
    formData.append('v', '3.1');
    formData.append('auth', AUTH_TOKEN);
    formData.append('search_all', waybillNo);
    formData.append('query_range', 'group');
    formData.append('log_types', 'tt_depart,tt_arrive,depart,arrive,deliver,sign,custom,receipt,create_reservation,reservation_accept,reservation_cancel_accept,reservation_to_order,reservation_merge_order,trans_order,order_taking_dispatch,reserved_dispatch,shuttle_load,b_shuttle_accept,delivery_load,back,cancel_back,tr_pda_scan_load,tr_pda_scan_unload,tr_unload,tr_load,online_trans_reject,online_trans_accept,online_trans_cancel_accept,trans_arrival,tr_reload,tt_create_auto_delivery');

    const response = await axios.post(targetUrl, formData.toString(), {
      timeout: 10000, // 10 วินาที กันไม่ให้ request แขวนค้าง
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
    console.error('Track API error:', error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ success: false, message: 'เชื่อมต่อ API ต้นทางหมดเวลา (timeout)' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

// รันแบบ Bind ทุก Network Interface (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
