import type {JsonRecord} from './githubStore';

function compact(v:unknown){return String(v||'').trim().toLocaleLowerCase('vi-VN').replace(/\s+/g,' ');}
function seats(v:unknown){return Array.isArray(v)?v.map(x=>compact(x).toUpperCase()).filter(Boolean):[];}
function lockSeat(lock:JsonRecord,kind:string){
 const key=compact(lock.seatId);
 const number=Number(key.replace(/^s/,''));
 if(!Number.isInteger(number)||number<1)return key.toUpperCase();
 if(kind==='shared_car')return ['','A1','B1','B2','B3','C1','C2'][number]||'';
 return 'A'+number;
}
export function seatConflict(incoming:JsonRecord,others:JsonRecord[],locks:JsonRecord[]){
 const bookingKind=String(incoming.type||'');
 if(!['limousine','shared_car'].includes(bookingKind))return null;
 const assigned=seats(incoming.seatNumbers);
 if(assigned.length===0)return null; // Charter or unspecified seat counts need manual review.
 const date=compact(incoming.travelDate),time=compact(incoming.departureTime),route=compact(incoming.routeSelection);
 for(const prior of others){
   if(prior.id===incoming.id||compact(prior.status)==='cancelled')continue;
   if(compact(prior.type)!==bookingKind||compact(prior.travelDate)!==date||compact(prior.departureTime)!==time||compact(prior.routeSelection)!==route)continue;
   const taken=seats(prior.seatNumbers);
   const duplicate=assigned.find(x=>taken.includes(x));
   if(duplicate)return 'Ghế '+duplicate+' đã có người giữ hoặc đặt trên chuyến này.';
 }
 const token=time.replace(':','_');
 const expectedTripId=bookingKind==='limousine'?'trip_custom_'+token:'shared_car_trip_custom_'+token;
 for(const lock of locks){
   if(compact(lock.travelDate)!==date||compact(lock.tripId)!==compact(expectedTripId))continue;
   const from=compact(lock.routeFrom);
   if(from&&route&&!route.startsWith(from))continue;
   const id=lockSeat(lock,bookingKind);
   if(assigned.includes(id))return 'Ghế '+id+' đang được chủ xe khóa offline.';
 }
 return null;
}
