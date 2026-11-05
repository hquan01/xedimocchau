import {createHash,randomUUID} from 'node:crypto';
import {Router as expressRouter,type Request, type Response,type Router} from 'express';
import {checkCollection,checkId,githubConfig,getDocument,listDocuments,putDocument,deleteDocument,replaceDocuments,atomicWrite,PUBLIC_COLLECTIONS,StoreError,isStoreConfigured,verifyStoreConnectivity,type JsonRecord} from './githubStore';
import {authMiddleware,requireAdmin} from './githubAuth';
import {applyBookingReward} from './bookingRewards';
import {seatConflict} from './seatAvailability';
const GUEST_COOKIE='qt_guest';
const COOKIE_OPTIONS={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:180*86400000};
function getGuestCookie(req:Request){return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${GUEST_COOKIE}=`))?.slice(GUEST_COOKIE.length+1);}
function ensureGuestCookie(req:Request,res:Response){
  let cookie=getGuestCookie(req);
  if(!cookie||!/^[-\w]{20,120}$/.test(cookie)) {cookie=randomUUID().replace(/-/g,'')+randomUUID().replace(/-/g,'');res.cookie(GUEST_COOKIE,cookie,COOKIE_OPTIONS);}
  return createHash('sha256').update(cookie).digest('hex');
}
const forRead=(req:Request,collection:string,id?:string) => {
  if(req.identity?.role==='operator')return true;
  if(PUBLIC_COLLECTIONS.has(collection))return true;
  if(collection==='configs')return id?['limousineConfig','sharedCarConfig','locations'].includes(id):false;
  if(collection==='users')return !!id && id===req.identity?.uid;
  if(collection==='bookings'||collection==='service_requests')return true; // Filter each record below
  if(collection==='notifications')return !!req.identity;
  return false;
};
function owned(req:Request,record:JsonRecord) {
  if(req.identity?.role==='operator')return true;
  if(req.identity?.uid && String(record.userId||record.customerUid||'')===req.identity.uid)return true;
  const token=getGuestCookie(req);
  const ownHash=token?createHash('sha256').update(token).digest('hex'):'';
  return !!ownHash && record.guestHash===ownHash;
}
function safeRecord(collection:string,data:JsonRecord,req:Request) {
  const value={...data};
  for(const secret of ['passwordHash','customPassword','passwordResetToDefault','resetToken','sessionToken','otpSecret','totpSecret','guestHash'])delete value[secret];
  if(collection==='users'&&req.identity?.role!=='operator')delete value.operatorNotes;
  return value;
}
function mayReadRecord(req:Request,collection:string,record:JsonRecord) {
  if(collection==='bookings'||collection==='service_requests')return owned(req,record);
  if(collection==='reviews'&&record.moderationStatus==='pending'&&req.identity?.role!=='operator')return false;
  if(collection==='users')return req.identity?.role==='operator'||req.identity?.uid===record.id;
  if(collection==='notifications')return req.identity?.role==='operator'||record.userId===req.identity?.uid;
  return true;
}
function requireObject(value:any){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new StoreError('Dữ liệu JSON phải là đối tượng.',400);
  if(JSON.stringify(value).length>60000)throw new StoreError('Bản ghi vượt dung lượng cho phép.',413);
  return value as JsonRecord;
}
const validateBooking=(v:JsonRecord)=>{
  if(typeof v.passengerName!=='string'||v.passengerName.trim().length<2||typeof v.passengerPhone!=='string'||!/^(0|\+84)[35789]\d{8}$/.test(v.passengerPhone.replace(/[\s.-]/g,''))||typeof v.travelDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.travelDate))
    throw new StoreError('Thiếu thông tin đặt vé hợp lệ.',400);
  if(!['limousine','shared_car','combo','private_charter','charter'].includes(String(v.type||'')))throw new StoreError('Loại vé không hợp lệ.',400);
  if(!Number.isFinite(Number(v.totalPrice))||Number(v.totalPrice)<0)throw new StoreError('Giá vé không hợp lệ.',400);
};
export function githubDataRouter():Router {
  const r=expressRouter();
  r.use(authMiddleware);
  // Cookie-based sessions must never be accepted for cross-origin mutations.
  r.use((req,res,next)=>{
    if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
    const origin=req.headers.origin;
    const host=req.headers.host;
    if(origin){
      try {if(new URL(origin).host!==host)return next(new StoreError('Yêu cầu khác nguồn gốc bị từ chối.',403));}
      catch{return next(new StoreError('Origin không hợp lệ.',403));}
    }else if(req.headers['sec-fetch-site']==='cross-site')return next(new StoreError('Yêu cầu khác trang bị từ chối.',403));
    next();
  });
  r.post('/_write-test',async(req,res,next)=>{
    try{
      requireAdmin(req);
      const id='probe_'+randomUUID().replace(/-/g,'');
      const sample={id,kind:'connection_test',createdAt:new Date().toISOString()};
      let stored=false;
      try {
        await putDocument('security_audit',id,sample);
        stored=true;
        const found=await getDocument('security_audit',id);
        if(!found||found.data.kind!=='connection_test')throw new StoreError('Đã ghi nhưng không đọc lại được dữ liệu GitHub.',503);
        await deleteDocument('security_audit',id,found.sha);
        stored=false;
      }finally{
        if(stored){
          // Best-effort cleanup of harmless encrypted temporary diagnostic record.
          try{const latest=await getDocument('security_audit',id);if(latest)await deleteDocument('security_audit',id,latest.sha);}catch{}
        }
      }
      res.setHeader('Cache-Control','no-store');
      res.json({ok:true,read:true,write:true,delete:true,storage:'github-encrypted'});
    }catch(e){next(e);}
  });
  r.get('/status',async(_req,res)=>{
    if(!isStoreConfigured())return res.status(503).json({configured:false,provider:'github-encrypted',firebase:false,error:'Thiếu cấu hình GitHub trên Vercel.'});
    try{await verifyStoreConnectivity();return res.json({configured:true,provider:'github-encrypted',firebase:false});}
    catch(e){return res.status(503).json({configured:false,provider:'github-encrypted',firebase:false,error:e instanceof Error?e.message:'GitHub không thể kết nối'});}
  });
  r.get('/:collection',async(req,res,next)=>{
    try {
      const collection=checkCollection(req.params.collection);
      if(!forRead(req,collection))throw new StoreError('Không có quyền xem danh sách.',403);
      const documents=await listDocuments(collection);
      res.setHeader('Cache-Control','no-store');
      const filtered=documents.filter(x=>mayReadRecord(req,collection,x.data));
      res.json({items:filtered.map(x=>safeRecord(collection,x.data,req))});
    }catch(e){next(e);}
  });
  r.get('/:collection/:id',async(req,res,next)=>{
    try {
      const collection=checkCollection(req.params.collection),id=checkId(req.params.id);
      if(!forRead(req,collection,id))throw new StoreError('Không có quyền xem dữ liệu.',403);
      const found=await getDocument(collection,id);
      if(!found)throw new StoreError('Không tìm thấy dữ liệu.',404);
      if(!mayReadRecord(req,collection,found.data))throw new StoreError('Không có quyền xem dữ liệu.',403);
      res.setHeader('Cache-Control','no-store');
      res.json({item:safeRecord(collection,found.data,req),version:found.sha});
    }catch(e){next(e);}
  });
  r.post('/:collection',async(req,res,next)=>{
    try {
      const collection=checkCollection(req.params.collection),value=requireObject(req.body);
      if(!['bookings','service_requests','reviews','community_posts'].includes(collection))requireAdmin(req);
      // Guest-supplied IDs must never become public Git paths (could contain a phone).
      const id=checkId(String(req.identity?.role==='operator'?value.id||'id_'+randomUUID().replace(/-/g,''):'id_'+randomUUID().replace(/-/g,'')));
      if(await getDocument(collection,id))throw new StoreError('Mã đã tồn tại.',409);
      const data:JsonRecord={...value,id};
      if(req.identity?.role!=='operator'){
        if(collection==='bookings'){
          validateBooking(data);
          // Client totals are never authoritative for payment/discount decisions.
          data.status='pending';data.paymentReported=false;data.paymentReportedAt=null;
          data.userId=req.identity?.uid||'';
          data.guestHash=ensureGuestCookie(req,res);
          data.pointsDeducted=0;data.couponCode='';data.couponId='';data.discountAmount=0;
          data.pricingReviewRequired=true;
        }else if(collection==='service_requests'){
          if(typeof data.customerName!=='string'||typeof data.customerPhone!=='string')throw new StoreError('Thiếu thông tin yêu cầu.',400);
          data.status='pending';data.customerUid=req.identity?.uid||'';data.guestHash=ensureGuestCookie(req,res);
          data.quotedPrice=0;data.createdAt=new Date().toISOString();
        }else if(collection==='reviews'||collection==='community_posts'){
          // Low-trust public content is flagged for review, never published automatically.
          if(JSON.stringify(data).length>6000)throw new StoreError('Nội dung quá dài.',413);
          data.moderationStatus='pending';
        }
      }
      if(collection==='bookings' && ['limousine','shared_car'].includes(String(data.type))) {
        // Create with a branch-CAS commit: concurrent customers must not
        // silently be given the same seat on the same journey.
        for(let attempt=0;attempt<3;attempt++){
          const [bookings,locks]=await Promise.all([listDocuments('bookings'),listDocuments('blocked_seats')]);
          const collision=seatConflict(data,bookings.map(b=>b.data),locks.map(b=>b.data));
          if(collision)throw new StoreError(collision,409);
          try{
            await atomicWrite([{collection:'bookings',id,record:data}]);
            return res.status(201).json({item:safeRecord(collection,data,req)});
          }catch(error){
            if(!(error instanceof StoreError)||error.status!==409||attempt===2)throw error;
          }
        }
        throw new StoreError('Chỗ ngồi vừa được thay đổi, vui lòng tải lại.',409);
      }
      await putDocument(collection,id,data);
      res.status(201).json({item:safeRecord(collection,data,req)});
    }catch(e){next(e);}
  });
  r.patch('/:collection/:id',async(req,res,next)=>{
    try {
      const collection=checkCollection(req.params.collection),id=checkId(req.params.id),patch=requireObject(req.body);
      const current=await getDocument(collection,id);
      if(!current)throw new StoreError('Không tìm thấy bản ghi.',404);
      let changes=patch;
      if(req.identity?.role!=='operator'){
        if(collection==='bookings'&&owned(req,current.data)) {
          // Customer merely reports transfer. Only Admin can confirm payment or change status.
          if(Object.keys(patch).length<1||Object.keys(patch).some(x=>!['paymentReported'].includes(x))||patch.paymentReported!==true)
            throw new StoreError('Khách chỉ có thể thông báo đã chuyển cọc, không thể tự duyệt vé.',403);
          changes={paymentReported:true,paymentReportedAt:new Date().toISOString()};
        }else if(collection==='users'&&req.identity?.uid===id){
          const allowed=new Set(['name','phone','gender','birthDate','address','favPickup','favDropoff','avatarDataUrl']);
          if(Object.keys(patch).some(x=>!allowed.has(x)))throw new StoreError('Không thể tự thay đổi quyền hoặc điểm thưởng.',403);
        }else throw new StoreError('Không có quyền sửa dữ liệu.',403);
      }
      const nextRecord={...current.data,...changes,id};
      if(collection==='bookings'&&req.identity?.role==='operator'&&Object.hasOwn(patch,'status')){
        const nextStatus=String(patch.status);
        if(!['pending','success','completed','cancelled'].includes(nextStatus))throw new StoreError('Trạng thái vé không hợp lệ.',400);
        // A single branch-CAS commit updates the booking and the member wallet.
        // Repeated confirmation never adds a duplicate point. Cancellation reverses
        // one prior point and restores previously spent points exactly once.
        for(let retry=0;retry<3;retry++){
          const latest=await getDocument('bookings',id);
          if(!latest)throw new StoreError('Đơn đặt vé không còn tồn tại.',409);
          const booking:JsonRecord={...latest.data,...changes,id};
          const uid=String(latest.data.userId||'');
          const tx:{collection:string,id:string,record:JsonRecord|null}[]=[{collection:'bookings',id,record:booking}];
          if(uid) {
            const currentProfile=await getDocument('users',uid);
            if(currentProfile) {
              const reward=applyBookingReward(booking,currentProfile.data,id,nextStatus);
              Object.assign(booking,reward.booking);
              if(reward.changed)tx.push({collection:'users',id:uid,record:reward.profile});
            }
          }
          try{await atomicWrite(tx);return res.json({ok:true});}
          catch(e){if(!(e instanceof StoreError)||e.status!==409||retry===2)throw e;}
        }
      }
      await putDocument(collection,id,nextRecord,current.sha);
      res.json({ok:true});
    }catch(e){next(e);}
  });
  r.delete('/:collection/:id',async(req,res,next)=>{
    try {
      requireAdmin(req);
      const collection=checkCollection(req.params.collection),id=checkId(req.params.id);
      const current=await getDocument(collection,id);
      if(!current)throw new StoreError('Không tìm thấy bản ghi.',404);
      await deleteDocument(collection,id,current.sha);
      res.json({ok:true});
    }catch(e){next(e);}
  });
  r.put('/:collection/_replace',async(req,res,next)=>{
    try {
      requireAdmin(req);
      const collection=checkCollection(req.params.collection),records=req.body?.items;
      if(!Array.isArray(records))throw new StoreError('Thiếu danh sách bản ghi.',400);
      // Collection replacement is restricted to CMS / inventory, not user, order or finance data.
      if(!PUBLIC_COLLECTIONS.has(collection)||['coupons'].includes(collection))throw new StoreError('Không được thay toàn bộ dữ liệu nhạy cảm.',403);
      const changed=await replaceDocuments(collection,records.map(requireObject));
      res.json({ok:true,...changed});
    }catch(e){next(e);}
  });
  return r;
}
