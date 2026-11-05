/** Identity/session boundary for the GitHub-backed preview; no Firebase Auth. */
import {createHmac, scrypt as callbackScrypt, randomBytes, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
import type {Request,Response,NextFunction,Router} from 'express';
import {Router as expressRouter} from 'express';
import {getDocument,putDocument,StoreError} from './githubStore';
const scrypt=promisify(callbackScrypt);
export type Identity={uid:string;role:'operator'|'customer';email:string;exp:number;provider:'email'|'google'|'admin'};
declare global {namespace Express {interface Request {identity?:Identity}}}

function sessionSecret():Buffer {
  const raw=process.env.GITHUB_SESSION_SECRET||'';
  if(raw.length<32) throw new StoreError('Thiếu GITHUB_SESSION_SECRET mạnh (ít nhất 32 ký tự).',503);
  return Buffer.from(raw,'utf8');
}
const b64=(input:string)=>Buffer.from(input).toString('base64url');
function sign(text:string){return createHmac('sha256',sessionSecret()).update(text).digest('base64url');}
export function cookieFor(identity:Omit<Identity,'exp'>):string {
  const body=b64(JSON.stringify({...identity,exp:Math.floor(Date.now()/1000)+7*86400}));
  return `${body}.${sign(body)}`;
}
export function parseSession(raw?:string):Identity|null {
  if(!raw||raw.length>4000) return null;
  const [payload,mac]=raw.split('.');
  if(!payload||!mac) return null;
  const expected=sign(payload),a=Buffer.from(mac),b=Buffer.from(expected);
  if(a.length!==b.length||!timingSafeEqual(a,b)) return null;
  try {
    const value=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as Identity;
    if(value.exp<Math.floor(Date.now()/1000)||typeof value.uid!=='string'||!['operator','customer'].includes(value.role))return null;
    return value;
  }catch{return null;}
}
function cookieValue(req:Request){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('qt_session='))?.slice('qt_session='.length);}
export function authMiddleware(req:Request,_res:Response,next:NextFunction) {
  try {req.identity=parseSession(cookieValue(req));}catch{req.identity=undefined;}
  next();
}
export function requireAdmin(req:Request) {
  if(req.identity?.role!=='operator')throw new StoreError('Chỉ tài khoản quản trị được phép thao tác.',403);
}
export function requireSignedIn(req:Request) {
  if(!req.identity)throw new StoreError('Vui lòng đăng nhập.',401);
}
function setSession(res:Response,user:Omit<Identity,'exp'>){
  res.cookie('qt_session',cookieFor(user),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400000});
}
const normalize=(s:string)=>String(s||'').trim().toLowerCase();
const emailOk=(x:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)&&x.length<=200;
function customerId(email:string) {return 'e_'+createHmac('sha256',sessionSecret()).update('email:'+normalize(email)).digest('hex').slice(0,35);}
export async function hashPassword(password:string){
  const salt=randomBytes(16).toString('base64url');
  const derived=await scrypt(password,salt,64) as Buffer;
  return `scrypt:v1:${salt}:${derived.toString('base64url')}`;
}
export async function checkPassword(password:string,hash:string) {
  try {
    const [kind,version,salt,value]=hash.split(':');
    if(kind!=='scrypt'||version!=='v1'||!salt||!value)return false;
    const derived=await scrypt(password,salt,64) as Buffer, expected=Buffer.from(value,'base64url');
    return derived.length===expected.length&&timingSafeEqual(derived,expected);
  }catch{return false;}
}
function publicProfile(doc:Record<string,unknown>){
  const {passwordHash:_,...safe}=doc;
  return safe;
}
function sameSecret(a:string,b:string){
  if(a.length!==b.length) return false;
  return timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
}
const attempts=new Map<string,{at:number,count:number}>();
function limitLogin(req:Request) {
  const ip=req.ip||'unknown',now=Date.now(),record=attempts.get(ip)||{at:now,count:0};
  if(now-record.at>15*60000){record.at=now;record.count=0;}
  record.count++;
  attempts.set(ip,record);
  if(record.count>15)throw new StoreError('Có quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau.',429);
}

