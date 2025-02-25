require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"; // Správný endpoint

app.post('/api/chatbot', async (req, res) => {
    try {
        const userMessage = req.body.message;

        const response = await axios.post(
            ANTHROPIC_API_URL,
            {
                model: "claude-3-5-sonnet-20241022", // Můžeš změnit na jinou verzi modelu
                messages: [{ role: "user", content: userMessage }],
                max_tokens: 300
            },
            {
                headers: {
                    "x-api-key": ANTHROPIC_API_KEY,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01" // API vyžaduje tuto hlavičku
                }
            }
        );

        res.json({ reply: response.data.content });
    } catch (error) {
        console.error("❌ Chyba při dotazu na Claude API:", error.response ? error.response.data : error);
        res.status(500).json({ error: "Něco se pokazilo..." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend běží na portu ${PORT}`));
