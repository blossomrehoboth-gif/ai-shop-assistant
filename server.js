// server.js — AI Shop Assistant backend
//
// This is a starter Node.js/Express server for an AI shopping assistant.
// Right now it reads products from products.json (sample data).
// Later, replace loadProducts() with a real call to Shopify's Admin API
// so the AI always recommends from your live, real catalog.

const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3000;

// ---- Product catalog ----
// TODO (future): swap this out for a real Shopify Admin API call, e.g.
// GET https://{shop}.myshopify.com/admin/api/2024-01/products.json
function loadProducts() {
  const raw = fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8');
  return JSON.parse(raw);
}

// ---- Build a compact catalog summary for the AI prompt ----
function catalogForPrompt(products) {
  return products
    .map(p => {
      const wattsInfo = p.watts ? `, ${p.watts}W` : '';
      const colorsInfo = p.colors && p.colors.length ? `, colors: ${p.colors.join('/')}` : '';
      return `- [${p.id}] ${p.name} — $${p.price} (${p.category}${wattsInfo}${colorsInfo}, stock: ${p.stock}). ${p.description}`;
    })
    .join('\n');
}

// ---- Main chat endpoint ----
// The frontend sends: { message: "...", history: [{role, content}, ...] }
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Server is missing GROQ_API_KEY. Add it to your .env file.' });
    }

    const products = loadProducts();
    const catalogText = catalogForPrompt(products);

    const systemPrompt = `You are a friendly shopping assistant for an online store.
You must ONLY recommend products from the catalog below — never invent a
product, price, spec, or stock level that isn't listed here.

CATALOG:
${catalogText}

When you recommend a product, mention it by name and briefly say why it
fits what the customer asked for. If nothing in the catalog fits, say so
honestly and ask a clarifying question instead of guessing.
At the end of your reply, on a new line, output a JSON array of the
recommended product IDs from the catalog, like this:
RECOMMENDED_IDS: ["2"]
If you have no specific recommendation yet, output RECOMMENDED_IDS: []`;

    // Groq's chat completions endpoint takes the system prompt as a
    // regular message in the array, rather than a separate top-level field.
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', errText);
      return res.status(502).json({ error: 'AI service error. Check server logs.' });
    }

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content ?? '';

    // Pull out the RECOMMENDED_IDS line and the human-readable reply separately
    const match = fullText.match(/RECOMMENDED_IDS:\s*(\[[^\]]*\])/);
    let recommendedIds = [];
    if (match) {
      try { recommendedIds = JSON.parse(match[1]); } catch (e) { recommendedIds = []; }
    }
    const replyText = fullText.replace(/RECOMMENDED_IDS:\s*\[[^\]]*\]/, '').trim();

    const recommendedProducts = products.filter(p => recommendedIds.includes(p.id));

    res.json({ reply: replyText, products: recommendedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

app.listen(PORT, () => {
  console.log(`AI Shop Assistant running at http://localhost:${PORT}`);
});
