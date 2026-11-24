import {estimate} from '../../pricing';
import {env} from 'cloudflare:workers';
import {identify,privateHeaders,runtime} from '../../identity';
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'คำขอไม่ถูกต้อง'},{status:403});
 const user=await identify(request);if(!user)return Response.json({error:'เข้าสู่ระบบส่วนตัวก่อนส่งไฟล์'},{status:401});
 if(Number(request.headers.get('content-length'))>51*1024*1024)return Response.json({error:'ไฟล์ใหญ่เกิน 50 MB'},{status:413});
 try{const data=await request.formData();const file=data.get('file');const s=JSON.parse(String(data.get('settings')));
 if(!(file instanceof File)||!file.size||file.size>50*1024*1024||!/^.+\.(stl|3mf|obj)$/i.test(file.name))return Response.json({error:'ไฟล์ไม่ถูกต้อง รองรับ STL, 3MF, OBJ ไม่เกิน 50 MB'},{status:400});
 if(!['PETG','PETG-CF'].includes(s.material)||!['gyroid','grid','honeycomb','lines'].includes(s.pattern)||!['auto','back','aligned','random'].includes(s.seam)||!Number.isInteger(s.density)||s.density<5||s.density>100||s.density%5||!Number.isInteger(s.qty)||s.qty<1||s.qty>100||typeof s.email!=='string'||s.email.length>200||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)||typeof s.notes!=='string'||s.notes.length>2000)return Response.json({error:'ตรวจตัวเลือกและอีเมลอีกครั้ง'},{status:400});
 const bucket=(env as unknown as {BUCKET:R2Bucket}).BUCKET;if(!bucket)return Response.json({error:'ระบบรับไฟล์ยังไม่พร้อม'},{status:503});
 let quote=null;try{quote=await estimate(file,s.material,s.density,s.qty)}catch{}
 const id=crypto.randomUUID();const prefix=`orders/${encodeURIComponent(user.userId)}/${id}`;
 await bucket.put(prefix+'/model',file.stream(),{httpMetadata:{contentType:'application/octet-stream'}});
 try{await bucket.put(prefix+'/order.json',JSON.stringify({id,owner:user.userId,createdAt:new Date().toISOString(),status:'requested',quote,filename:file.name,size:file.size,settings:{material:s.material,density:s.density,pattern:s.pattern,seam:s.seam,qty:s.qty,notes:s.notes,email:s.email}}),{httpMetadata:{contentType:'application/json'}})}catch(e){await bucket.delete(prefix+'/model');throw e}
 return Response.json({id},{status:201});
 }catch{return Response.json({error:'บันทึกไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง'},{status:400})}
}

export async function GET(request:Request){
 const user=await identify(request);if(!user)return Response.json({error:'กรุณาเข้าสู่ระบบ'},{status:401,headers:privateHeaders});
 const cursor=new URL(request.url).searchParams.get('cursor')||undefined;
 const bucket=runtime().BUCKET;if(!bucket)return Response.json({error:'ระบบยังไม่พร้อม'},{status:503,headers:privateHeaders});
 const prefix=user.isAdmin?'orders/':`orders/${encodeURIComponent(user.userId)}/`;
 try{const page=await bucket.list({prefix,limit:100,cursor});const records=await Promise.all(page.objects.filter(o=>o.key.endsWith('/order.json')).map(async o=>{const r=await bucket.get(o.key);return r?await r.json():null}));return Response.json({orders:records.filter(Boolean),cursor:page.truncated?page.cursor:null},{headers:privateHeaders})}catch{return Response.json({error:'อ่านคำขอไม่สำเร็จ'},{status:500,headers:privateHeaders})}
}


