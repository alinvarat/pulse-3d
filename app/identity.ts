import {env} from 'cloudflare:workers';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {getChatGPTUser} from './chatgpt-auth';
type Runtime = {GOOGLE_CLIENT_ID?:string; STORE_OWNER_EMAIL?:string; BUCKET:R2Bucket};
export function runtime(){return env as unknown as Runtime}
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export type Identity={userId:string;email:string;name:string;provider:'google'|'sites';isAdmin:boolean};
export async function identify(request:Request):Promise<Identity|null>{
 const authorization=request.headers.get('authorization');
 if(authorization){
  const clientId=runtime().GOOGLE_CLIENT_ID;
  if(!clientId||!authorization.startsWith('Bearer ')||authorization.length>10000)return null;
  try{const {payload}=await jwtVerify(authorization.slice(7),keys,{audience:clientId,issuer:['https://accounts.google.com','accounts.google.com'],algorithms:['RS256'],requiredClaims:['sub','exp','iat','email','email_verified']});
   if(typeof payload.sub!=='string'||typeof payload.email!=='string'||payload.email_verified!==true)return null;
   return {userId:'google:'+payload.sub,email:payload.email,name:typeof payload.name==='string'?payload.name:payload.email,provider:'google',isAdmin:false};
  }catch{return null}
 }
 const user=await getChatGPTUser();if(!user)return null;
 const owner=runtime().STORE_OWNER_EMAIL;
 return {userId:user.userId,email:user.email,name:user.displayName,provider:'sites',isAdmin:!!owner&&user.email.toLowerCase()===owner.toLowerCase()};
}
export const privateHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
