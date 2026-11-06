import {Router} from 'express';

export const tiktokRecentRouter=Router();
const PROFILE='https://www.tiktok.com/@limousinemocchau';
const VIDEO_RE=/^https:\/\/(?:www\.)?tiktok\.com\/@limousinemocchau\/video\/(\d{15,22})(?:[?#].*)?$/i;
interface PublicVideo {id:string;url:string;title:string;cover:string}
let cache:{expires:number;videos:PublicVideo[]}|null=null;

/**
 * Uses the official TikTok Display API only if the site owner has granted
 * video.list to this website and configured a valid server-side access token.
 * No scraping, no guessed video IDs, no secrets sent to visitors.
 *
 * Access tokens expire; a proper OAuth refresh-token flow must be connected to
 * guarantee uninterrupted automatic updates. On failure, the frontend shows a
 * direct profile link rather than an error-filled iframe.
 */
tiktokRecentRouter.get('/recent',async (_req,res)=>{
  res.set('Cache-Control','public, max-age=60, s-maxage=600');
  const token=process.env.TIKTOK_DISPLAY_ACCESS_TOKEN?.trim();
  if(!token)return res.json({enabled:false,profile:PROFILE,videos:[]});
  if(cache&&cache.expires>Date.now())return res.json({enabled:true,profile:PROFILE,videos:cache.videos});
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4500);
  try{
    const endpoint='https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url';
    const response=await fetch(endpoint,{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({max_count:4}),
      signal:controller.signal
    });
    if(!response.ok)throw Error('TikTok API returned HTTP '+response.status);
    const payload=await response.json() as {
      data?:{videos?:Array<{id?:string;title?:string;cover_image_url?:string;share_url?:string}>};
      error?:{code?:string};
    };
    if(payload.error?.code && payload.error.code!=='ok')throw Error('TikTok API returned '+payload.error.code);
    const raw=payload.data?.videos||[];
    const videos:PublicVideo[]=raw.flatMap(item=>{
      const id=String(item.id||'');
      const url=String(item.share_url||'');
      if(!/^\d{15,22}$/.test(id) || !VIDEO_RE.test(url))return [];
      const match=url.match(VIDEO_RE);
      if(match?.[1]!==id)return [];
      const cover=String(item.cover_image_url||'');
      return [{id,url,title:String(item.title||'Video mới từ QT Limousine').slice(0,100),
        cover:/^https:\/\//.test(cover)?cover:''}];
    }).slice(0,4);
    cache={expires:Date.now()+10*60_000,videos};
    return res.json({enabled:true,profile:PROFILE,videos});
  }catch(error){
    console.warn('TikTok recent videos unavailable',error instanceof Error?error.message:'unknown');
    return res.json({enabled:false,profile:PROFILE,videos:cache?.videos||[]});
  }finally{clearTimeout(timeout)}
});
