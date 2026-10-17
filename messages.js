
let DB = {};
// Vercel keeps global between warm invocations
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { room } = req.query;
  if (!room) return res.status(400).json({error:'room required'});

  if (req.method === 'GET') {
    return res.json(DB[room] || []);
  }
  if (req.method === 'POST') {
    const { sender, message } = req.body;
    if (!DB[room]) DB[room] = [];
    const data = { sender, message, room, timestamp: Date.now() };
    DB[room].push(data);
    if (DB[room].length > 200) DB[room] = DB[room].slice(-200);
    return res.json({ok:true, data});
  }
  return res.status(405).end();
}
