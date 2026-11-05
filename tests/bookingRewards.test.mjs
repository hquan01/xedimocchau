import test from 'node:test';
import assert from 'node:assert/strict';
import {applyBookingReward} from '../src/server/githubOnly/bookingRewards.ts';

test('New member starts with ten points, +1 exactly once when Admin confirms',()=>{
 const base={id:'u1',points:10,rewardedBookingIds:[],completedBookingsCount:0};
 const booked=applyBookingReward({id:'bk1',pointsDeducted:0},base,'bk1','pending');
 assert.equal(booked.changed,false);assert.equal(booked.profile.points,10);
 const confirmed=applyBookingReward(booked.booking,base,'bk1','success');
 assert.equal(confirmed.profile.points,11);
 assert.deepEqual(confirmed.profile.rewardedBookingIds,['bk1']);
 assert.equal(confirmed.profile.completedBookingsCount,1);
 const repeat=applyBookingReward(confirmed.booking,confirmed.profile,'bk1','success');
 assert.equal(repeat.changed,false);assert.equal(repeat.profile.points,11);
 const completed=applyBookingReward(repeat.booking,repeat.profile,'bk1','completed');
 assert.equal(completed.changed,false);assert.equal(completed.profile.points,11);
});

test('Cancelling a confirmed booking reverses exactly one point without double deduction',()=>{
 const approvedProfile={points:11,rewardedBookingIds:['bk1'],completedBookingsCount:1};
 const first=applyBookingReward({id:'bk1'},approvedProfile,'bk1','cancelled');
 assert.equal(first.profile.points,10);
 assert.deepEqual(first.profile.rewardedBookingIds,[]);
 assert.equal(first.profile.completedBookingsCount,0);
 const again=applyBookingReward(first.booking,first.profile,'bk1','cancelled');
 assert.equal(again.changed,false);assert.equal(again.profile.points,10);
});

test('Cancelled booking refunds previously spent points and voucher once',()=>{
 const base={points:3,rewardedBookingIds:['bk2'],usedCoupons:['SALE10'],completedBookingsCount:1};
 const bk={id:'bk2',pointsDeducted:4,pointsRefunded:false,couponCode:'sale10'};
 const once=applyBookingReward(bk,base,'bk2','cancelled');
 assert.equal(once.booking.pointsRefunded,true);
 assert.equal(once.profile.points,6); // 3 - 1 point confirmation + 4 spent
 assert.deepEqual(once.profile.usedCoupons,[]);
 const twice=applyBookingReward(once.booking,once.profile,'bk2','cancelled');
 assert.equal(twice.changed,false);assert.equal(twice.profile.points,6);
});

test('Reconfirmation after cancellation is counted once again',()=>{
 const base={points:10,rewardedBookingIds:[],completedBookingsCount:0};
 const again=applyBookingReward({id:'bk3'},base,'bk3','success');
 assert.equal(again.profile.points,11);
 assert.equal(again.profile.completedBookingsCount,1);
});
