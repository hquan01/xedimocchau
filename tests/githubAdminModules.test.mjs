import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GITHUB_ADMIN_MODULES} from '../src/components/operator/githubAdminModules.ts';
import {checkCollection} from '../src/server/githubOnly/githubStore.ts';

const menuText=readFileSync(new URL('../src/components/operator/AdminNavStructure.ts',import.meta.url),'utf8');
const ids=[...menuText.matchAll(/^\s+id: "([\w_]+)",\s*$/gm)].map(m=>m[1]).filter(id=>!['ops_transport','travel_ecosystem','content_community','tech_live_data','partners_finance'].includes(id));

test('All admin navigation modules have GitHub-backed screens',()=>{
 const missing=ids.filter(id=>!(id in GITHUB_ADMIN_MODULES));
 assert.deepEqual(missing,[],'Menu items without a functional GitHub data screen');
 assert.ok(ids.length>=20);
 for(const [name,sections] of Object.entries(GITHUB_ADMIN_MODULES)){
   for(const section of sections){
      assert.equal(checkCollection(section.collection),section.collection,`Unexpected invalid collection for ${name}`);
   }
 }
});

test('Bookings, customer profiles, and public content stay in separate collections',()=>{
 assert.equal(GITHUB_ADMIN_MODULES.limousine_bookings[0].collection,'bookings');
 assert.equal(GITHUB_ADMIN_MODULES.limousine_customers[0].collection,'users');
 assert.equal(GITHUB_ADMIN_MODULES.articles_guide[0].collection,'guide_articles');
 assert.equal(GITHUB_ADMIN_MODULES.destinations[0].collection,'destinations');
 assert.equal(GITHUB_ADMIN_MODULES.site_appearance[0].collection,'site_content');
 assert.equal(GITHUB_ADMIN_MODULES.commissions_debt.length,2);
});
