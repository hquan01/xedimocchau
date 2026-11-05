import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name=>readFileSync(new URL(name,import.meta.url),'utf8');
const app=read('../src/App.tsx');
const bridge=read('../src/components/LegacyGithubOperatorPanel.tsx');
const panel=read('../src/components/OperatorPanel.tsx');
test('Authenticated Admin opens the ORIGINAL full OperatorPanel, not generic JSON admin',()=>{
  assert.match(app,/LegacyGithubOperatorPanel/);
  assert.doesNotMatch(app,/<GithubOperatorPanel/);
  assert.match(bridge,/import OperatorPanel from '\.\/OperatorPanel'/);
  assert.match(bridge,/<OperatorPanel/);
  assert.match(bridge,/storageBackend="github"/);
});
test('Original nine-seat cabin layout, booking editing and route controls remain',()=>{
  for (const seat of ['A1','A2','A3','A4','A5','A6','A7','A8','A9'])assert.match(panel,new RegExp('number: "'+seat+'"'));
  for (const part of ['getBlockedItemForSeat','getOnlineBookingForSeat','handleSaveSeatEdit',
    'handleUnlockSeatDirect','renderSeatMapButton','handleOpenDepositModal',
    'handleSaveTripDriver','lockService','lockFrom','lockTo','lockDate','lockTime'])
    assert.ok(panel.includes(part),'Missing original function '+part);
});
test('Original specialist modules still render; GitHub mode uses server API for seat writes',()=>{
  const specialist=['ScheduleManagement','PricingManagement','CouponManagement',
    'DestinationManagement','ArticleManagement','RestaurantManagement','FlowerSeasonManagement',
    'TaxiFleetManagement','MotorbikeManagement','ServiceInquiryManagement',
    'ZaloCommunityManagement','SiteContentStudio'];
  for(const component of specialist)assert.match(panel,new RegExp('<'+component+'\\b'));
  assert.match(panel,/gh\.create\('blocked_seats'/);
  assert.match(panel,/gh\.remove\('blocked_seats'/);
  assert.match(panel,/gh\.patch\('bookings'/);
  assert.match(panel,/onRefreshBackend/);
});
