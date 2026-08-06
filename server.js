const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// เสิร์ฟหน้าเว็บ test.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// API Proxy ดึงข้อมูล
app.get('/api/track/:waybillNo', async (req, res) => {
    try {
        const { waybillNo } = req.params;
        const response = await axios.get(`https://www.hl-express.cn/api/track/${waybillNo}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
