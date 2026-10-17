let DB = global._SMS_DB || {};
global._SMS_DB = DB;
export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  try{
    const url = new URL(req.url, 'http://localhost');
    const room = url.searchParams.get('room') || (req.body && req.body.room) || 'general';
    if(req.method==='GET'){ return res.status(200).json(DB[room]||[]); }
    if(req.method==='POST'){
      const b=req.body||{};
      if(!b.message) return res.status(400).json({error:'no msg'});
      if(!DB[room]) DB[room]=[];
      const d={sender:b.sender||'Mtu',message:b.message,room,timestamp:Date.now()};
      DB[room].push(d);
      if(DB[room].length>100) DB[room]=DB[room].slice(-100);
      global._SMS_DB=DB;
      return res.json({ok:true});
    }
  }catch(e){return res.status(500).json({error:e.message})}
}
