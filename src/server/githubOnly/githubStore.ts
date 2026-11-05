/**
 * GitHub-backed encrypted document store (server-side only).
 * No secret, access token or plaintext customer record may be sent to a browser
 * or committed to the public source-code repository.
 *
 * WARNING: GitHub is not a transactional database. The content API uses per-file
 * optimistic concurrency; the APIs below surface conflicts instead of lying
 * about a successful write. Use an actual database for high-volume booking.
 */
import {createCipheriv, createDecipheriv, randomBytes, createHash} from 'node:crypto';

export type JsonRecord = Record<string, unknown>;
export class StoreError extends Error {
  status:number;
  constructor(message:string, status = 500) {super(message); this.status=status; this.name='StoreError';}
}

const COLLECTIONS = new Set([
  'users','bookings','reviews','tour_combos','accommodations','guide_articles',
  'coupons','destinations','restaurants','flower_seasons','partners',
  'taxi_fleet','taxi_requests','motorbike_fleet','motorbike_requests',
  'ai_faqs','blocked_seats','configs','notifications','zalo_groups',
  'community_posts','site_content','service_requests','drivers',
  'security_audit','commissions','debts'
]);
export const PUBLIC_COLLECTIONS = new Set([
  'reviews','tour_combos','accommodations','guide_articles','coupons','destinations',
  'restaurants','flower_seasons','partners','taxi_fleet','motorbike_fleet',
  'ai_faqs','zalo_groups','site_content'
]);
export function checkCollection(name: string) {
  if (!COLLECTIONS.has(name)) throw new StoreError('Danh mục dữ liệu không hợp lệ.',400);
  return name;
}
export function checkId(id:string) {
  if (typeof id !== 'string' || !/^[\w-]{1,128}$/.test(id)) throw new StoreError('Mã dữ liệu không hợp lệ.',400);
  return id;
}

export function cryptoKey() {
  const value=process.env.GITHUB_DATA_ENCRYPTION_KEY || '';
  const key=Buffer.from(value,'base64');
  if (key.length!==32) throw new StoreError('Chưa cấu hình khóa mã hóa dữ liệu 32-byte. Không cho phép ghi dữ liệu chưa mã hóa.',503);
  return key;
}
export function seal(value:JsonRecord,key:Buffer):string {
  const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm',key,iv);
  const bytes=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return JSON.stringify({version:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),content:bytes.toString('base64')});
}
export function unseal(text:string,key:Buffer):JsonRecord {
  let obj:any;
  try {
    obj=JSON.parse(text);
    if(obj?.version!==1) throw new Error('wrong version');
    const decrypt=createDecipheriv('aes-256-gcm',key,Buffer.from(obj.iv,'base64'));
    decrypt.setAuthTag(Buffer.from(obj.tag,'base64'));
    const result=JSON.parse(Buffer.concat([decrypt.update(Buffer.from(obj.content,'base64')),decrypt.final()]).toString('utf8'));
    if(!result||typeof result!=='object'||Array.isArray(result)) throw new Error('invalid record');
    return result;
  } catch {throw new StoreError('Dữ liệu GitHub không đọc được hoặc khóa giải mã sai.',503);}
}

interface GithubConfig {owner:string;repo:string;branch:string;token:string;key:Buffer}
export function githubConfig():GithubConfig {
  const repo=process.env.GITHUB_DATA_REPO || '';
  const [owner,name,...extra]=repo.split('/');
  const branch=process.env.GITHUB_DATA_BRANCH || 'main';
  const token=process.env.GITHUB_DATA_TOKEN || '';
  if(!owner||!name||extra.length||!token||!/^[-\w/.]+$/.test(branch))
    throw new StoreError('Cần cấu hình GITHUB_DATA_REPO, GITHUB_DATA_BRANCH và GITHUB_DATA_TOKEN trên Vercel.',503);
  return {owner,repo:name,branch,token,key:cryptoKey()};
}
const filename=(collection:string,id:string)=>`github-data/${checkCollection(collection)}/${checkId(id)}.enc.json`;
const api=({owner,repo}:GithubConfig,route:string)=>`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${route}`;

