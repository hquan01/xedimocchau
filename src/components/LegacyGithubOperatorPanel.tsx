import {useCallback,useEffect,useState} from 'react';
import OperatorPanel from './OperatorPanel';
import LegacyContentMigration from './LegacyContentMigration';
import {gh} from '../client/githubApi';
import {DEFAULT_LIMOUSINE_CONFIG,DEFAULT_SHARED_CAR_CONFIG} from '../data/config';
import type {Booking,BlockedSeat,Coupon,LimousineConfig,SharedCarConfig,LocationPoint,TourCombo,Accommodation,Destination,GuideArticle,User,AppNotification,Driver,ZaloGroup} from '../types';

/**
 * IMPORTANT: Reuse the complete original OperatorPanel, including the 9-seat
 * interactive cabin, route/date selectors, original booking panels and CMS.
 * This bridge deliberately does not replace specialist screens with JSON tables.
 *
 * GitHub-only backend is still in migration: do not promote this Preview to
 * Production before all embedded modules are connected and content is imported.
 */
type Data = {
  bookings:Booking[];users:User[];blockedSeats:BlockedSeat[];combos:TourCombo[];
  accommodations:Accommodation[];destinations:Destination[];articles:GuideArticle[];
  coupons:Coupon[];locations:LocationPoint[];drivers:Driver[];zaloGroups:ZaloGroup[];
  notifications:AppNotification[];limousineConfig:LimousineConfig;sharedCarConfig:SharedCarConfig;
};
const empty:Data={
  bookings:[],users:[],blockedSeats:[],combos:[],accommodations:[],destinations:[],articles:[],
  coupons:[],locations:[],drivers:[],zaloGroups:[],notifications:[],
  limousineConfig:DEFAULT_LIMOUSINE_CONFIG,sharedCarConfig:DEFAULT_SHARED_CAR_CONFIG
};
const collections:Record<string,keyof Data>={
  bookings:'bookings',users:'users',blocked_seats:'blockedSeats',tour_combos:'combos',
  accommodations:'accommodations',destinations:'destinations',guide_articles:'articles',
  coupons:'coupons',drivers:'drivers',zalo_groups:'zaloGroups',notifications:'notifications'
};
function describeError(e:unknown){return e instanceof Error?e.message:String(e);}
function blockedId(x:BlockedSeat){return String((x as BlockedSeat&{id?:string}).id||[
  'lock',x.travelDate,x.tripId,x.seatId
].join('_').replace(/[^-\w]/g,'_'));}
export default function LegacyGithubOperatorPanel({onLogout}:{onLogout:()=>Promise<void>|void}){
  const [data,setData]=useState<Data>(empty);
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const load=useCallback(async()=>{
    setBusy(true);setError('');
    try{
      const keys=Object.keys(collections);
      const responses=await Promise.all(keys.map(async key=>{
        const response=await gh.list(key);
        return [key,response.items||[]] as const;
      }));
      const config=await Promise.all(['limousineConfig','sharedCarConfig','locations'].map(async id=>{
        try{return (await gh.get('configs',id)).item;}catch(e){
          // A missing config is normal for a new empty data repository.
          if(describeError(e).includes('404')||describeError(e).includes('Không tìm thấy'))return null;
          throw e;
        }
      }));
      const copy:Data={...empty};
      for(const [key,rows] of responses)(copy as any)[collections[key]]=rows;
      if(config[0]?.limousineConfig)copy.limousineConfig={...DEFAULT_LIMOUSINE_CONFIG,...config[0].limousineConfig};
      if(config[1]?.sharedCarConfig)copy.sharedCarConfig={...DEFAULT_SHARED_CAR_CONFIG,...config[1].sharedCarConfig};
      if(Array.isArray(config[2]?.locations))copy.locations=config[2].locations;
      setData(copy);setReady(true);
    }catch(e){setError('Không tải được dữ liệu GitHub. Không thay bằng dữ liệu giả: '+describeError(e));}
    finally{setBusy(false)}
  },[]);
  useEffect(()=>{void load()},[load]);
  const action=useCallback(async(fn:()=>Promise<unknown>)=>{
    try{await fn();await load();}
    catch(e){setError('Chưa lưu được GitHub: '+describeError(e));window.alert('Chưa lưu được. '+describeError(e));}
  },[load]);
  const syncList=useCallback(async<T extends {id:string}>(collection:string,prev:T[],next:T[])=>{
    // Per-record diff: never replace an entire customer/order collection.
    const before=new Map(prev.map(x=>[String(x.id),x]));
    const after=new Map(next.map(x=>[String(x.id),x]));
    for(const [id,row] of after){
      if(!before.has(id))await gh.create(collection,row);
      else if(JSON.stringify(row)!==JSON.stringify(before.get(id)))await gh.patch(collection,id,row);
    }
    for(const id of before.keys())if(!after.has(id))await gh.remove(collection,id);
  },[]);
  const saveConfig=useCallback(async(id:'limousineConfig'|'sharedCarConfig'|'locations',part:unknown)=>{
    const payload={id,[id]:part};
    try{await gh.patch('configs',id,payload)}catch(e){
      if(!describeError(e).includes('404')&&!describeError(e).includes('Không tìm thấy'))throw e;
      await gh.create('configs',payload);
    }
  },[]);
  const mutateList=<T extends {id:string}>(collection:string,previous:T[],next:T[])=>{
    void action(()=>syncList(collection,previous,next));
  };
  const toggleSeat=(seatId:string,travelDate:string,tripId:string,customerPhone?:string)=>{
    const old=data.blockedSeats.find(x=>x.seatId===seatId&&x.tripId===tripId&&x.travelDate===travelDate);
    if(old)void action(()=>gh.remove('blocked_seats',blockedId(old)));
    else void action(()=>gh.create('blocked_seats',{id:blockedId({seatId,travelDate,tripId}),seatId,travelDate,tripId,customerPhone:customerPhone||''}));
  };
  if(!ready) return <section className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 gap-4">
    <h1 className="font-black text-xl text-emerald-900">Đang tải bảng Quản trị gốc</h1>
    <p className="text-stone-600 text-center max-w-xl">{error||'Đang đọc dữ liệu thật từ GitHub. Không tự chèn dữ liệu mẫu hoặc xóa nội dung cũ.'}</p>
    <div className="flex gap-3">
      <button onClick={()=>void load()} className="rounded-xl bg-emerald-800 text-white px-4 py-2">Tải lại</button>
      <button onClick={()=>void onLogout()} className="rounded-xl border px-4 py-2">Đăng xuất</button>
    </div>
  </section>;
  return <div className="relative" data-admin-layout="original-operator">
    <div className="bg-emerald-950 text-white px-4 py-2 flex flex-wrap justify-end items-center gap-3 text-xs">
      <span className="opacity-75">Dữ liệu vận hành: GitHub (bản thử nghiệm)</span>
      <button type="button" disabled={busy} onClick={()=>{
        if(!window.confirm('Kiểm tra quyền ghi/đọc/xóa dữ liệu thử trên GitHub? Không ảnh hưởng khách hàng.'))return;
        setBusy(true);setError('');
        void gh.writeTest().then(r=>{if(r.ok&&r.read&&r.write&&r.delete)window.alert('Đã kiểm tra: thêm, đọc lại và xóa dữ liệu thử trên GitHub thành công.');else throw new Error('Kết quả không đầy đủ.')})
        .catch(e=>setError('Kiểm tra quyền ghi thất bại: '+describeError(e)))
        .finally(()=>setBusy(false));
      }} className="rounded-lg border border-white/40 px-3 py-1.5 hover:bg-white/10 disabled:opacity-50">Kiểm tra quyền lưu GitHub</button>
    </div>
    {error&&<div role="alert" className="sticky top-0 z-50 bg-red-50 text-red-900 border-b border-red-200 p-3 text-sm font-semibold">{error} <button className="underline ml-2" onClick={()=>setError('')}>Đóng</button></div>}
    {busy&&<div className="fixed bottom-5 left-5 bg-emerald-900 text-white text-xs px-4 py-2 rounded-xl z-50">Đang đồng bộ dữ liệu GitHub…</div>}
    <LegacyContentMigration onDone={load}/>
    <OperatorPanel
      storageBackend="github"
      onRefreshBackend={load}
      bookings={data.bookings} users={data.users} blockedSeats={data.blockedSeats}
      combos={data.combos} accommodations={data.accommodations}
      destinations={data.destinations} articles={data.articles}
      coupons={data.coupons} locations={data.locations}
      drivers={data.drivers} zaloGroups={data.zaloGroups}
      notifications={data.notifications}
      limousineConfig={data.limousineConfig} sharedCarConfig={data.sharedCarConfig}
      onUpdateBookingStatus={(id,status)=>{
        if(status==='success'&&!window.confirm('Bạn đã kiểm tra tài khoản ngân hàng và THỰC SỰ nhận cọc 50% chưa?'))return;
        void action(()=>gh.patch('bookings',id,{status}));
      }}
      onDeleteBooking={(id)=>{void action(()=>gh.remove('bookings',id))}}
      onBulkDeleteBookings={(ids)=>{void action(async()=>{for(const id of ids)await gh.remove('bookings',id)})}}
      onToggleBlockedSeat={toggleSeat}
      onRemoveBlockedSeat={(seat)=>{void action(()=>gh.remove('blocked_seats',blockedId(seat)))}}
      onUpdateCombos={updated=>mutateList('tour_combos',data.combos,updated)}
      onUpdateAccommodations={updated=>mutateList('accommodations',data.accommodations,updated)}
      onUpdateDestinations={updated=>mutateList('destinations',data.destinations,updated)}
      onUpdateArticles={updated=>mutateList('guide_articles',data.articles,updated)}
      onUpdateCoupons={updated=>mutateList('coupons',data.coupons,updated)}
      onUpdateDrivers={updated=>mutateList('drivers',data.drivers,updated)}
      onUpdateZaloGroups={updated=>mutateList('zalo_groups',data.zaloGroups,updated)}
      onUpdateNotifications={updated=>mutateList('notifications',data.notifications,updated)}
      onSendNotification={(title,message)=>{void action(()=>gh.create('notifications',{
        id:'admin_notif_'+Date.now(),title,message,timestamp:new Date().toISOString(),type:'admin_manual',isRead:false,deviceId:'all'
      }))}}
      onUpdateLimousineConfig={v=>{void action(()=>saveConfig('limousineConfig',v))}}
      onUpdateSharedCarConfig={v=>{void action(()=>saveConfig('sharedCarConfig',v))}}
      onUpdateLocations={v=>{void action(()=>saveConfig('locations',v))}}
    />
  </div>;
}
