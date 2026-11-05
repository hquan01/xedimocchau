import type {JsonRecord} from './githubStore';
import {StoreError} from './githubStore.ts';

const positive=(v:unknown)=>Math.max(0,Math.floor(Number(v)||0));
export function quoteBooking(input:JsonRecord,user:JsonRecord|null,config:JsonRecord|null,coupons:JsonRecord[]){
  const booking={...input};
  const kind=String(booking.type||'');
  if(kind!=='limousine'&&kind!=='shared_car'){
    // Non-fixed routes / accommodation require a human quote.
    booking.pricingReviewRequired=true;
    booking.pointsDeducted=0;booking.discountAmount=0;booking.couponCode='';
    return {booking,updatedUser:null as JsonRecord|null,updatedCoupon:null as JsonRecord|null};
  }
  const count=positive(booking.seatCount)||Number(String((booking.seatNumbers as string[]|undefined)?.[0]||'').match(/^(\d+)/)?.[1]||0);
  if(count<1||count>(kind==='limousine'?9:6))throw new StoreError('Số chỗ đặt không hợp lệ cho loại xe.',400);
  const date=String(booking.travelDate||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new StoreError('Ngày đi không hợp lệ.',400);
  const weekday=new Date(date+'T12:00:00Z').getUTCDay();
  const weekend=weekday===0||weekday===5||weekday===6;
  const cfg=(config||{}) as Record<string,unknown>;
  const base=Number(cfg.weekendPriceStandard)|| (kind==='limousine'?300000:350000);
  const discount=Number(cfg.weekdayDiscountPercentage??10);
  if(!Number.isFinite(base)||base<0||discount<0||discount>100)throw new StoreError('Chưa có bảng giá vé hợp lệ.',503);
  const unit=weekend?base:Math.round(base*(1-discount/100));
  const original=count*unit;
  const previous=user?Math.max(
    Array.isArray(user.rewardedBookingIds)?user.rewardedBookingIds.length:0,
    positive(user.completedBookingsCount)
  ):0;
  const eligible=previous>=1;
  const requestedCoupon=String(input.couponCode||'').trim().toUpperCase();
  let coupon:JsonRecord|null=null;
  let couponDiscount=0;
  if(requestedCoupon){
    if(!eligible)throw new StoreError('Voucher chỉ dùng từ vé thứ hai, sau khi vé đầu được xác nhận.',403);
    coupon=coupons.find(x=>String(x.code||'').toUpperCase()===requestedCoupon) || null;
    if(!coupon||coupon.isActive===false||coupon.isPublished!==true)throw new StoreError('Mã giảm giá chưa được công bố hoặc không hợp lệ.',400);
    const validFrom=String(coupon.validFrom||''),validUntil=String(coupon.validUntil||'');
    if((validFrom&&date<validFrom)||(validUntil&&date>validUntil))throw new StoreError('Voucher chưa có hiệu lực vào ngày đi.',400);
    const usage=positive(coupon.usageCount),limit=positive(coupon.usageLimit);
    if(limit>0&&usage>=limit)throw new StoreError('Mã giảm giá đã hết lượt sử dụng.',409);
    if(Array.isArray(user?.usedCoupons)&&user?.usedCoupons.includes(requestedCoupon))
      throw new StoreError('Mã giảm giá đã được dùng trên tài khoản này.',409);
    if(coupon.audience && coupon.audience!=='all') {
      // Gender/age/birthday/assigned cohorts need a fully verified entitlement
      // rather than trusting a client-sent coupon code.
      const target=String(coupon.audience);
      if(target==='male'||target==='female'){
        if(user?.gender!==target)throw new StoreError('Voucher không áp dụng cho hội viên này.',403);
      }else if(target==='random'){
        if(!Array.isArray(coupon.assignedUserIds)||!coupon.assignedUserIds.includes(user?.id))throw new StoreError('Voucher không áp dụng cho tài khoản này.',403);
      }else throw new StoreError('Voucher theo điều kiện cần xác minh thủ công.',403);
    }
    const percent=Number(coupon.discountPercentage)||0;
    if(percent<=0||percent>100)throw new StoreError('Giá trị voucher chưa hợp lệ.',400);
    couponDiscount=Math.round(original*percent/100);
  }
  const requestedPoints=positive(input.pointsDeducted);
  if(requestedPoints>0&&!eligible)throw new StoreError('Điểm chỉ được dùng từ lần đặt vé thứ hai.',403);
  if(requestedPoints>1000||requestedPoints>positive(user?.points))throw new StoreError('Không đủ điểm thưởng để áp dụng.',409);
  // The maximum usable point discount cannot exceed the fare after coupon.
  const usedPoints=Math.min(requestedPoints,Math.ceil(Math.max(0,original-couponDiscount)/1000));
  const pointsDiscount=usedPoints*1000;
  const final=Math.max(0,original-couponDiscount-pointsDiscount);
  booking.seatCount=count;booking.totalPrice=final;booking.depositAmount=Math.ceil(final/2);
  booking.discountAmount=couponDiscount+pointsDiscount;
  booking.pointsDeducted=usedPoints;
  booking.couponCode=coupon?requestedCoupon:'';
  booking.couponId=coupon?coupon.id:'';
  booking.pricingReviewRequired=false;
  let updatedUser:JsonRecord|null=null,updatedCoupon:JsonRecord|null=null;
  if(user&&(usedPoints>0||coupon)){
    updatedUser={...user,points:positive(user.points)-usedPoints};
    if(coupon)updatedUser.usedCoupons=[...(Array.isArray(user.usedCoupons)?user.usedCoupons:[]),requestedCoupon];
  }
  if(coupon)updatedCoupon={...coupon,usageCount:positive(coupon.usageCount)+1};
  return {booking,updatedUser,updatedCoupon};
}