async function request(c:GithubConfig,route:string,method='GET',payload?:unknown) {
  let response:Response;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try {
    response=await fetch(api(c,route), {
      method,signal:controller.signal,
      headers:{'Authorization':`Bearer ${c.token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(payload?{'Content-Type':'application/json'}:{})},
      ...(payload?{body:JSON.stringify(payload)}:{})
    });
  }catch {throw new StoreError('Không thể kết nối GitHub, thao tác chưa được lưu.',503);}
  finally{clearTimeout(timer)}
  if(response.status===404) {
    if(method==='GET') return {status:404,data:null};
    throw new StoreError('Không tìm thấy bản ghi trên GitHub, thao tác chưa được thực hiện.',404);
  }
  if(response.status===409||response.status===422) throw new StoreError('Dữ liệu vừa được cập nhật bởi phiên khác, vui lòng tải lại và thử lại.',409);
  if(response.status===401||response.status===403) throw new StoreError('GitHub từ chối quyền truy cập hoặc đã hết hạn mức API. Kiểm tra token và repository.',503);
  if(!response.ok) throw new StoreError(`GitHub API HTTP ${response.status}: không thể lưu/đọc dữ liệu.`,503);
  const data=await response.json() as any;
  return {status:response.status,data};
}
export interface StoredDoc {id:string;data:JsonRecord;sha:string}
export async function getDocument(collection:string,id:string):Promise<StoredDoc|null> {
  const c=githubConfig(),file=filename(collection,id);
  const r=await request(c,`/contents/${file}?ref=${encodeURIComponent(c.branch)}`);
  if(r.status===404) return null;
  const payload=r.data;
  if(!payload || !payload.content || payload.encoding!=='base64') throw new StoreError('Tệp dữ liệu GitHub không hợp lệ.',503);
  const value=unseal(Buffer.from(payload.content.replace(/\s/g,''),'base64').toString('utf8'),c.key);
  return {id,data:value,sha:payload.sha};
}
export async function listDocuments(collection:string,maximum=300):Promise<StoredDoc[]> {
  const c=githubConfig(),path=`github-data/${checkCollection(collection)}`;
  const list=await request(c,`/contents/${path}?ref=${encodeURIComponent(c.branch)}`);
  if(list.status===404) return [];
  if(!Array.isArray(list.data)) throw new StoreError('Danh mục trên GitHub không phải thư mục.',503);
  const items=list.data.filter((f:any)=>f.type==='file'&&/^[-\w]+\.enc\.json$/.test(f.name));
  if(items.length>maximum) throw new StoreError('Số bản ghi vượt giới hạn xem một lần. Cần phân trang.',413);
  const results:StoredDoc[]=[];
  // Bound parallelism so a page load does not exhaust GitHub's API quota.
  for(let i=0;i<items.length;i+=5) {
    const group=await Promise.all(items.slice(i,i+5).map(async (item:any)=>{
      const id=item.name.slice(0,-'.enc.json'.length);
      return getDocument(collection,id);
    }));
    for(const record of group) if(record)results.push(record);
  }
  return results;
}
export async function putDocument(collection:string,id:string,value:JsonRecord,expectedSha?:string|null) {
  const c=githubConfig(),file=filename(collection,id);
  const content=Buffer.from(seal(value,c.key),'utf8').toString('base64');
  const result=await request(c,`/contents/${file}`,'PUT',{
    message:`data: update ${collection} ${createHash('sha256').update(id).digest('hex').slice(0,10)}`,
    content,branch:c.branch,...(expectedSha?{sha:expectedSha}:{})
  });
  return {sha:result.data.content?.sha||''};
}
export async function deleteDocument(collection:string,id:string,expectedSha:string) {
  const c=githubConfig(),file=filename(collection,id);
  await request(c,`/contents/${file}`,'DELETE',{
    message:`data: delete ${collection} ${createHash('sha256').update(id).digest('hex').slice(0,10)}`,
    sha:expectedSha,branch:c.branch
  });
}
/** Validate token, repository and selected branch, not merely the presence of env vars. */
export async function verifyStoreConnectivity(){
  const c=githubConfig();
  const r=await request(c,`/branches/${encodeURIComponent(c.branch)}`);
  if(r.status===404)throw new StoreError('Không tìm thấy repository/nhánh lưu dữ liệu GitHub.',503);
  return true;
}
export function isStoreConfigured() {
  try {githubConfig();return true;}catch{return false;}
}

/** Atomic replacement of one collection via a single Git commit on its data branch.
 * This is only atomic inside Git history, not a substitute for database constraints.
 * A competing writer causes ref update to fail and we retry from the new head.
 */
export async function replaceDocuments(collection:string,records:JsonRecord[]) {
  checkCollection(collection);
  if(!Array.isArray(records)||records.length>250)throw new StoreError('Một lần thay thế tối đa 250 bản ghi.',413);
  const keys=new Set<string>();
  for(const record of records) {
    if(!record||typeof record!=='object'||Array.isArray(record))throw new StoreError('Bản ghi không hợp lệ.',400);
    const id=checkId(String(record.id||''));
    if(keys.has(id))throw new StoreError('Danh sách có mã trùng.',400);
    keys.add(id);
  }
  const c=githubConfig(),folder=`github-data/${collection}`;
  for(let attempt=0;attempt<3;attempt++) {
    const head=await request(c,`/git/ref/heads/${encodeURIComponent(c.branch)}`);
    if(head.status===404)throw new StoreError('Chưa có nhánh GitHub lưu dữ liệu.',503);
    const headSha=head.data.object?.sha;
    const base=await request(c,`/git/commits/${headSha}`);
    const current=await request(c,`/contents/${folder}?ref=${encodeURIComponent(c.branch)}`);
    const existing=new Set<string>((Array.isArray(current.data)?current.data:[]).filter((x:any)=>x.type==='file').map((x:any)=>x.name));
    const entries:any[]=[];
    for(const record of records) {
      const name=`${record.id}.enc.json`;
      existing.delete(name);
      entries.push({path:`${folder}/${name}`,mode:'100644',type:'blob',content:seal(record,c.key)});
    }
    for(const name of existing)if(/^[-\w]+\.enc\.json$/.test(name))entries.push({path:`${folder}/${name}`,mode:'100644',type:'blob',sha:null});
    if(!entries.length)return {changed:0};
    const tree=await request(c,'/git/trees','POST',{base_tree:base.data.tree.sha,tree:entries});
    const commit=await request(c,'/git/commits','POST',{message:`data: replace ${collection}`,tree:tree.data.sha,parents:[headSha]});
    try {
      await request(c,`/git/refs/heads/${encodeURIComponent(c.branch)}`,'PATCH',{sha:commit.data.sha,force:false});
      return {changed:entries.length};
    }catch(error){if(!(error instanceof StoreError)||error.status!==409||attempt===2)throw error;}
  }
  throw new StoreError('Dữ liệu bị cập nhật đồng thời quá nhiều lần, vui lòng thử lại.',409);
}

export type WriteChange={collection:string;id:string;record:JsonRecord|null};
/** One Git commit with multiple encrypted records. Rejected if data branch moves. */
export async function atomicWrite(changes:WriteChange[]) {
  if(!changes.length||changes.length>15)throw new StoreError('Giao dịch vượt giới hạn.',413);
  const c=githubConfig();
  const head=await request(c,`/git/ref/heads/${encodeURIComponent(c.branch)}`);
  if(head.status===404)throw new StoreError('Chưa có nhánh dữ liệu GitHub.',503);
  const sha=head.data.object?.sha;
  const base=await request(c,`/git/commits/${sha}`);
  const tree=changes.map(item=>({
    path:filename(item.collection,item.id),mode:'100644',type:'blob',
    ...(item.record===null?{sha:null}:{content:seal(item.record,c.key)})
  }));
  const newTree=await request(c,'/git/trees','POST',{base_tree:base.data.tree.sha,tree});
  const commit=await request(c,'/git/commits','POST',{
    message:`data: transaction ${changes.map(x=>x.collection).join(',')}`,
    tree:newTree.data.sha,parents:[sha]
  });
  await request(c,`/git/refs/heads/${encodeURIComponent(c.branch)}`,'PATCH',{sha:commit.data.sha,force:false});
  return {ok:true};
}
