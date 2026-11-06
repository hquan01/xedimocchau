import {Router, type Request} from 'express';
import {createHmac} from 'node:crypto';
import {getApps, initializeApp, applicationDefault, cert} from 'firebase-admin/app';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const growthMetricsRouter=Router();
type Engagement='view'|'like'|'save'|'share'|'booking_click';
const EVENTS=new Set<Engagement>(['view','like','save','share','booking_click']);
const ARTICLE_ID=/^[a-zA-Z0-9_-]{1,80}$/;
const DAY_MS=86400000;
let cached:{expires:number;days:number;stats:Record<string,Record<Engagement,number>>}|null=null;
function firestore(){
  const key=process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();
  // A private HMAC salt is required to protect IP-based deduplication keys.
  if(!process.env.CONTENT_METRICS_HASH_SALT?.trim())return null;
  if(!key&&!process.env.GOOGLE_APPLICATION_CREDENTIALS)return null;
  const name='qt-public-growth-stats';
  const app=getApps().find(x=>x.name===name)||
    initializeApp({credential:key?cert(JSON.parse(key)):applicationDefault(),projectId:firebaseConfig.projectId},name);
  return getFirestore(app,firebaseConfig.firestoreDatabaseId);
}
function utcDay(d:Date){return d.toISOString().slice(0,10)}
function sourceKey(req:Request,event:Engagement,articleId:string,day:string){
  const forwarded=req.headers['x-vercel-forwarded-for'];
  const ip=typeof forwarded==='string'?forwarded.split(',')[0]:(req.ip||'');
  const agent=String(req.headers['user-agent']||'').slice(0,150);
  const salt=process.env.CONTENT_METRICS_HASH_SALT!;
  // Never persist visitor IP or UA. HMAC with a secret server-only key;
  // approximate deduplication, not a verified unique-person counter.
  return createHmac('sha256',salt).update([ip,agent,event,articleId,day].join('|')).digest('hex');
}
// Read only aggregated, privacy-preserving public counters; never expose fingerprints.
growthMetricsRouter.get('/engagement',async(req,res)=>{
  const days=req.query.days==='7'?7:req.query.days==='90'?90:30;
  res.set('Cache-Control','public, max-age=60, s-maxage=300');
  if(cached&&cached.expires>Date.now()&&cached.days===days)return res.json({enabled:true,periodDays:days,stats:cached.stats});
  try{
    const db=firestore();
    if(!db)return res.json({enabled:false,periodDays:days,stats:{},reason:'server-not-configured'});
    const start=utcDay(new Date(Date.now()-(days-1)*DAY_MS));
    const snap=await db.collection('growth_article_daily').where('day','>=',start).limit(2500).get();
    const stats:Record<string,Record<Engagement,number>>={};
    for(const doc of snap.docs){
      const row=doc.data(),id=String(row.articleId||'');
      if(!ARTICLE_ID.test(id))continue;
      const dest=stats[id]||={view:0,like:0,save:0,share:0,booking_click:0};
      for(const event of EVENTS)dest[event]+=Math.max(0,Number(row[event])||0);
    }
    cached={expires:Date.now()+4*60_000,days,stats};
    return res.json({enabled:true,periodDays:days,stats});
  }catch(error){
    console.warn('Growth metrics not available',error instanceof Error?error.message:'unknown');
    return res.status(503).json({enabled:false,periodDays:days,stats:{},reason:'temporarily-unavailable'});
  }
});
growthMetricsRouter.post('/engagement',async(req,res)=>{
  res.set('Cache-Control','no-store');
  const articleId=String(req.body?.articleId||'');
  const event=req.body?.event as Engagement;
  if(!ARTICLE_ID.test(articleId)||!EVENTS.has(event))return res.status(400).json({error:'Invalid event'});
  const ua=String(req.headers['user-agent']||'');
  if(/googlebot|bingbot|slurp|facebookexternalhit|tiktokbot|bytespider|crawler/i.test(ua))return res.status(204).end();
  try{
    const db=firestore();
    if(!db)return res.status(503).json({error:'Tracking not configured'});
    const day=utcDay(new Date());
    const key=sourceKey(req,event,articleId,day);
    const marker=db.collection('growth_event_once').doc(key);
    const daily=db.collection('growth_article_daily').doc(day+'_'+articleId);
    const created=await db.runTransaction(async(tx)=>{
      const exists=await tx.get(marker);
      if(exists.exists)return false;
      tx.create(marker,{day,createdAt:FieldValue.serverTimestamp(),expiresAt:new Date(Date.now()+34*DAY_MS)});
      tx.set(daily,{day,articleId,[event]:FieldValue.increment(1),updatedAt:FieldValue.serverTimestamp()},{merge:true});
      return true;
    });
    cached=null;
    return res.status(created?201:200).json({recorded:created});
  }catch(error){
    console.warn('Could not record content engagement',error instanceof Error?error.message:'unknown');
    return res.status(503).json({error:'Tracking temporarily unavailable'});
  }
});

