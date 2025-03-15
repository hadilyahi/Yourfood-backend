const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
const qs = require("querystring");

const app = express();
app.use(cors());

const API_URL = "https://platform.fatsecret.com/rest/server.api";
const API_KEY = "d702d141d18a4a0393fdcf2bbb5dff3a";
const API_SECRET = "b137e873e3f5413e919427482f6c461a";

// وظيفة لإنشاء توقيع OAuth 1.0a بشكل صحيح
const createOAuthSignature = (params) => {
    // ترتيب المعاملات أبجديًا كما يتطلب FatSecret
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join("&");

    // إنشاء **Base String** بالشكل الصحيح
    const baseString = `POST&${encodeURIComponent(API_URL)}&${encodeURIComponent(sortedParams)}`;

    // مفتاح التوقيع (يجب أن يكون `API_SECRET&` لأننا لا نستخدم `oauth_token`)
    const signingKey = `${API_SECRET}&`;

    // توليد التوقيع باستخدام HMAC-SHA1
    return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
};

app.get("/api/nutrition", async (req, res) => {
    try {
        const searchQuery = req.query.search;
        if (!searchQuery) {
            return res.status(400).json({ error: "يرجى إدخال المكونات" });
        }

        // إعداد معلمات OAuth
        const params = {
            method: "foods.search",
            search_expression: searchQuery,
            format: "json",
            oauth_consumer_key: API_KEY,
            oauth_nonce: crypto.randomBytes(16).toString("hex"),
            oauth_signature_method: "HMAC-SHA1",
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_version: "1.0",
        };

        // إنشاء التوقيع الصحيح وإضافته إلى الطلب
        params.oauth_signature = createOAuthSignature(params);

        // تحويل البيانات إلى `x-www-form-urlencoded`
        const requestBody = qs.stringify(params);

        // إرسال الطلب إلى FatSecret API
        const response = await axios.post(API_URL, requestBody, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        res.json(response.data);
    } catch (error) {
        console.error("❌ Error fetching data:", error.response?.data || error.message);
        res.status(500).json({ error: "حدث خطأ أثناء جلب البيانات" });
    }
});

app.listen(5000, () => console.log("🚀 Proxy server running on port 5000"));
