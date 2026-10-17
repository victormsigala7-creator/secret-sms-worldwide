let DB = global._SMS_DB || {};
global._SMS_DB = DB;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const room = (req.query && req.query.room) || (req.body && req.body.room) || 'general';
    
    if (req.method === 'GET') {
      const messages = DB[room] || [];
      return res.status(200).json(messages);
    }
    
    if (req.method === 'POST') {
      const body = req.body || {};
      const sender = body.sender || 'Mtu';
      const message = body.message;
      
      if (!message) {
        return res.status(400).json({ error: 'Message required' });
      }
      
      if (!DB[room]) DB[room] = [];
      
      const newMsg = {
        sender,
        message,
        room,
        timestamp: Date.now()
      };
      
      DB[room].push(newMsg);
      if (DB[room].length > 100) {
        DB[room] = DB[room].slice(-100);
      }
      global._SMS_DB = DB;
      
      return res.status(200).json({ ok: true, data: newMsg });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
