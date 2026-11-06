import {Router, type Request} from 'express';
import {createHash} from 'node:crypto';
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
  const salt=process.env.CONTENT_METRICS_HASH_SALT||firebaseConfig.projectId;
  // Only a digest is stored, never visitor IP or user agent. One action
  // per client/network signature per calendar day; not a unique-user count.
  return createHash('sha256').update([salt,ip,agent,event,articleId,day].join('|')).digest('hex');
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