/** Public CMS article view for static SEO pages. The rendered HTML includes a
 * readable editorial snapshot, then refreshes with the most recent Firestore
 * article where accessible. Only explicitly public guide fields are returned. */
function fieldValue(v:any):any{
  if(!v||typeof v!=='object')return null;
  if('stringValue' in v)return String(v.stringValue);
  if('integerValue' in v)return Number(v.integerValue)||0;
  if('booleanValue' in v)return Boolean(v.booleanValue);
  if('arrayValue' in v)return (v.arrayValue?.values||[]).map(fieldValue);
  if('mapValue' in v)return Object.fromEntries(Object.entries(v.mapValue?.fields||{}).map(([k,x])=>[k,fieldValue(x)]));
  return null;
}
growthMetricsRouter.get('/article',async(req,res)=>{
  const id=String(req.query.id||'');
  if(!ARTICLE_ID.test(id))return res.status(400).json({error:'Invalid article'});
  res.set('Cache-Control','public, max-age=60, s-maxage=120');
  try{
    let row:any=null;
    const db=firestore();
    if(db){
      const record=await db.collection('guide_articles').doc(id).get();
      if(!record.exists)return res.status(404).json({error:'Article not found'});
      row=record.data();
    }else {
      // Public Firestore REST read via server: the same collection is readable
      // without login on the existing website. Never return API configuration.
      const projectId=firebaseConfig.projectId;
      const databaseId=firebaseConfig.firestoreDatabaseId||'(default)';
      const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/guide_articles/${encodeURIComponent(id)}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
      const abort=new AbortController();
      const timer=setTimeout(()=>abort.abort(),4500);
      let response:Response;
      try{response=await fetch(url,{signal:abort.signal})}finally{clearTimeout(timer)}
      if(response.status===404)return res.status(404).json({error:'Article not found'});
      if(!response.ok)return res.status(503).json({error:'CMS unavailable'});
      const data=await response.json() as {fields?:Record<string,unknown>};
      row=Object.fromEntries(Object.entries(data.fields||{}).map(([key,val])=>[key,fieldValue(val)]));
    }
    if(!row||typeof row.title!=='string'||!Array.isArray(row.content))return res.status(404).json({error:'Article not found'});
    return res.json({id,title:String(row.title).slice(0,250),excerpt:String(row.excerpt||'').slice(0,1000),
      content:row.content.filter((x:unknown)=>typeof x==='string').slice(0,75),
      imageUrl:typeof row.imageUrl==='string'?row.imageUrl:'',categoryLabel:String(row.categoryLabel||'Cẩm nang')});
  }catch(error){
    console.warn('Public CMS article unavailable',error instanceof Error?error.message:'unknown');
    return res.status(503).json({error:'CMS temporarily unavailable'});
  }
});
