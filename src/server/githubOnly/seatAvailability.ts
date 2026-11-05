import type {JsonRecord} from './githubStore';

function compact(v:unknown){return String(v||'').trim().toLocaleLowerCase('vi-VN').replace(/\s+/g,' ');}
function route(v:unknown){
 const text=compact(v).replace(/[➔→➡—–]/g,'-').replace(/\s*-\s*/g,'-');
 // Same route selection can be serialized with arrows, dashes or extra spaces.
 return text;
}
function seats(v:unknown){return Array.isArray(v)?v.map(x=>compact(x).toUpperCase()).filter(Boolean):[];}
function explicitSeats(v:unknown){
 return seats(v).filter(x=>/^(A[1-9]|B[1-3]|C[1-2])$/.test(x));
}
function countSeats(record:JsonRecord){
 const declared=Number(record.seatCount||0);
 if(Number.isInteger(declared)&&declared>0)return declared;
 const explicit=explicitSeats(record.seatNumbers);
 if(explicit.length)return explicit.length;
 const text=seats(record.seatNumbers)[0]||'';
 const parsed=Number(text.match(/^(\d+)\s*CHỖ/)?.[1]);
 return Number.isInteger(parsed)&&parsed>0?parsed:0;
}
function lockSeat(lock:JsonRecord,kind:string){
 const key=compact(lock.seatId);
 const number=Number(key.replace(/^s/,''));
 if(!Number.isInteger(number)||number<1)return key.toUpperCase();
 if(kind==='shared_car')return ['','A1','B1','B2','B3','C1','C2'][number]||'';
 return 'A'+number;
}
function sameJourney(a:JsonRecord,b:JsonRecord){
 return compact(a.type)===compact(b.type)&&compact(a.travelDate)===compact(b.travelDate)
 &&compact(a.departureTime)===compact(b.departureTime)&&route(a.routeSelection)===route(b.routeSelection);
}
export function seatConflict(incoming:JsonRecord,others:JsonRecord[],locks:JsonRecord[]){
 const kind=String(incoming.type||'');
 if(!['limousine','shared_car'].includes(kind))return null;
 const cap=kind==='shared_car'?6:9;
 const selected=countSeats(incoming);
 if(!selected||selected>cap)return 'Số chỗ đặt phải từ 1 đến '+cap+'.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(incoming.travelDate||''))||!/^\d{1,2}:\d{2}$/.test(String(incoming.departureTime||''))||route(incoming.routeSelection).length<5)
   return 'Vui lòng chọn tuyến, ngày và giờ khởi hành hợp lệ.';
 const reserved=others.filter(b=>b.id!==incoming.id&&compact(b.status)!=='cancelled'&&sameJourney(incoming,b));
 const assigned=explicitSeats(incoming.seatNumbers);
 for(const prior of reserved){
   const taken=explicitSeats(prior.seatNumbers);
   const duplicate=assigned.find(x=>taken.includes(x));
   if(duplicate)return 'Ghế '+duplicate+' đã có người giữ hoặc đặt trên chuyến này.';
 }
 const time=String(incoming.departureTime).replace(':','_');
 const tripId=kind==='shared_car'?'shared_car_trip_custom_'+time:'trip_custom_'+time;
 const matchingLocks=locks.filter(lock=>{
   if(compact(lock.travelDate)!==compact(incoming.travelDate)||compact(lock.tripId)!==compact(tripId))return false;
   const from=compact(lock.routeFrom);
   return !from||route(incoming.routeSelection).startsWith(from);
 });
 for(const lock of matchingLocks){
   const id=lockSeat(lock,kind);
   if(assigned.includes(id))return 'Ghế '+id+' đang được chủ xe khóa offline.';
 }
 const locked=new Set(matchingLocks.map(lock=>lockSeat(lock,kind)));
 // A booked explicit seat may also appear in an out-of-date offline hold;
 // count the physical seat once.
 const usedExplicit=new Set(reserved.flatMap(x=>explicitSeats(x.seatNumbers)));
 const holds=[...locked].filter(x=>!usedExplicit.has(x)).length;
 const taken=reserved.reduce((sum,x)=>sum+countSeats(x),0);
 if(taken+holds+selected>cap)return 'Chuyến chỉ còn '+Math.max(0,cap-taken-holds)+' chỗ trống. Vui lòng giảm số ghế hoặc chọn giờ khác.';
 return null;
}
