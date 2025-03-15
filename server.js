require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = "qq1B0QRigTBZMvfT0eQKGBT2ZyNtk2PCnHaD5wG7";

if (!API_KEY) {
    console.error("❌ تأكد من إدخال USDA_API_KEY في ملف .env");
    process.exit(1);
}

app.get("/api/nutrition", async (req, res) => {
    try {
        const searchQuery = req.query.search;
        if (!searchQuery) {
            return res.status(400).json({ error: "❌ يرجى إدخال المكونات في البحث!" });
        }

        const response = await axios.get("https://api.nal.usda.gov/fdc/v1/foods/search", {
            params: {
                query: searchQuery,
                api_key: API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("❌ خطأ أثناء جلب البيانات:", error.response?.data || error.message);
        res.status(500).json({ error: "❌ حدث خطأ أثناء جلب البيانات، حاول لاحقًا." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
