
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  let room = 'general';
  try{
    const urlObj = new URL(req.url, 'http://localhost');
    room = urlObj.searchParams.get('room') || req.query?.room || req.body?.room || 'general';
    room = room.toString().slice(0,50).replace(/[^a-zA-Z0-9_-]/g,'') || 'general';
  }catch{}
  
  const kvKey = `shinelyne:room:${room}`;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  let MEM = global._MEM || {};
  if(!global._MEM) global._MEM = MEM;

  async function upstashGet(key){
    if(!url || !token) return null;
    try{
      const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const j = await r.json();
      if(j && j.result){
        try{ return typeof j.result === 'string' ? JSON.parse(j.result) : j.result; }
        catch{ return j.result; }
      }
      return null;
    }catch(e){ console.log('get fail', e.message); return null; }
  }

  async function upstashSet(key, val){
    if(!url || !token) return false;
    try{
      const data = JSON.stringify(val);
      const r = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(data)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const j = await r.json();
      // set expire 30 days
      try{
        await fetch(`${url}/expire/${encodeURIComponent(key)}/2592000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }catch{}
      return true;
    }catch(e){ console.log('set fail', e.message); return false; }
  }

  try{
    if(req.method==='GET'){
      let msgs = await upstashGet(kvKey);
      if(!msgs) msgs = MEM[room] || [];
      return res.status(200).json(msgs);
    }

    if(req.method==='POST'){
      let body = req.body;
      if(typeof body==='string'){ try{body=JSON.parse(body)}catch{body={}} }
      if(!body?.message) return res.status(400).json({error:'no message'});
      
      let newMsg = {
        sender: (body.sender||'Mtu').toString().slice(0,20),
        message: body.message.toString().slice(0,500),
        timestamp: Date.now()
      };

      let current = await upstashGet(kvKey);
      if(!current) current = MEM[room] || [];
      
      current.push(newMsg);
      if(current.length>300) current = current.slice(-300);

      MEM[room] = current;
      global._MEM = MEM;

      const saved = await upstashSet(kvKey, current);
      
      return res.status(200).json({ok:true, total: current.length, savedTo: saved ? 'UPSTASH_DB' : 'MEMORY', env: url ? 'FOUND' : 'MISSING'});
    }

    return res.status(405).json({error:'method'});
  }catch(e){
    return res.status(500).json({error:e.message});
  }
}
