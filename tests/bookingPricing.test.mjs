import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteBooking} from '../src/server/githubOnly/bookingPricing.ts';

const trip={type:'limousine',seatCount:2,seatNumbers:['2 chỗ Limousine'],travelDate:'2026-11-07',departureTime:'08:00',routeSelection:'Hà Nội ➔ Mộc Châu',couponCode:'',pointsDeducted:0,totalPrice:1};
const config={weekendPriceStandard:300000,weekdayDiscountPercentage:10};

test('Server ignores client price, computes 50 percent deposit, no automatic payment confirmation',()=>{
 const q=quoteBooking(trip,null,config,[]);
 assert.equal(q.booking.totalPrice,600000);
 assert.equal(q.booking.depositAmount,300000);
 assert.equal(q.booking.pricingReviewRequired,false);
 assert.equal(q.updatedUser,null);
});
test('Fresh account receives ten welcome points but cannot redeem on first booking',()=>{
 const member={id:'m',points:10,rewardedBookingIds:[],completedBookingsCount:0};
 assert.throws(()=>quoteBooking({...trip,pointsDeducted:10},member,config,[]),/lần đặt vé thứ hai/);
});
test('Second booking can redeem points, never more than wallet balance',()=>{
 const member={id:'m',points:11,rewardedBookingIds:['old'],completedBookingsCount:1};
 const q=quoteBooking({...trip,pointsDeducted:11},member,config,[]);
 assert.equal(q.booking.totalPrice,589000);
 assert.equal(q.booking.depositAmount,294500);
 assert.equal(q.updatedUser.points,0);
 assert.throws(()=>quoteBooking({...trip,pointsDeducted:12},member,config,[]),/Không đủ điểm/);
});
test('Published voucher is accepted only after first confirmed booking',()=>{
 const coupon={id:'v1',code:'QT10',isPublished:true,isActive:true,discountPercentage:10,usageCount:0};
 const member={id:'m',points:10,rewardedBookingIds:['old'],completedBookingsCount:1};
 const q=quoteBooking({...trip,couponCode:'qt10'},member,config,[coupon]);
 assert.equal(q.booking.totalPrice,540000);
 assert.equal(q.updatedCoupon.usageCount,1);
 assert.deepEqual(q.updatedUser.usedCoupons,['QT10']);
 assert.throws(()=>quoteBooking({...trip,couponCode:'QT10'},{...member,rewardedBookingIds:[],completedBookingsCount:0},config,[coupon]),/vé thứ hai/);
});
test('Do not allow unpublished vouchers, expired codes or overselling',()=>{
 const member={id:'m',points:10,rewardedBookingIds:['old'],completedBookingsCount:1};
 const c={id:'v1',code:'QT10',isPublished:false,isActive:true,discountPercentage:10};
 assert.throws(()=>quoteBooking({...trip,couponCode:'QT10'},member,config,[c]),/chưa được công bố/);
 assert.throws(()=>quoteBooking({...trip,seatCount:12},member,config,[]),/Số chỗ/);
});
