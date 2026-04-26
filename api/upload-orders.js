// Vercel Serverless Function — uploads EFW order CSV to Supabase
// Env vars required:
//   SUPABASE_SERVICE_ROLE_KEY  — set in Vercel dashboard (never commit this!)
//   UPLOAD_SECRET              — optional bearer token to protect the endpoint

export default async function handler(req, res) {
  // CORS headers so the dashboard frontend can call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Optional secret to restrict who can upload
  const uploadSecret = process.env.UPLOAD_SECRET;
  if (uploadSecret) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${uploadSecret}`) {
      return res.status(401).json({ error: 'Unauthorized. Check your UPLOAD_SECRET.' });
    }
  }

  const { csv_content, city = 'Houston 2026' } = req.body || {};
  if (!csv_content) {
    return res.status(400).json({ error: 'Request body must include csv_content (string).' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bhdmrprephtgxbkugypi.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    return res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel > Settings > Environment Variables.',
    });
  }

  const lines = csv_content.trim().split('\n');
  const order_count = Math.max(0, lines.length - 1);

  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: 'return=minimal',
  };

  try {
    // Delete existing row for this city
    const deleteResp = await fetch(
      `${supabaseUrl}/rest/v1/order_data?city=eq.${encodeURIComponent(city)}`,
      { method: 'DELETE', headers }
    );
    if (!deleteResp.ok) {
      const text = await deleteResp.text();
      return res.status(500).json({ error: `Supabase DELETE failed (${deleteResp.status}): ${text}` });
    }

    // Insert new row
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/order_data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ csv_content, order_count, city }),
    });
    if (!insertResp.ok) {
      const text = await insertResp.text();
      return res.status(500).json({ error: `Supabase INSERT failed (${insertResp.status}): ${text}` });
    }

    return res.status(200).json({
      success: true,
      city,
      order_count,
      message: `Uploaded ${order_count} orders for "${city}" successfully.`,
    });
  } catch (err) {
    return res.status(500).json({ error: `Unexpected error: ${err.message}` });
  }
}
