export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://pony-website-eight.vercel.app');
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

  const { reference } = req.body || {};
  if (!reference) {
    return res.status(400).json({ error: { message: "Transaction reference is required" } });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: { message: "PAYSTACK_SECRET_KEY is not configured on the Vercel server environment variables." } });
  }

  try {
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await paystackResponse.json();
    if (!paystackResponse.ok) {
      return res.status(paystackResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Paystack verification failed:", error);
    return res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
}
