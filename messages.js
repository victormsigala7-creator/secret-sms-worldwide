
let DB = global._DB || {}; global._DB = DB;
export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  try{
    let url = new URL(req.url, 'http://localhost');
    let room = url.searchParams.get('room') || req.query?.room || req.body?.room || 'general';
    // SAVE ALL UNDER SAME ROOM - ignore secret for storage so messages always show
    if(!DB[room]) DB[room]=[];
    if(req.method==='GET'){
      return res.status(200).json(DB[room]);
    }
    if(req.method==='POST'){
      let b=req.body; if(typeof b==='string'){ try{b=JSON.parse(b)}catch{b={}} }
      if(!b?.message) return res.status(400).json({error:'no msg'});
      DB[room].push({sender:b.sender||'Mtu',message:b.message,timestamp:Date.now()});
      if(DB[room].length>200) DB[room]=DB[room].slice(-200);
      global._DB=DB;
      return res.status(200).json({ok:true,total:DB[room].length});
    }
  }catch(e){return res.status(500).json({error:e.message})}
}
