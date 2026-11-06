export type EngagementType='view'|'like'|'save'|'share'|'booking_click';
export interface EngagementStat{view:number;like:number;save:number;share:number;booking_click:number}
export type ContentStats=Record<string,EngagementStat>;
export interface MetricsSnapshot{enabled:boolean;periodDays:number;stats:ContentStats}
export const EMPTY_METRICS:MetricsSnapshot={enabled:false,periodDays:30,stats:{}};

export async function getContentMetrics(days=30):Promise<MetricsSnapshot>{
  try{
    const response=await fetch(`/api/content/engagement?days=${days}`,{credentials:'same-origin'});
    if(!response.ok)return {...EMPTY_METRICS,periodDays:days};
    const payload=await response.json() as MetricsSnapshot;
    if(!payload||!payload.enabled||!payload.stats||typeof payload.stats!=='object')return {...EMPTY_METRICS,periodDays:days};
    return {enabled:true,periodDays:days,stats:payload.stats};
  }catch{return {...EMPTY_METRICS,periodDays:days}}
}

export function trackContentEvent(articleId:string,event:EngagementType){
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(articleId))return;
  const body=JSON.stringify({articleId,event});
  try{
    if(navigator.sendBeacon){
      navigator.sendBeacon('/api/content/engagement',new Blob([body],{type:'application/json'}));
      return;
    }
    void fetch('/api/content/engagement',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
  }catch{/* Metrics are optional: never affect reading or booking. */}
}

/** Only use verifiable server counters. Old seeded demo counts are NOT
 * a source of truth and must never determine top/trending articles. */
export function trendingScore(stats:EngagementStat|undefined){
  if(!stats)return 0;
  const n=(key:keyof EngagementStat)=>Math.min(100000,Math.max(0,Number(stats[key])||0));
  return n('view')+n('like')*3+n('save')*5+n('share')*6+n('booking_click')*8;
}
