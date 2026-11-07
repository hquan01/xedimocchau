import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POINT_VALUE_VND, rewardPointsForBooking, creditedPointsForBooking,
  rewardPointChange, eligibleForNextBookingReward
} from '../src/lib/loyalty.ts';

test('10 booked limousine seats earn 10 points, not one order point',()=>{
  const booking={type:'limousine',seatCount:10,seatNumbers:['10 chỗ Limousine']};
  assert.equal(rewardPointsForBooking(booking),10);
  assert.deepEqual(rewardPointChange(booking,'success',false),{award:10,reverse:0});
  assert.deepEqual(rewardPointChange({...booking,rewardPointsAwarded:10},'completed',true),{award:0,reverse:0});
});
test('shared-car booking counts seats even when represented by one label',()=>{
  assert.equal(rewardPointsForBooking({type:'shared_car',seatCount:8,seatNumbers:['8 chỗ Xe ghép']}),8);
  assert.equal(rewardPointsForBooking({type:'shared_car',seatNumbers:['10 chỗ Xe ghép']}),10);
});
test('combo counts each paid passenger seat, without counting return trip twice',()=>{
  assert.equal(rewardPointsForBooking({type:'combo',seatNumbers:['Ghế 3','Ghế 4','Ghế 5','Ghế 6']}),4);
});
test('one passenger earns one point; invalid or unqualified vehicle reservations earn none',()=>{
  assert.equal(rewardPointsForBooking({type:'limousine',seatCount:1,seatNumbers:['1 chỗ Limousine']}),1);
  assert.equal(rewardPointsForBooking({type:'private_charter',seatCount:11}),0);
  assert.equal(rewardPointsForBooking({type:'limousine',seatCount:0,seatNumbers:[]}),0);
  assert.equal(rewardPointsForBooking({type:'shared_car',seatCount:9.5,seatNumbers:[]}),0);
});
test('cancellation or reset to pending reverses exactly the original award, once',()=>{
  const original={type:'limousine',seatCount:10,seatNumbers:['10 chỗ Limousine'],rewardPointsAwarded:10};
  assert.deepEqual(rewardPointChange(original,'cancelled',true),{award:0,reverse:10});
  assert.deepEqual(rewardPointChange(original,'pending',true),{award:0,reverse:10});
  assert.deepEqual(rewardPointChange({...original,rewardPointsAwarded:0},'cancelled',false),{award:0,reverse:0});
});
test('editing seat quantity after reward does not grant extra points or inflate refund',()=>{
  const booking={type:'limousine',seatCount:16,seatNumbers:['16 chỗ Limousine'],rewardPointsAwarded:10};
  assert.deepEqual(rewardPointChange(booking,'success',true),{award:0,reverse:0});
  assert.equal(creditedPointsForBooking(booking),10);
  assert.deepEqual(rewardPointChange(booking,'cancelled',true),{award:0,reverse:10});
});
test('legacy +1 orders remain +1 on reversal, not retroactively +10',()=>{
  const old={type:'limousine',seatCount:10,seatNumbers:['10 chỗ Limousine']};
  assert.equal(creditedPointsForBooking(old),1);
  assert.deepEqual(rewardPointChange(old,'cancelled',true),{award:0,reverse:1});
});
test('welcome bonus and redemption from second confirmed booking are unchanged',()=>{
  assert.equal(POINT_VALUE_VND,1000);
  assert.equal(eligibleForNextBookingReward({id:'member',role:'customer',phone:'',name:'',points:10,rewardedBookingIds:[]}),false);
  assert.equal(eligibleForNextBookingReward({id:'member',role:'customer',phone:'',name:'',points:20,rewardedBookingIds:['order1']}),true);
});
