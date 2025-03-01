require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const WORDPRESS_API_URL = "https://tvůj-web.cz/wp-json/wp/v2/posts"; // ZMĚŇ NA SVŮJ WORDPRESS!

// 🔹 Pomocná funkce na získání článků z WordPressu
async function getWordPressContent() {
  try {
    const response = await axios.get(WORDPRESS_API_URL);
    return response.data.map(post => post.title.rendered + " - " + post.content.rendered).join("\n\n");
  } catch (error) {
    console.error("Chyba při načítání článků z WordPressu:", error);
    return "";
  }
}

// 🔹 Ochrana proti „zneužití“ API (omezíme AI odpovědi)
function isAllowedQuestion(message) {
  const blockedWords = ["openai", "api", "key", "token", "hack", "bypass", "Claude zdarma"];
  return !blockedWords.some(word => message.toLowerCase().includes(word));
}

// 🔹 Hlavní endpoint pro chatbot API
app.post("/api/chatbot", async (req, res) => {
  try {
    const userMessage = req.body.message;

    // 🔸 Ověříme, zda je dotaz povolený
    if (!isAllowedQuestion(userMessage)) {
      return res.json({ reply: "Omlouvám se, ale na tuto otázku nemohu odpovědět." });
    }

    // 🔸 Získáme obsah z WordPressu
    const wpContent = await getWordPressContent();

    // 🔸 Pošleme dotaz do Anthropic API (včetně WP obsahu jako kontext)
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: "claude-3-5-sonnet-20241022",
        messages: [
          { role: "system", content: "Odpovídej pouze na základě informací v poskytnutém textu. Pokud odpověď není dostupná, řekni, že to nevíš." },
          { role: "user", content: `Tady jsou články z webu:\n${wpContent}\n\nDotaz: ${userMessage}` }
        ],
        max_tokens: 300
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Chyba při dotazu na API:", error);
    res.status(500).json({ error: "Něco se pokazilo..." });
  }
});

// 🔹 Spuštění serveru
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend běží na portu ${PORT}`));
