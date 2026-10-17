
let DB = global._SHINELYNE_DB || {};
global._SHINELYNE_DB = DB;
export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  try{
    const url=new URL(req.url,'http://localhost');
    let room=url.searchParams.get('room')||req.query?.room||req.body?.room||'general';
    let secret=url.searchParams.get('secret')||req.query?.secret||req.body?.secret||'';
    let roomKey=room+'::'+secret;
    if(req.method==='GET'){
      return res.status(200).json(DB[roomKey]||DB[room]||[]);
    }
    if(req.method==='POST'){
      let body=req.body; if(typeof body==='string'){ try{body=JSON.parse(body)}catch{body={}} }
      if(!body?.message) return res.status(400).json({error:'no msg'});
      if(!DB[roomKey]) DB[roomKey]=[];
      DB[roomKey].push({sender:body.sender||'Mtu',message:body.message,timestamp:Date.now()});
      if(DB[roomKey].length>150) DB[roomKey]=DB[roomKey].slice(-150);
      global._SHINELYNE_DB=DB;
      return res.status(200).json({ok:true});
    }
  }catch(e){return res.status(500).json({error:e.message})}
}
