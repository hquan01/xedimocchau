import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {seal,unseal,checkCollection,checkId,cryptoKey,getDocument,putDocument,listDocuments,deleteDocument,StoreError} from '../src/server/githubOnly/githubStore.ts';

const key=randomBytes(32);
test('AES-256-GCM encrypts customer data and decrypts exactly',()=>{
  const secret={id:'bk_demo',passengerName:'Khách thử',passengerPhone:'0987654321',totalPrice:300000};
  const encoded=seal(secret,key);
  assert.ok(!encoded.includes('0987654321'));assert.ok(!encoded.includes('Khách thử'));
  assert.deepEqual(unseal(encoded,key),secret);
});
test('Wrong key or altered ciphertext fail closed',()=>{
  const encoded=seal({name:'Example'},key);
  assert.throws(()=>unseal(encoded,randomBytes(32)),StoreError);
  const corrupted=JSON.parse(encoded); corrupted.content='AAAA'+corrupted.content;
  assert.throws(()=>unseal(JSON.stringify(corrupted),key),StoreError);
});
test('ID and collections reject path traversal',()=>{
  assert.throws(()=>checkId('../../secrets'));
  assert.throws(()=>checkId('admin@example.com'));
  assert.throws(()=>checkCollection('not_allowed'));
  assert.equal(checkId('bk_123-abc'),'bk_123-abc');
});
test('Never permit unencrypted GitHub storage',()=>{
  const prior=process.env.GITHUB_DATA_ENCRYPTION_KEY;
  delete process.env.GITHUB_DATA_ENCRYPTION_KEY;
  try{assert.throws(cryptoKey,StoreError);}finally{if(prior===undefined)delete process.env.GITHUB_DATA_ENCRYPTION_KEY;else process.env.GITHUB_DATA_ENCRYPTION_KEY=prior;}
});
test('GitHub single-record optimistic save / list / read / delete',async()=>{
  const backup={fetch:globalThis.fetch,repo:process.env.GITHUB_DATA_REPO,token:process.env.GITHUB_DATA_TOKEN,branch:process.env.GITHUB_DATA_BRANCH,key:process.env.GITHUB_DATA_ENCRYPTION_KEY};
  process.env.GITHUB_DATA_REPO='example/data';process.env.GITHUB_DATA_TOKEN='test-only';process.env.GITHUB_DATA_BRANCH='test';process.env.GITHUB_DATA_ENCRYPTION_KEY=key.toString('base64');
  const records=new Map();let next=0;
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
  globalThis.fetch=async (url,options={})=>{
    const uri=new URL(url),rest=decodeURI(uri.pathname.split('/contents/')[1]||'');
    if(!rest)return reply(404,{message:'not found'});
    if(options.method==='PUT'){
      const input=JSON.parse(options.body);const prev=records.get(rest);
      if((prev&&!input.sha)||(prev&&input.sha!==prev.sha))return reply(409,{message:'conflict'});
      const sha='sha_'+(++next),text=Buffer.from(input.content,'base64').toString('utf8');
      records.set(rest,{sha,text});return reply(201,{content:{sha}});
    }
    if(options.method==='DELETE'){
      const input=JSON.parse(options.body),prev=records.get(rest);
      if(!prev||prev.sha!==input.sha)return reply(409,{message:'conflict'});
      records.delete(rest);return reply(200,{});
    }
    if(uri.pathname.includes('/contents/github-data/reviews')&&uri.pathname.endsWith('/reviews')){
      const files=[...records.entries()].map(([path,{sha}])=>({type:'file',name:path.split('/').at(-1),sha}));
      return reply(200,files);
    }
    const item=records.get(rest);
    return item?reply(200,{sha:item.sha,content:Buffer.from(item.text).toString('base64'),encoding:'base64'}):reply(404,{message:'not found'});
  };
  try{
    const a=await putDocument('reviews','review_1',{id:'review_1',name:'Demo',comment:'Works'});
    assert.equal(a.sha,'sha_1');
    const r=await getDocument('reviews','review_1');assert.equal(r.data.comment,'Works');
    await assert.rejects(putDocument('reviews','review_1',{id:'review_1',name:'Change'}),e=>e instanceof StoreError&&e.status===409);
    const b=await putDocument('reviews','review_1',{id:'review_1',name:'Changed'},r.sha);
    assert.equal(b.sha,'sha_2');
    const docs=await listDocuments('reviews');assert.equal(docs.length,1);assert.equal(docs[0].data.name,'Changed');
    await deleteDocument('reviews','review_1',b.sha);assert.equal(await getDocument('reviews','review_1'),null);
  }finally{
    globalThis.fetch=backup.fetch;
    for(const [k,v] of [['GITHUB_DATA_REPO',backup.repo],['GITHUB_DATA_TOKEN',backup.token],['GITHUB_DATA_BRANCH',backup.branch],['GITHUB_DATA_ENCRYPTION_KEY',backup.key]])if(v===undefined)delete process.env[k];else process.env[k]=v;
  }
});

test('GitHub rejects deleting a record that no longer exists instead of reporting false success',async()=>{
  const backup={fetch:globalThis.fetch,repo:process.env.GITHUB_DATA_REPO,token:process.env.GITHUB_DATA_TOKEN,branch:process.env.GITHUB_DATA_BRANCH,key:process.env.GITHUB_DATA_ENCRYPTION_KEY};
  process.env.GITHUB_DATA_REPO='example/data';process.env.GITHUB_DATA_TOKEN='test-only';process.env.GITHUB_DATA_BRANCH='main';process.env.GITHUB_DATA_ENCRYPTION_KEY=key.toString('base64');
  globalThis.fetch=async()=>new Response(JSON.stringify({message:'Not Found'}),{status:404,headers:{'content-type':'application/json'}});
  try{await assert.rejects(deleteDocument('guide_articles','guide_1','a-sha'),e=>e instanceof StoreError&&e.status===404);}
  finally{globalThis.fetch=backup.fetch;for(const [k,v] of [['GITHUB_DATA_REPO',backup.repo],['GITHUB_DATA_TOKEN',backup.token],['GITHUB_DATA_BRANCH',backup.branch],['GITHUB_DATA_ENCRYPTION_KEY',backup.key]])if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
