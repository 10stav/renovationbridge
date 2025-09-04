export default function handler(req, res) {
  console.log('SIMPLE TEST WEBHOOK HIT!', {
    method: req.method,
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: req.headers
  });
  
  res.status(200).json({ 
    success: true, 
    message: 'Test webhook received',
    timestamp: new Date().toISOString()
  });
}