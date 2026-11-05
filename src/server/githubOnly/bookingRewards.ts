/** Pure loyalty transition. Admin confirms the bank deposit manually.
 * No client can assign points or approve a booking.
 */
import type {JsonRecord} from './githubStore';

export function applyBookingReward(booking:JsonRecord,profile:JsonRecord,bookingId:string,nextStatus:string){
  const nextBooking={...booking};
  const wallet={...profile};
  const ids=Array.isArray(wallet.rewardedBookingIds)?wallet.rewardedBookingIds.map(String):[];
  const rewarded=ids.includes(bookingId);
  const confirmed=nextStatus==='success'||nextStatus==='completed';
  const cancelled=nextStatus==='cancelled';
  let changed=false;
  let nextIds=ids;
  let points=Math.max(0,Number(wallet.points)||0);
  if(confirmed&&!rewarded){nextIds=[...ids,bookingId];points+=1;changed=true;}
  if(cancelled&&rewarded){nextIds=ids.filter(v=>v!==bookingId);points=Math.max(0,points-1);changed=true;}
  if(cancelled&&!nextBooking.pointsRefunded&&Number(nextBooking.pointsDeducted||0)>0){
    points+=Math.max(0,Math.floor(Number(nextBooking.pointsDeducted)||0));
    nextBooking.pointsRefunded=true;changed=true;
  }
  if(cancelled&&typeof nextBooking.couponCode==='string'&&nextBooking.couponCode){
    const used=Array.isArray(wallet.usedCoupons)?wallet.usedCoupons as string[]:[];
    const code=nextBooking.couponCode.toUpperCase();
    if(used.includes(code)){wallet.usedCoupons=used.filter(v=>v!==code);changed=true;}
  }
  if(changed){
    wallet.points=points;
    wallet.rewardedBookingIds=nextIds;
    wallet.completedBookingsCount=nextIds.length;
  }
  return {booking:nextBooking,profile:wallet,changed};
}