export function githubAuthRouter():Router {
  const router=expressRouter();
  router.use(authMiddleware);
  router.get('/me',async(req,res,next)=>{
    try {
      if(!req.identity)return res.json({user:null});
      if(req.identity.role==='operator')return res.json({user:{id:req.identity.uid,email:req.identity.email,role:'operator',name:'Quản trị viên',points:0}});
      const current=await getDocument('users',req.identity.uid);
      if(!current)return res.json({user:null});
      res.json({user:publicProfile(current.data)});
    }catch(e){next(e);}
  });
  router.post('/logout',(_req,res)=>{res.clearCookie('qt_session',{path:'/'});res.json({ok:true});});
  router.post('/admin-login',(req,res,next)=>{
    try {
      limitLogin(req);
      const password=String(req.body?.password||'');
      const expected=process.env.GITHUB_ADMIN_PASSWORD||'';
      if(expected.length<8)throw new StoreError('Mật khẩu Admin phải có ít nhất 8 ký tự trong GITHUB_ADMIN_PASSWORD.',503);
      if(!sameSecret(password,expected))throw new StoreError('Sai mật khẩu quản trị.',401);
      const email=process.env.GITHUB_ADMIN_EMAIL||'admin@local.invalid';
      setSession(res,{uid:'github_admin',email,role:'operator',provider:'admin'});
      res.json({ok:true,user:{id:'github_admin',email,role:'operator',name:'Quản trị viên',points:0}});
    }catch(e){next(e);}
  });
  router.post('/register',async(req,res,next)=>{
    try {
      limitLogin(req);
      const email=normalize(req.body?.email),password=String(req.body?.password||''),name=String(req.body?.name||'').trim().slice(0,120),phone=String(req.body?.phone||'').trim();
      if(!emailOk(email)||password.length<8||password.length>256||name.length<2||!/^(0|\+84)[35789]\d{8}$/.test(phone))
        throw new StoreError('Email, họ tên, SĐT hoặc mật khẩu chưa hợp lệ (mật khẩu từ 8 ký tự).',400);
      const id=customerId(email),existing=await getDocument('users',id);
      if(existing)throw new StoreError('Email đã được đăng ký.',409);
      const profile={id,email,name,phone,role:'customer',points:10,welcomeBonusGranted:true,welcomeBonusPoints:10,createdAt:new Date().toISOString(),provider:'email',passwordHash:await hashPassword(password)};
      await putDocument('users',id,profile);
      setSession(res,{uid:id,email,role:'customer',provider:'email'});
      res.status(201).json({user:publicProfile(profile)});
    }catch(e){next(e);}
  });
  router.post('/login',async(req,res,next)=>{
    try {
      limitLogin(req);
      const email=normalize(req.body?.email),password=String(req.body?.password||'');
      if(!emailOk(email)||!password)throw new StoreError('Thông tin đăng nhập chưa hợp lệ.',400);
      const current=await getDocument('users',customerId(email));
      if(!current||typeof current.data.passwordHash!=='string'||!(await checkPassword(password,current.data.passwordHash)))
        throw new StoreError('Email hoặc mật khẩu không đúng.',401);
      setSession(res,{uid:customerId(email),email,role:'customer',provider:'email'});
      res.json({user:publicProfile(current.data)});
    }catch(e){next(e);}
  });
  router.post('/google',async(req,res,next)=>{
    try {
      limitLogin(req);
      const credential=String(req.body?.credential||'');
      const clientId=process.env.GOOGLE_OAUTH_CLIENT_ID||'';
      if(!clientId||!credential||credential.length>6000)throw new StoreError('Chưa cấu hình Google OAuth.',503);
      const request=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential));
      if(!request.ok)throw new StoreError('Không thể xác minh đăng nhập Google.',401);
      const info=await request.json() as Record<string,string>;
      if(info.aud!==clientId||!['accounts.google.com','https://accounts.google.com'].includes(info.iss)||info.email_verified!=='true'||Number(info.exp)<Date.now()/1000||!info.sub)
        throw new StoreError('Thông tin đăng nhập Google không hợp lệ.',401);
      const email=normalize(info.email);
      const allowAdmins=(process.env.GITHUB_GOOGLE_ADMIN_EMAILS||'').split(',').map(normalize);
      if(allowAdmins.includes(email)) {
        setSession(res,{uid:'google_admin_'+info.sub,email,role:'operator',provider:'google'});
        return res.json({user:{id:'google_admin_'+info.sub,name:info.name||email,email,role:'operator',points:0}});
      }
      const id='g_'+createHash('sha256').update(info.sub).digest('hex').slice(0,35);
      let current=await getDocument('users',id);
      if(!current){
        const profile={id,email,name:info.name||email,phone:'',role:'customer',points:10,welcomeBonusGranted:true,welcomeBonusPoints:10,createdAt:new Date().toISOString(),provider:'google'};
        await putDocument('users',id,profile);
        current={id,sha:'',data:profile};
      }
      setSession(res,{uid:id,email,role:'customer',provider:'google'});
      return res.json({user:publicProfile(current.data)});
    }catch(e){next(e);}
  });
  return router;
}
