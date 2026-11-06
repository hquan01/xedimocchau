import type {Booking} from '../types';

/**
 * Local-only history of bookings created on this browser.
 * This does NOT prove telephone ownership and MUST NOT be used as a server
 * authorization mechanism. Retrieving another device's history requires
 * authenticated account access (or a future verified OTP flow).
 */
export const DEVICE_BOOKING_HISTORY_KEY = 'qt_limousine_device_booking_history_v1';

export function normalizeBookingPhone(input:unknown):string {
  let digits=String(input||'').replace(/\D/g,'');
  if(digits.startsWith('0084'))digits='0'+digits.slice(4);
  else if(digits.startsWith('84'))digits='0'+digits.slice(2);
  return digits;
}
export function isCompleteBookingPhone(input:unknown):boolean {
  return /^0\d{9,10}$/.test(normalizeBookingPhone(input));
}

const HISTORY_LIMIT=75;

export function readDeviceBookingHistory():Booking[] {
  try {
    if(typeof window==='undefined')return [];
    const parsed:unknown=JSON.parse(window.localStorage.getItem(DEVICE_BOOKING_HISTORY_KEY)||'[]');
    if(!Array.isArray(parsed))return [];
    return parsed.filter((item):item is Booking=>{
      if(!item||typeof item!=='object')return false;
      const row=item as Partial<Booking>;
      return typeof row.id==='string'&&row.id.length>0&&
        typeof row.passengerPhone==='string'&&isCompleteBookingPhone(row.passengerPhone)&&
        typeof row.travelDate==='string';
    }).slice(0,HISTORY_LIMIT);
  } catch {return [];}
}

export function rememberDeviceBooking(booking:Booking):boolean {
  if(!booking?.id||!isCompleteBookingPhone(booking.passengerPhone))return false;
  // Save only the fields needed to display "Vé của tôi".
  // Avoid storing operator notes, bank information, driver contacts, or
  // arbitrary untrusted fields in a public browser's localStorage.
  const record:Booking = {
    id:booking.id,
    type:booking.type,
    bookingDate:booking.bookingDate,
    travelDate:booking.travelDate,
    returnDate:booking.returnDate,
    passengerName:booking.passengerName,
    passengerPhone:normalizeBookingPhone(booking.passengerPhone),
    passengerEmail:'',
    pickupPoint:booking.pickupPoint,
    dropoffPoint:booking.dropoffPoint,
    totalPrice:booking.totalPrice,
    depositAmount:booking.depositAmount,
    status:booking.status,
    seatNumbers:booking.seatNumbers,
    seatCount:booking.seatCount,
    departureTime:booking.departureTime,
    routeSelection:booking.routeSelection,
    comboId:booking.comboId,
    accommodationName:booking.accommodationName,
    roomTypeName:booking.roomTypeName,
    paymentReported:booking.paymentReported,
    pointsDeducted:booking.pointsDeducted
  };
  try{
    const rows=readDeviceBookingHistory().filter(row=>row.id!==record.id);
    window.localStorage.setItem(DEVICE_BOOKING_HISTORY_KEY,JSON.stringify([record,...rows].slice(0,HISTORY_LIMIT)));
    return true;
  }catch{return false;}
}

export function forgetDeviceBooking(id:string):void{
  try{
    window.localStorage.setItem(DEVICE_BOOKING_HISTORY_KEY,JSON.stringify(
      readDeviceBookingHistory().filter(item=>item.id!==id)
    ));
  }catch{/* Browser may disable persistent storage. */}
}

/**
 * Never perform a substring lookup against a global tickets collection.
 * First require a FULL phone match. Then use only tickets already attached
 * to this browser or to an authenticated user.
 */
export function findMyDeviceBookings(
  phoneInput:string,
  deviceHistory:Booking[],
  liveDeviceBookings:Booking[],
  accountBookings:Booking[],
  authenticatedUserId?:string
):Booking[]{
  if(!isCompleteBookingPhone(phoneInput))return [];
  const phone=normalizeBookingPhone(phoneInput);
  const mine=new Map<string,Booking>();
  for(const item of deviceHistory){
    if(normalizeBookingPhone(item.passengerPhone)===phone)mine.set(item.id,item);
  }
  const deviceIds=new Set(deviceHistory.map(row=>row.id));
  for(const item of liveDeviceBookings){
    if(normalizeBookingPhone(item.passengerPhone)!==phone)continue;
    // The liveDeviceBookings collection is already filtered by the device's
    // identity in useFirebaseSync. Requiring either a cached ID or trusted
    // session ownership prevents accidental broad searches.
    if(deviceIds.has(item.id)||(authenticatedUserId&&item.userId===authenticatedUserId)){
      mine.set(item.id,item);
    }
  }
  if(authenticatedUserId){
    for(const item of accountBookings){
      if(item.userId===authenticatedUserId&&normalizeBookingPhone(item.passengerPhone)===phone){
        mine.set(item.id,item);
      }
    }
  }
  return [...mine.values()].sort((a,b)=>{
    const left=String(a.travelDate||'')+' '+String(a.departureTime||'');
    const right=String(b.travelDate||'')+' '+String(b.departureTime||'');
    return right.localeCompare(left);
  });
}
