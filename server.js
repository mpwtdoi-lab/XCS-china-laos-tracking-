const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// 2. API Proxy Route
app.get('/api/track/:waybillNo', async (req, res) => {
    const { waybillNo } = req.params;

    if (!waybillNo) {
        return res.status(400).json({ 
            success: false, 
            message: 'กรุณาระบุหมายเลขพัสดุ' 
        });
    }

    console.log(`[${new Date().toISOString()}] Fetching tracking for: ${waybillNo}`);

    try {
        // Construct target URL using the retrieved endpoint structure
        const targetUrl = `https://0x26.cn/index.php/OpenApi/Order/getOrderStatus?logid=001786100803036&app_info=${encodeURIComponent('{"from":"h5","os_type":"other"}')}`;

        // Send POST Request as required by the backend API
        const response = await axios.post(
            targetUrl,
            {
                bill_code: waybillNo,
                logid: waybillNo
            },
            {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://0x26.cn/static/h5/index.html',
                    'Origin': 'https://0x26.cn'
                }
            }
        );

        return res.json({
            success: true,
            waybillNo: waybillNo,
            data: response.data
        });

    } catch (error) {
        console.error(`[API Fetch Error]: ${error.message}`);
        
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจากระบบต้นทาง',
            error: error.message
        });
    }
});

// 3. Health Check & Default Routes
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'), (err) => {
        if (err) res.status(200).send('<h1>XCS China-Laos Tracking API Server is Live!</h1>');
    });
});

// 4. Start Server
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
