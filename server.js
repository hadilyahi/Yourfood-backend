const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" })); // السماح لجميع الطلبات
app.use(express.json()); // دعم JSON requests

const API_URL = "https://platform.fatsecret.com/rest/server.api";
const API_KEY = "d702d141d18a4a0393fdcf2bbb5dff3a";
const API_SECRET = "b137e873e3f5413e919427482f6c461a";

// 🔹 دالة للحصول على Access Token من FatSecret
const getAccessToken = async () => {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

    try {
        const response = await axios.post(
            "https://oauth.fatsecret.com/connect/token",
            "grant_type=client_credentials&scope=basic",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Error getting access token:", error.response?.data || error.message);
        return null;
    }
};

// 🔹 نقطة نهاية API لجلب المعلومات الغذائية
app.get("/api/nutrition", async (req, res) => {
    try {
        const searchQuery = req.query.search;
        if (!searchQuery) {
            return res.status(400).json({ error: "يرجى إدخال المكونات" });
        }

        // ✅ الحصول على Access Token
        const accessToken = await getAccessToken();
        if (!accessToken) {
            return res.status(500).json({ error: "فشل في الحصول على Access Token" });
        }

        // ✅ إرسال الطلب إلى FatSecret باستخدام Access Token
        const response = await axios.get(API_URL, {
            params: {
                method: "foods.search",
                search_expression: searchQuery,
                format: "json",
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error("❌ Error fetching data:", error.response?.data || error.message);
        res.status(500).json({ error: "حدث خطأ أثناء جلب البيانات" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
