export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple test response
  return res.json({
    success: false,
    error: 'Test response - API route is working',
    body: req.body
  });
}