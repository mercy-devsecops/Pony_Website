import { isRateLimited } from './utils/rate-limit.js';

export default async function handler(req, res) {
  // Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  if (isRateLimited(ip, 10, 60000)) {
    return res.status(429).json({ error: { message: "Too many requests. Please try again later." } });
  }
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight check
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: { message: "Message is required" } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "GEMINI_API_KEY is not configured on the Vercel server environment variables." } });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful florist assistant. Answer clearly and simply.

User question: ${message}`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
}
