import {doc, getDoc, onSnapshot, setDoc, serverTimestamp} from 'firebase/firestore';
import {getStorage, ref, uploadBytesResumable, getDownloadURL} from 'firebase/storage';
import {auth, db} from '../firebase';
import {hasOperatorAccess} from './simpleAuth';
import {useEffect,useState} from 'react';

export interface HomeTile {id:string; title:string; subtitle:string; icon:string; target:string; visible:boolean}
export interface HeroSlide {id:string; imageUrl:string; title:string; description:string; target:string; visible:boolean}
export interface FeaturedStory {id:string; title:string; description:string; imageUrl:string; label:string; target:string; visible:boolean}
export interface AttractionTicket {id:string; name:string; adultPrice:string; childPrice:string; note:string; sourceUrl:string; visible:boolean}
export interface SiteContent {
  siteName:string; tagline:string; logoUrl:string; heroImageUrl:string; heroTitle:string; heroDescription:string; heroTarget?:string; linkVersion?:number;
  hotline:string; zaloUrl:string; messengerUrl:string;
  tiles:HomeTile[]; stories:FeaturedStory[]; heroSlides?:HeroSlide[]; attractionTickets?:AttractionTicket[];
}
export const defaultSiteContent: SiteContent = {
  siteName:'MỘC CHÂU TRAVEL', tagline:'Cẩm nang & Dịch vụ du lịch Mộc Châu',
  logoUrl:'/brand-xedimocchau-header.png',heroImageUrl:'/mocchau-hero-v5.jpg',
  heroTitle:'Khám phá Mộc Châu',heroDescription:'Thiên nhiên Tây Bắc · Mùa hoa · Những trải nghiệm đáng nhớ',heroTarget:'article:guide-1',linkVersion:2,
  hotline:'0971050324',zaloUrl:'https://zalo.me/0971050324',messengerUrl:'https://m.me/1277673239073987',
  tiles:[
    {id:'weather',title:'Thời tiết',subtitle:'Mộc Châu hôm nay',icon:'cloud-sun',target:'moc_chau_today',visible:true},
    {id:'community',title:'Cộng đồng',subtitle:'Hỏi đáp · nhóm Zalo',icon:'users',target:'community',visible:true},
    {id:'planner',title:'Lịch trình AI',subtitle:'Gợi ý cá nhân',icon:'sparkles',target:'ai',visible:true},
    {id:'flower',title:'Mùa hoa',subtitle:'Đẹp theo mùa',icon:'flower',target:'moc_chau_today',visible:true},
    {id:'guide',title:'Cẩm nang',subtitle:'Kinh nghiệm hay',icon:'book-open',target:'guide',visible:true},
    {id:'destinations',title:'Địa điểm',subtitle:'Check-in đáng đi',icon:'map-pin',target:'explore_legacy',visible:true},
    {id:'hot',title:'Bài viết Hot',subtitle:'Đang quan tâm',icon:'flame',target:'hot',visible:true},
    {id:'limousine',title:'QT Limousine',subtitle:'Hà Nội – Mộc Châu',icon:'bus',target:'limousine',visible:true},
    {id:'taxi',title:'Taxi du lịch',subtitle:'4 · 7 · 9 · 16 chỗ',icon:'car',target:'services',visible:true},
    {id:'motorbike',title:'Thuê xe máy',subtitle:'Khám phá tự do',icon:'bike',target:'motorbike',visible:true},
    {id:'stay',title:'Lưu trú',subtitle:'Homestay · Khách sạn',icon:'home',target:'services',visible:true},
    {id:'food',title:'Ăn uống',subtitle:'Đặc sản · Nhà hàng',icon:'utensils',target:'services',visible:true},
    {id:'tour',title:'Giá vé tham quan',subtitle:'Điểm du lịch Mộc Châu',icon:'ticket',target:'ticket-prices',visible:true},
  ],
  // Price ranges are editorial references, not an online ticket-selling service.
  // Reviewed against public ticket pages in November 2026; recheck before travel.
  attractionTickets:[
    {id:'dai-yem',name:'Thác Dải Yếm',adultPrice:'80.000đ',childPrice:'30.000đ (cao 1m–1,3m)',note:'Vé tham quan thác; cầu kính Tình Yêu tính riêng. Trẻ dưới 1m miễn phí theo bảng giá tham khảo.',sourceUrl:'https://mocchaumoc.com/thac-dai-yem-cau-kinh-tinh-yeu/',visible:true},
    {id:'tinh-yeu',name:'Cầu kính Tình Yêu',adultPrice:'100.000đ',childPrice:'50.000đ (theo chiều cao)',note:'Nằm trong khu Thác Dải Yếm; vé riêng, không đồng nghĩa đã gồm vé thác.',sourceUrl:'https://mocchaumoc.com/thac-dai-yem-cau-kinh-tinh-yeu/',visible:true},
    {id:'ban-ang',name:'Rừng thông Bản Áng (Phoenix)',adultPrice:'80.000đ',childPrice:'Miễn phí dưới 1m',note:'Giá tham khảo cho vé tham quan; các dịch vụ trải nghiệm khác có thể thu phí riêng.',sourceUrl:'https://mocchaumoc.com/phoenix-rung-thong-ban-ang/',visible:true},
    {id:'happy-land',name:'Happy Land Mộc Châu',adultPrice:'100.000đ',childPrice:'Kiểm tra theo chiều cao',note:'Gói tham quan cơ bản đang được giới thiệu kèm một số trò chơi; chính sách trẻ em cần xác nhận tại điểm.',sourceUrl:'https://mocchaumoc.com/mua-ve/',visible:true},
    {id:'nang-tien',name:'Thác Nàng Tiên',adultPrice:'30.000đ',childPrice:'Liên hệ điểm tham quan',note:'Giá tham khảo; kiểm tra điều kiện thời tiết và giờ mở cửa trước khi đi.',sourceUrl:'https://mocchaumoc.com/mua-ve/',visible:true},
    {id:'bach-long',name:'Cầu kính Bạch Long – Mộc Châu Island',adultPrice:'650.000đ (Thứ 6–CN và ngày lễ)',childPrice:'350.000đ (cao 1m–1,4m)',note:'Theo bảng giá vé cuối tuần/ngày lễ của đơn vị vận hành; ngày thường và các combo có thể khác.',sourceUrl:'https://mocchauisland.com/en/orderTicket?ticket_type_id=4',visible:true}
  ],
  heroSlides:[
    {id:'flower',imageUrl:'/mocchau-flower-v5.jpg',title:'Mùa hoa Mộc Châu',description:'Tìm mùa hoa và thời điểm ngắm cảnh phù hợp',target:'article:guide-4',visible:true},
    {id:'tea',imageUrl:'/mocchau-tea-v5.jpg',title:'Những đồi chè xanh',description:'Điểm check-in và kinh nghiệm tham quan',target:'article:guide-2',visible:true},
    {id:'waterfall',imageUrl:'/mocchau-waterfall-v5.jpg',title:'Khám phá Thác Dải Yếm',description:'Địa điểm nổi bật tại Mộc Châu',target:'article:guide-2',visible:true}
  ],
  stories:[
    {id:'flower',title:'Mùa hoa mận Mộc Châu có gì đẹp?',description:'Thời điểm tham khảo, địa điểm ngắm hoa và lưu ý khi check-in.',imageUrl:'/mocchau-flower-v5.jpg',label:'Mùa hoa',target:'article:guide-4',visible:true},
    {id:'waterfall',title:'Thác Dải Yếm',description:'Một điểm tham quan nổi tiếng tại Mộc Châu.',imageUrl:'/mocchau-waterfall-v5.jpg',label:'Địa điểm',target:'article:guide-2',visible:true},
    {id:'tea',title:'Đồi chè Mộc Châu',description:'Đường đồi chè xanh và góc chụp đáng nhớ.',imageUrl:'/mocchau-tea-v5.jpg',label:'Đáng chú ý',target:'article:guide-2',visible:true},
    {id:'stay',title:'Homestay được quan tâm',description:'Xem danh sách lưu trú và tìm lựa chọn phù hợp.',imageUrl:'/mocchau-stay-v5.jpg',label:'Lưu trú',target:'services',visible:true}
  ]
};
export function useSiteContent(){
  const [content,setContent]=useState<SiteContent>(defaultSiteContent);
  const [error,setError]=useState('');
  useEffect(()=>onSnapshot(doc(db,'site_content','public'),snap=>{
    if(!snap.exists()) return;
    const raw=snap.data() as Partial<SiteContent>;
    setContent({...defaultSiteContent,...raw,
      logoUrl:raw.logoUrl === '/mocchau-logo-v4.png'
        ? '/brand-xedimocchau-header.png'
        : (raw.logoUrl || defaultSiteContent.logoUrl),
      linkVersion:raw.linkVersion??1,tiles:Array.isArray(raw.tiles)?raw.tiles:defaultSiteContent.tiles,stories:Array.isArray(raw.stories)?raw.stories:defaultSiteContent.stories,heroSlides:Array.isArray(raw.heroSlides)?raw.heroSlides:defaultSiteContent.heroSlides,attractionTickets:Array.isArray(raw.attractionTickets)?raw.attractionTickets:defaultSiteContent.attractionTickets});
    setError('');
  },e=>{console.warn('Public content defaults used',e);setError('Không tải được cấu hình; đang sử dụng nội dung mặc định.')}),[]);
  return {content,error};
}

