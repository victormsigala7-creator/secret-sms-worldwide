export default function handler(req,res){
res.setHeader('Access-Control-Allow-Origin','*');
res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
res.setHeader('Access-Control-Allow-Headers','Content-Type');
if(req.method==='OPTIONS')return res.status(200).end();
let DB=global._SMS_DB||{};global._SMS_DB=DB;
const url=new URL(req.url,'http://localhost');
let room=url.searchParams.get('room')||(req.body&&req.body.room)||'general';
if(req.method==='GET'){return res.status(200).json(DB[room]||[]);}
if(req.method==='POST'){
try{
let body='';
if(typeof req.body==='object')body=req.body;
else body=JSON.parse(req.body||'{}');
if(!body.message)return res.status(400).json({error:'empty'});
if(!DB[room])DB[room]=[];
DB[room].push({sender:body.sender||'Anon',message:body.message,timestamp:Date.now()});
if(DB[room].length>200)DB[room]=DB[room].slice(-200);
global._SMS_DB=DB;
return res.json({ok:true});
}catch(e){return res.status(500).json({error:e.message});}
}
}
