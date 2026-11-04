import {doc, onSnapshot, setDoc, serverTimestamp} from 'firebase/firestore';
import {getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {auth, db} from '../firebase';
import {useEffect,useState} from 'react';

export interface HomeTile {id:string; title:string; subtitle:string; icon:string; target:string; visible:boolean}
export interface FeaturedStory {id:string; title:string; description:string; imageUrl:string; label:string; target:string; visible:boolean}
export interface SiteContent {
  siteName:string; tagline:string; logoUrl:string; heroImageUrl:string; heroTitle:string; heroDescription:string;
  hotline:string; zaloUrl:string; messengerUrl:string;
  tiles:HomeTile[]; stories:FeaturedStory[];
}
export const defaultSiteContent: SiteContent = {
  siteName:'MỘC CHÂU TRAVEL', tagline:'Cẩm nang & Dịch vụ du lịch Mộc Châu',
  logoUrl:'/mocchau-logo-v4.png',heroImageUrl:'/mocchau-hero-v5.jpg',
  heroTitle:'Khám phá Mộc Châu',heroDescription:'Thiên nhiên Tây Bắc · Mùa hoa · Những trải nghiệm đáng nhớ',
  hotline:'0971050324',zaloUrl:'https://zalo.me/0971050324',messengerUrl:'https://m.me/1277673239073987',
  tiles:[
    {id:'weather',title:'Thời tiết',subtitle:'Mộc Châu hôm nay',icon:'cloud-sun',target:'moc_chau_today',visible:true},
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
    {id:'tour',title:'Tour & Combo',subtitle:'Trải nghiệm trọn gói',icon:'ticket',target:'services',visible:true},
  ],
  stories:[
    {id:'flower',title:'Mùa hoa mận Mộc Châu có gì đẹp?',description:'Thời điểm tham khảo, địa điểm ngắm hoa và lưu ý khi check-in.',imageUrl:'/mocchau-flower-v5.jpg',label:'Mùa hoa',target:'moc_chau_today',visible:true},
    {id:'waterfall',title:'Thác Dải Yếm',description:'Một điểm tham quan nổi tiếng tại Mộc Châu.',imageUrl:'/mocchau-waterfall-v5.jpg',label:'Địa điểm',target:'explore_legacy',visible:true},
    {id:'tea',title:'Đồi chè Mộc Châu',description:'Đường đồi chè xanh và góc chụp đáng nhớ.',imageUrl:'/mocchau-tea-v5.jpg',label:'Đáng chú ý',target:'explore_legacy',visible:true},
    {id:'stay',title:'Homestay được quan tâm',description:'Xem danh sách lưu trú và tìm lựa chọn phù hợp.',imageUrl:'/mocchau-stay-v5.jpg',label:'Lưu trú',target:'services',visible:true}
  ]
};
export function useSiteContent(){
  const [content,setContent]=useState<SiteContent>(defaultSiteContent);
  const [error,setError]=useState('');
  useEffect(()=>onSnapshot(doc(db,'site_content','public'),snap=>{
    if(!snap.exists()) return;
    const raw=snap.data() as Partial<SiteContent>;
    setContent({...defaultSiteContent,...raw,tiles:Array.isArray(raw.tiles)?raw.tiles:defaultSiteContent.tiles,stories:Array.isArray(raw.stories)?raw.stories:defaultSiteContent.stories});
    setError('');
  },e=>{console.warn('Public content defaults used',e);setError('Không tải được cấu hình; đang sử dụng nội dung mặc định.')}),[]);
  return {content,error};
}
export async function publishSiteContent(content:SiteContent){
  const user=auth.currentUser;
  if(!user) throw new Error('Bạn cần đăng nhập Firebase để xuất bản.');
  const token=await user.getIdTokenResult(true);
  if(token.claims.admin!==true && token.claims.operator!==true) throw new Error('Tài khoản chưa được cấp quyền quản trị Firebase (custom claim).');
  const secure=(s:string)=>s.startsWith('/')||/^https:\/\//i.test(s);
  if(!secure(content.logoUrl)||!secure(content.heroImageUrl)||content.stories.some(x=>x.imageUrl&&!secure(x.imageUrl)))throw new Error('Đường dẫn ảnh chỉ được dùng HTTPS hoặc đường dẫn nội bộ.');
  await setDoc(doc(db,'site_content','public'),{...content,updatedAt:serverTimestamp(),updatedBy:user.uid});
}
export async function uploadSiteImage(file:File){
  if(!file.type.startsWith('image/')||!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
  if(file.size>5*1024*1024)throw new Error('Ảnh không được vượt quá 5 MB.');
  const user=auth.currentUser;
  if(!user)throw new Error('Vui lòng đăng nhập Admin.');
  const token=await user.getIdTokenResult(true);
  if(token.claims.admin!==true&&token.claims.operator!==true)throw new Error('Chưa được cấp quyền tải ảnh quản trị.');
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-70);
  const location=ref(getStorage(),`site-media/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName}`);
  await uploadBytes(location,file,{contentType:file.type});
  return getDownloadURL(location);
}