/** A data URI is a restricted, size-capped fallback when Firebase Storage refuses uploads.
 * Photos remain in the published Firestore document and are not browser-only drafts.
 * Firebase documents have a hard 1 MiB limit, so reserve headroom for titles/metadata.
 */
const INLINE_IMAGE_MAX_CHARS = 170_000;
const PUBLISHED_CONFIG_MAX_BYTES = 850_000;
const embeddedImage = (url:string) =>
  /^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(url) &&
  url.length <= INLINE_IMAGE_MAX_CHARS;
const safeImageSource = (url:string) => url.startsWith('/') ||
  /^https:\/\//i.test(url) || embeddedImage(url);

async function requireContentEditor(){
  const user=auth.currentUser;
  if(!user)throw new Error('Vui lòng đăng nhập tài khoản quản trị.');
  const token=await user.getIdTokenResult(true);
  if(hasOperatorAccess(token))return user;
  // Firestore rules also allow operators granted through their users/{uid}
  // document; they may not have a custom claim in Firebase Storage yet.
  const ownProfile=await getDoc(doc(db,'users',user.uid));
  const role=ownProfile.data()?.role;
  if(role==='operator'||role==='admin')return user;
  throw new Error('Tài khoản chưa được cấp quyền quản trị Firebase.');
}

