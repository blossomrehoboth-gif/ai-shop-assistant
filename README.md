# AI Shop Assistant — Starter Project

A working chat widget + backend that recommends products from a catalog
using AI. Right now it uses a sample catalog (`products.json`) — later,
swap that out for a real Shopify Admin API call so it always recommends
from your live store.

## What's included
- `server.js` — Express backend with the `/api/chat` endpoint
- `products.json` — sample product catalog (fridges, skincare, earbuds)
- `public/index.html`, `style.css`, `chat.js` — the chat widget frontend
- `.env.example` — template for your API key

## Setup (on your computer)

1. **Install Node.js** (if you don't have it): https://nodejs.org (get the LTS version)

2. **Open a terminal in this folder** and install dependencies:
   ```
   npm install
   ```

3. **Get a Groq API key**:
   - Go to https://console.groq.com/keys
   - Create an account, create a new key

4. **Set up your environment file**:
   - Copy `.env.example` to a new file called `.env`
   - Paste your API key in: `GROQ_API_KEY=gsk_...`

5. **Run the server**:
   ```
   npm start
   ```

6. **Open the chat widget**:
   Go to http://localhost:3000 in your browser and try asking things like:
   - "I need a fridge under 200 watts"
   - "Something for acne-prone skin"
   - "Do you have wireless earbuds?"

## How it works
- The customer's message + chat history gets sent to `/api/chat`
- The backend builds a prompt that includes your full product catalog
- The AI is instructed to ONLY recommend real products from that list
  (never invent a price or spec)
- The AI's reply includes a hidden `RECOMMENDED_IDS` line, which the
  backend uses to pull matching product cards to show the customer

## Next steps toward a real Shopify app
1. Sign up at https://partners.shopify.com (free)
2. Create a development store to test against
3. Replace `loadProducts()` in `server.js` with a real call to:
   ```
   GET https://{your-store}.myshopify.com/admin/api/2024-01/products.json
   ```
   (using an access token from your Shopify app's OAuth setup)
4. Use Shopify's CLI (`npm init @shopify/app@latest`) to wrap this logic
   into an actual embeddable Shopify app, and use Shopify's Billing API
   for the $10/month subscription instead of building your own billing
5. Add a real "Add to cart" button on each product card that calls
   Shopify's Cart API instead of just displaying info

## Notes
- This demo has no login/auth and no real payment — it's for testing
  the AI recommendation logic only
- The sample images are placeholders; real Shopify products will have
  their own image URLs from the Admin API
