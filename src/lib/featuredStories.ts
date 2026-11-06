import type {GuideArticle} from '../types';
import type {FeaturedStory, SiteContent} from './siteContent';
import {trendingScore, type MetricsSnapshot} from './growthMetrics';
export interface DisplayStory extends FeaturedStory {pinned?:boolean;trending?:boolean}
function fromArticle(article:GuideArticle):DisplayStory{
  return {id:'article-'+article.id,title:article.title,description:article.excerpt,
    imageUrl:article.imageUrl||'',label:article.categoryLabel||'Cẩm nang',
    target:'article:'+article.id,visible:true};
}
function pinIsActive(until:string|undefined){
  if(!until)return true;
  const end=Date.parse(until+'T23:59:59+07:00');
  return Number.isFinite(end)&&end>=Date.now();
}
/** Only server-verifiable metrics can choose trending stories.
 * Current demo counters embedded in INITIAL_ARTICLES are intentionally excluded. */
export function selectFeaturedStories(content:SiteContent,articles:GuideArticle[],metrics:MetricsSnapshot):DisplayStory[]{
  const manual:DisplayStory[]=content.stories.filter(x=>x.visible);
  const mode=content.featuredMode||'hybrid';
  if(mode==='manual')return manual;
  const articleById=new Map(articles.map(a=>[a.id,a]));
  let pinned:DisplayStory|undefined;
  if(mode==='hybrid'&&content.featuredPinTarget&&pinIsActive(content.featuredPinUntil)){
    const target=content.featuredPinTarget;
    if(target.startsWith('story:'))pinned=manual.find(x=>x.id===target.slice(6));
    if(target.startsWith('article:')){
      const a=articleById.get(target.slice(8));
      if(a)pinned=fromArticle(a);
    }
  }
  const output:DisplayStory[]=[];
  const add=(story:DisplayStory|undefined)=>{
    if(!story||output.length>=4)return;
    const target=story.target;
    if(output.some(x=>x.target===target||x.id===story.id))return;
    output.push(story);
  };
  if(pinned)add({...pinned,pinned:true});
  const ranked=metrics.enabled?articles.map(article=>({article,score:trendingScore(metrics.stats[article.id])}))
    .filter(row=>row.score>0).sort((a,b)=>b.score-a.score):[];
  const occupied=new Set<string>();
  for(const row of ranked){
    if(output.length>=4)break;
    if(occupied.has(row.article.category))continue;
    const before=output.length;add({...fromArticle(row.article),trending:true});
    if(output.length>before)occupied.add(row.article.category);
  }
  for(const row of ranked)if(output.length<4)add({...fromArticle(row.article),trending:true});
  // Newly launched sites have no reliable metrics. Use existing hand-curated
  // cards rather than inventing engagement or choosing from seeded demo views.
  for(const row of manual)if(output.length<4)add(row);
  return output;
}