export async function publishSiteContent(content:SiteContent){
  const user=await requireContentEditor();
  const allImages=[content.logoUrl,content.heroImageUrl,
    ...content.stories.map(x=>x.imageUrl),
    ...(content.heroSlides||[]).map(x=>x.imageUrl)];
  if(allImages.some(src=>src && !safeImageSource(src)) ||
    content.attractionTickets?.some(x=>x.sourceUrl&&!/^https:\/\//i.test(x.sourceUrl))){
    throw new Error('Ảnh phải là đường dẫn nội bộ, HTTPS hoặc ảnh đã tải từ thiết bị.');
  }
  const bytes=new TextEncoder().encode(JSON.stringify(content)).byteLength;
  if(bytes>PUBLISHED_CONFIG_MAX_BYTES){
    throw new Error('Bản nháp chứa quá nhiều ảnh nhúng. Hãy dùng ảnh nhỏ hơn hoặc liên kết ảnh HTTPS cho một số banner trước khi xuất bản.');
  }
  await setDoc(doc(db,'site_content','public'),{...content,linkVersion:2,updatedAt:serverTimestamp(),updatedBy:user.uid});
}

// Every image stage is bounded. A rejected Storage request or a hanging
// refresh must not leave the admin upload control spinning indefinitely.
const IMAGE_READ_TIMEOUT_MS = 8_000;
const STORAGE_UPLOAD_TIMEOUT_MS = 8_000;
const STORAGE_URL_TIMEOUT_MS = 4_000;
function deadline<T>(work:Promise<T>,timeoutMs:number,message:string):Promise<T>{
  return new Promise<T>((resolve,reject)=>{
    const timer=globalThis.setTimeout(()=>reject(new Error(message)),timeoutMs);
    work.then(
      value=>{clearTimeout(timer);resolve(value)},
      error=>{clearTimeout(timer);reject(error)}
    );
  });
}

async function makeCompactImage(file:File):Promise<string>{
  const objectUrl=URL.createObjectURL(file);
  try{
    const image=new Image();
    image.src=objectUrl;
    await deadline(image.decode(),IMAGE_READ_TIMEOUT_MS,'Ảnh không phản hồi khi xử lý. Vui lòng chọn ảnh JPG hoặc WebP khác.');
    if(!image.naturalWidth||!image.naturalHeight)throw new Error('Không thể đọc ảnh. Vui lòng chọn ảnh khác.');
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    // Work on a bounded canvas, never the original huge smartphone photo.
    // Generate a Firestore-compatible preview before touching the network.
    for(const width of [1300,1050,850,650,500]){
      const scale=Math.min(1,width/image.naturalWidth,750/image.naturalHeight);
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      for(const quality of [0.82,0.70,0.54,0.38]){
        const data=canvas.toDataURL('image/webp',quality);
        if(embeddedImage(data))return data;
      }
    }
    throw new Error('Ảnh có quá nhiều chi tiết để nén an toàn. Hãy chọn ảnh JPG/WebP dung lượng nhỏ hơn.');
  }finally{URL.revokeObjectURL(objectUrl)}
}

async function storeImageWithDeadline(file:File,compact:string):Promise<string>{
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-70);
  const storagePath=`site-media/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName}`;
  const location=ref(getStorage(),storagePath);
  const uploadFile=file.size<=5*1024*1024 ? file : await (async()=>{
    const blob=await(await fetch(compact)).blob();
    return new File([blob],safeName+'.webp',{type:'image/webp'});
  })();
  const task=uploadBytesResumable(location,uploadFile,{contentType:uploadFile.type});
  await new Promise<void>((resolve,reject)=>{
    let finished=false;
    const settle=(error?:Error)=>{
      if(finished)return;
      finished=true;
      clearTimeout(timer);
      if(error)reject(error);else resolve();
    };
    const timer=setTimeout(()=>{
      task.cancel();
      settle(new Error('Firebase Storage không phản hồi trong thời gian cho phép.'));
    },STORAGE_UPLOAD_TIMEOUT_MS);
    task.on('state_changed',undefined,error=>settle(error),()=>settle());
  });
  return deadline(getDownloadURL(location),STORAGE_URL_TIMEOUT_MS,'Không thể lấy liên kết ảnh từ Storage.');
}

/**
 * Returns a usable URL even if Firebase Storage rejects or stalls.
 * The callback is a local preview only; publishing is still an explicit action.
 */
export async function uploadSiteImage(file:File,onLocalPreview?:(dataUrl:string)=>void):Promise<string>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))
    throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
  if(file.size>15*1024*1024)
    throw new Error('Ảnh lớn hơn 15 MB. Vui lòng nén ảnh trước khi tải.');
  // Save the real customer-supplied image locally before any network request;
  // never block the preview on a token refresh or Storage upload.
  const compact=await makeCompactImage(file);
  onLocalPreview?.(compact);

  if(!auth.currentUser){
    // The publish button checks Firebase editor permissions and reports errors.
    return compact;
  }
  try{
    return await storeImageWithDeadline(file,compact);
  }catch(error){
    // The compact version can still be published to Firestore under the
    // existing document-size budget, so no photo is silently discarded.
    console.warn('Firebase Storage unavailable, using the compressed image preview instead.',error);
    return compact;
  }
}
