
import { kv } from '@vercel/kv';

let MEM = global._MEM || {};
global._MEM = MEM;

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

  try{
    if(req.method==='GET'){
      let msgs = [];
      try{
        const data = await kv.get(kvKey);
        if(data) msgs = data;
        else msgs = MEM[room] || [];
      }catch(e){
        console.log('KV GET error:', e.message);
        msgs = MEM[room] || [];
      }
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

      let current = [];
      try{
        const existing = await kv.get(kvKey);
        current = existing || MEM[room] || [];
      }catch(e){
        console.log('KV GET error:', e.message);
        current = MEM[room] || [];
      }

      current.push(newMsg);
      if(current.length>300) current = current.slice(-300);

      MEM[room] = current;
      global._MEM = MEM;

      try{
        await kv.set(kvKey, current);
        await kv.expire(kvKey, 60*60*24*30);
        console.log('Saved to KV:', kvKey, current.length);
      }catch(e){
        console.log('KV SET error:', e.message);
      }

      return res.status(200).json({ok:true, total: current.length, saved: true});
    }

    return res.status(405).json({error:'method'});
  }catch(e){
    console.error('Handler error:', e);
    return res.status(500).json({error:e.message});
  }
}
