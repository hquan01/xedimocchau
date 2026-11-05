import {useState} from 'react';
import {collection,doc,getDoc,getDocs} from 'firebase/firestore';
import {db} from '../firebase';
import {gh} from '../client/githubApi';

/** One-time, non-destructive import. Never import old users or bookings. */
type RecordJson={id:string;[key:string]:unknown};
type CollectionScan={name:string;title:string;firebase:number;github:number;missing:RecordJson[];error?:string};
const sources=[
 ['guide_articles','Bài viết / cẩm nang'],['destinations','Địa điểm du lịch'],
 ['restaurants','Nhà hàng / ẩm thực'],['flower_seasons','Mùa hoa / trải nghiệm'],
 ['accommodations','Homestay / khách sạn'],['tour_combos','Combo du lịch'],
 ['coupons','Mã khuyến mãi'],
 ['zalo_groups','Cộng đồng Zalo'],['partners','Đối tác'],
 ['taxi_fleet','Đội taxi'],['motorbike_fleet','Đội xe máy'],
 ['ai_faqs','Kho câu hỏi AI'],['configs','Lịch, giá và cấu hình'],
 ['site_content','Logo / banner / nội dung trang chủ']
] as const;
export default function LegacyContentMigration({onDone}:{onDone:()=>Promise<void>}){
 const [open,setOpen]=useState(false);
 const [scans,setScans]=useState<CollectionScan[]|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [progress,setProgress]=useState('');
 const inspect=async()=>{
  setError('');setScans(null);setBusy(true);
  const result:CollectionScan[]=[];
  try{
    for(const [name,title] of sources){
      try{
        let docs:RecordJson[];
        if(name==='site_content'){
          const value=await getDoc(doc(db,name,'public'));
          docs=value.exists()?[{...value.data(),id:'public'}]:[];
        }else{
          const snapshot=await getDocs(collection(db,name));
          docs=snapshot.docs.map(row=>({...row.data(),id:row.id}));
        }
        const current=(await gh.list(name)).items||[];
        const found=new Set(current.map(item=>String(item.id)));
        result.push({name,title,firebase:docs.length,github:current.length,missing:docs.filter(x=>!found.has(x.id))});
      }catch(e){result.push({name,title,firebase:0,github:0,missing:[],error:e instanceof Error?e.message:String(e)});}
      setProgress('Đã kiểm tra '+result.length+'/'+sources.length+' mục');
    }
    setScans(result);
  }finally{setBusy(false);setProgress('')}
 };
 const transfer=async()=>{
  if(!scans||busy)return;
  const problems=scans.filter(x=>x.error);
  if(problems.length){setError('Chưa thể xác nhận giữ đủ nội dung: '+problems.map(x=>x.title).join(', ')+'. Cần khắc phục quyền đọc trước.');return;}
  if(!window.confirm('Chỉ CHÉP thêm bài viết, địa điểm và cấu hình còn thiếu từ Firebase sang GitHub; KHÔNG xóa hay ghi đè dữ liệu nào. Bắt đầu?'))return;
  setBusy(true);setError('');
  try{
    for(const part of scans){
      for(let i=0;i<part.missing.length;i++){
        const item=part.missing[i];
        if(JSON.stringify(item).length>58000)throw new Error('Bản ghi quá lớn ở '+part.title+' / '+item.id+'. Cần tách ảnh/file trước.');
        setProgress('Đang sao chép '+part.title+': '+(i+1)+'/'+part.missing.length);
        await gh.create(part.name,item);
      }
      const verify=(await gh.list(part.name)).items||[];
      const present=new Set(verify.map(x=>String(x.id)));
      if(part.missing.some(x=>!present.has(x.id)))throw new Error('Dữ liệu chép chưa đọc lại được ở '+part.title+'.');
    }
    await onDone();
    setScans(null);
    setProgress('Đã sao chép và kiểm tra lại các bản ghi. Chưa bao gồm ảnh gốc đang lưu trong Firebase Storage.');
  }catch(e){setError('Chuyển chưa hoàn tất, không xóa bản cũ: '+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false)}
 };
 return <div className="bg-white text-stone-900 border-b border-stone-200 px-4 py-2 text-xs">
   <div className="flex gap-2 flex-wrap items-center justify-end">
     <button disabled={busy} onClick={()=>setOpen(o=>!o)} className="rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 px-3 py-2 font-bold">Giữ lại bài viết và dữ liệu cũ {open?'▴':'▾'}</button>
   </div>
   {open&&<div className="my-3 rounded-xl border border-emerald-200 p-4 space-y-3">
     <h3 className="font-black text-base">Đối chiếu dữ liệu nội dung Firebase → GitHub</h3>
     <p className="text-stone-600">Giữ nguyên bài viết, địa điểm, banner, lịch và giá. Không chuyển khách hàng/đơn đặt vé cũ. Chỉ thêm những mã chưa tồn tại; không xóa hay ghi đè.</p>
     <p className="text-amber-800">Thông tin tài xế và khách hàng có quyền đọc riêng, không được sao chép qua công cụ công khai. Chủ xe sẽ kiểm tra đội xe sau khi chuyển nội dung.</p>
     <p className="text-amber-800">Lưu ý: cần đọc được các bản ghi Firebase cũ. URL ảnh đang nằm trên Firebase Storage sẽ cần chuyển tệp ảnh riêng trước khi ngắt Firebase hoàn toàn.</p>
     <button disabled={busy} onClick={()=>void inspect()} className="rounded-lg bg-[#1b4332] text-white px-4 py-2 disabled:opacity-50">1. Kiểm tra và so sánh dữ liệu</button>
     {progress&&<p className="text-emerald-800">{progress}</p>}
     {error&&<p role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-800 p-3">{error}</p>}
     {scans&&<>
       <div className="overflow-auto max-h-64">
        <table className="w-full text-xs text-left"><thead><tr><th>Mục</th><th>Firebase</th><th>GitHub</th><th>Chưa sao chép</th></tr></thead><tbody>
         {scans.map(x=><tr key={x.name} className="border-t"><td className="py-2">{x.title}{x.error&&<span className="block text-red-600">Lỗi: {x.error}</span>}</td><td>{x.firebase}</td><td>{x.github}</td><td>{x.missing.length}</td></tr>)}
        </tbody></table>
       </div>
       <button disabled={busy||scans.some(x=>x.error)||!scans.some(x=>x.missing.length)} onClick={()=>void transfer()} className="rounded-lg bg-emerald-700 text-white px-4 py-2 disabled:opacity-40">2. Sao chép mục còn thiếu (không xóa bản cũ)</button>
     </>}
   </div>}
 </div>
}
