import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const base='https://xedimocchau.com';
const compiled=await build({entryPoints:[path.join(root,'src/data/articles.ts')],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
const {INITIAL_ARTICLES:articles}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const slugs={
  'guide-1':'kinh-nghiem-du-lich-moc-chau-tu-tuc',
  'guide-2':'dia-diem-check-in-moc-chau',
  'guide-3':'an-gi-o-moc-chau-dac-san',
  'guide-4':'mua-hoa-man-moc-chau'
};
const photos={
  'guide-1':'/mocchau-hero-v5.jpg',
  'guide-2':'/mocchau-tea-v5.jpg',
  'guide-3':'/mocchau-stay-v5.jpg',
  'guide-4':'/mocchau-flower-v5.jpg'
};
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeJson=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const pages=[];
const nav='<a href="/">Trang chủ</a> <a href="/dich-vu/xe-limousine-ha-noi-moc-chau">Đặt xe Limousine</a> <a href="/cam-nang/kinh-nghiem-du-lich-moc-chau-tu-tuc">Cẩm nang</a>';
const css=`
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f7faf7;color:#17382b;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.7}a{color:#146c49}a:hover{text-decoration:underline}
header{background:#fff;border-bottom:1px solid #dfeee6}header .inner{max-width:1060px;margin:auto;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}header img{width:200px;max-width:44vw;height:auto}nav{display:flex;flex-wrap:wrap;gap:14px}nav a{font-weight:650;text-decoration:none;font-size:13px}
main{max-width:860px;margin:24px auto 70px;padding:0 18px}article{background:#fff;border:1px solid #dfede3;border-radius:22px;padding:clamp(20px,4vw,46px);box-shadow:0 12px 25px #163e2910}.eyebrow{font-weight:800;font-size:12px;letter-spacing:.08em;color:#22714c;text-transform:uppercase}h1{font-size:clamp(26px,5vw,39px);line-height:1.25;margin:10px 0 18px}h2{font-size:22px;line-height:1.35;margin-top:30px}.lead{font-size:17px;color:#41574d}figure{margin:24px 0}figure img{display:block;width:100%;max-height:350px;object-fit:cover;border-radius:18px}figure figcaption{font-size:12px;color:#66776d;margin-top:7px}
p{margin:16px 0;overflow-wrap:break-word;white-space:pre-line}.note{background:#fff8e8;border-left:4px solid #d6a444;padding:14px 18px;border-radius:10px;font-size:13px}.cta{display:flex;gap:10px;flex-wrap:wrap;margin:30px 0;padding:22px;border-radius:18px;background:#e4f5eb}.cta a{border-radius:12px;background:#1b4332;color:#fff;padding:12px 20px;text-decoration:none;font-weight:800}.cta a.secondary{background:#fff;color:#1b4332;border:1px solid #1b4332}footer{text-align:center;padding:32px 18px;color:#566960;background:#eef5f0;font-size:13px}
@media(max-width:600px){header .inner{padding:10px 14px}nav{gap:10px}nav a{font-size:12px}}
`;
function shell({title,description,pathname,image,body,type='WebPage'}){
  const url=base+pathname;
  const graph={'@context':'https://schema.org','@type':type,'headline':title,'name':title,'description':description,'url':url,'image':base+image,'inLanguage':'vi-VN','publisher':{'@type':'Organization','name':'QT Limousine – Xe Đi Mộc Châu','url':base}};
  return `<!doctype html><html lang="vi"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"/><meta name="robots" content="index,follow,max-image-preview:large"/><link rel="canonical" href="${url}"/><meta property="og:type" content="${type==='Article'?'article':'website'}"/><meta property="og:locale" content="vi_VN"/><meta property="og:url" content="${url}"/><meta property="og:title" content="${escapeHtml(title)}"/><meta property="og:description" content="${escapeHtml(description)}"/><meta property="og:image" content="${base+image}"/><meta name="twitter:card" content="summary_large_image"/><link rel="icon" href="/brand-xedimocchau-favicon.ico"/><script type="application/ld+json">${safeJson(graph)}</script><style>${css}</style></head><body><header><div class="inner"><a href="/" aria-label="Trang chủ Xe Đi Mộc Châu"><img src="/brand-xedimocchau-header.png" width="520" height="114" alt="Xe Đi Mộc Châu"/></a><nav aria-label="Điều hướng">${nav}</nav></div></header><main><article>${body}</article></main><footer>QT Limousine • Tư vấn chuyến xe Hà Nội – Mộc Châu • <a href="tel:0971050324">0971 050 324</a> • <a href="/">xedimocchau.com</a></footer></body></html>`;
}
function cta(){
  return '<div class="cta"><div><strong>Chuẩn bị đi Mộc Châu?</strong><p>Hỏi lịch xe, điểm đón trả và lựa chọn chuyến phù hợp. Xem thông tin trước khi xác nhận đặt vé.</p></div><a href="/?dat-xe=1">Xem chuyến &amp; đặt xe</a><a class="secondary" href="https://zalo.me/0971050324" rel="noopener">Nhắn Zalo QT Limousine</a></div>';
}
for(const article of articles){
  const slug=slugs[article.id];if(!slug)continue;
  const pathname='/cam-nang/'+slug;
  const title=article.title+' | Cẩm nang Xe Đi Mộc Châu';
  const description=String(article.excerpt||'').slice(0,185);
  const image=photos[article.id];
  const paragraphs=(article.content||[]).map(p=>'<p>'+escapeHtml(p)+'</p>').join('');
  const hydrate=`<script>
  (function(){
    var articleId=${JSON.stringify(article.id)};
    function record(event){
      try{
        var payload=new Blob([JSON.stringify({articleId:articleId,event:event})],{type:'application/json'});
        if(navigator.sendBeacon){navigator.sendBeacon('/api/content/engagement',payload);return;}
        fetch('/api/content/engagement',{method:'POST',body:payload,keepalive:true}).catch(function(){});
      }catch(e){}
    }
    setTimeout(function(){if(document.visibilityState==='visible')record('view')},2500);
    Array.prototype.forEach.call(document.querySelectorAll('a[href*="dat-xe=1"]'),function(a){
      a.addEventListener('click',function(){record('booking_click')});
    });
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort()},5000);
    fetch('/api/content/article?id='+encodeURIComponent(articleId),{signal:controller.signal})
      .then(function(r){if(!r.ok)throw Error('CMS unavailable');return r.json()})
      .then(function(a){
        if(!a||!a.title||!Array.isArray(a.content))return;
        var title=document.getElementById('seo_article_title');
        var intro=document.getElementById('seo_article_excerpt');
        var container=document.getElementById('seo_article_body');
        var cover=document.getElementById('seo_article_cover');
        if(title)title.textContent=a.title;
        if(intro)intro.textContent=a.excerpt||'';
        if(container){
          var fragment=document.createDocumentFragment();
          a.content.forEach(function(line){if(typeof line!=='string')return;var p=document.createElement('p');p.textContent=line;fragment.appendChild(p)});
          container.replaceChildren(fragment);
        }
        if(cover&&typeof a.imageUrl==='string'&&(a.imageUrl.startsWith('https://')||a.imageUrl.startsWith('/'))){
          cover.src=a.imageUrl;cover.alt=a.title;
        }
        document.title=a.title+' | Cẩm nang Xe Đi Mộc Châu';
        var meta=document.querySelector('meta[name="description"]');
        if(meta)meta.setAttribute('content',a.excerpt||'');
      }).catch(function(){/* Static readable content stays available. */})
      .finally(function(){clearTimeout(timer)});
  })();
  </script>`;
  const body=`<p class="eyebrow">Cẩm nang du lịch Mộc Châu · ${escapeHtml(article.categoryLabel)}</p><h1 id="seo_article_title">${escapeHtml(article.title)}</h1><p id="seo_article_excerpt" class="lead">${escapeHtml(article.excerpt)}</p><figure><img id="seo_article_cover" src="${image}" width="1000" height="540" alt="${escapeHtml(article.title)}" fetchpriority="high"/><figcaption>Hình minh họa chủ đề Mộc Châu</figcaption></figure><div class="note">Thông tin theo mùa, lịch trình, giá tham khảo và tình trạng các điểm đến có thể thay đổi. Vui lòng xác minh trước ngày đi.</div><div id="seo_article_body">${paragraphs}</div>${cta()}<p><a href="/?bai-viet=${encodeURIComponent(article.id)}">Đọc bài trong giao diện cẩm nang tương tác</a></p><h2>Khám phá thêm</h2><ul><li><a href="/cam-nang/kinh-nghiem-du-lich-moc-chau-tu-tuc">Cẩm nang du lịch Mộc Châu A–Z</a></li><li><a href="/cam-nang/mua-hoa-man-moc-chau">Kinh nghiệm đi Mộc Châu mùa hoa mận</a></li><li><a href="/dich-vu/xe-limousine-ha-noi-moc-chau">Xe Limousine Hà Nội – Mộc Châu</a></li></ul>${hydrate}`;
  const file=path.join(root,'public','cam-nang',slug+'.html');
  await mkdir(path.dirname(file),{recursive:true});
  await writeFile(file,shell({title,description,pathname,image,body,type:'Article'}),'utf8');
  pages.push(pathname);
}
const servicePages=[
 {slug:'xe-limousine-ha-noi-moc-chau',name:'Xe Limousine Hà Nội – Mộc Châu',lead:'Tìm chuyến xe phù hợp, tham khảo lịch khởi hành và đặt vé QT Limousine trực tuyến.',details:[
 'Tuyến Hà Nội – Mộc Châu phù hợp với khách muốn lên kế hoạch du lịch, thăm gia đình hoặc di chuyển công tác. Trên website, bạn có thể chọn chiều đi, ngày khởi hành, điểm đón trả và tìm chuyến đang nhận đặt.',
 'Trước khi xác nhận, hãy kiểm tra thời gian xuất phát, số người, hành lý và tổng chi phí hiển thị trong quá trình đặt. Nếu có yêu cầu đưa đón đặc biệt, bạn có thể liên hệ QT Limousine để được kiểm tra khả năng phục vụ.',
 'Nên đặt sớm nếu đi vào cuối tuần hoặc dịp hoa nở đông khách. Khi kế hoạch thay đổi, hãy trao đổi trực tiếp với nhà xe về điều kiện điều chỉnh hoặc hoàn hủy vé trước khi thực hiện.'
 ]},
 {slug:'xe-ghep-ha-noi-moc-chau',name:'Xe ghép Hà Nội – Mộc Châu',lead:'Tham khảo lựa chọn di chuyển bằng xe ghép và so sánh với Limousine theo nhu cầu.',details:[
 'Xe ghép là lựa chọn để cân nhắc khi bạn muốn đi Mộc Châu với nhóm nhỏ, mang ít hành lý hoặc cần khung giờ thuận tiện. Lịch xe và chỗ trống thay đổi theo ngày.',
 'Khi tìm xe ghép, cần xác nhận rõ tuyến đường, địa điểm đón trả, thời gian khởi hành và khoản phí được công bố. Không nên chỉ so sánh giá cơ bản mà bỏ qua chi phí di chuyển từ điểm trả về nơi lưu trú.',
 'Bạn cũng có thể kiểm tra lịch xe Limousine trên cùng website để chọn phương tiện hợp lý với số người và ngân sách.'
 ]},
 {slug:'thue-xe-may-moc-chau',name:'Thuê xe máy Mộc Châu',lead:'Tìm hiểu cách nhận xe, kiểm tra giấy tờ và lên kế hoạch di chuyển tại Mộc Châu.',details:[
 'Xe máy phù hợp khi bạn muốn chủ động khám phá các cung đường gần nơi ở và tự sắp xếp thời gian. Hãy cân nhắc tình trạng đường, thời tiết, kinh nghiệm lái xe đèo và quãng đường thực tế.',
 'Trước khi thuê xe, hãy hỏi rõ loại xe, giá thuê theo thời gian, nơi nhận trả, giấy tờ cần thiết, chính sách nhiên liệu và cách xử lý khi xe gặp sự cố. Kiểm tra phanh, lốp, đèn và mũ bảo hiểm khi nhận xe.',
 'Website Xe Đi Mộc Châu có mục gửi yêu cầu thuê xe máy. Sau khi gửi, cần chờ nhân viên xác nhận tình trạng xe và điều kiện thuê.'
 ]},
 {slug:'taxi-du-lich-moc-chau',name:'Taxi & Xe du lịch Mộc Châu',lead:'Tìm xe có lái tại Mộc Châu cho nhóm bạn, gia đình hoặc lịch trình tham quan.',details:[
 'Khi đi theo nhóm có trẻ nhỏ, người lớn tuổi hoặc muốn tham quan nhiều địa điểm trong ngày, taxi và xe du lịch có lái là phương án đáng cân nhắc.',
 'Bạn nên ghi rõ số khách, hành lý, điểm đón trả, các điểm muốn đến, thời gian sử dụng xe và yêu cầu đặc biệt. Giá thuê cần được xác nhận cho đúng lịch trình, tránh hiểu nhầm một chiều và khứ hồi.',
 'Mục dịch vụ trên website cho phép gửi yêu cầu để QT Limousine liên hệ tư vấn. Việc gửi biểu mẫu không đồng nghĩa phương tiện đã được xác nhận sẵn sàng.'
 ]}
];
for(const item of servicePages){
 const pathname='/dich-vu/'+item.slug;
 const title=item.name+' | QT Limousine – Xe Đi Mộc Châu';
 const description=item.lead;
 const body=`<p class="eyebrow">Dịch vụ di chuyển tại Mộc Châu</p><h1>${escapeHtml(item.name)}</h1><p class="lead">${escapeHtml(item.lead)}</p>${item.details.map(s=>'<p>'+escapeHtml(s)+'</p>').join('')}${cta()}<h2>Cẩm nang hữu ích trước chuyến đi</h2><p><a href="/cam-nang/kinh-nghiem-du-lich-moc-chau-tu-tuc">Xem kinh nghiệm du lịch Mộc Châu tự túc</a> và <a href="/cam-nang/dia-diem-check-in-moc-chau">gợi ý những điểm tham quan đáng cân nhắc</a>.</p>`;
 const file=path.join(root,'public','dich-vu',item.slug+'.html');
 await mkdir(path.dirname(file),{recursive:true});
 await writeFile(file,shell({title,description,pathname,image:'/og-mocchau-1200x630.jpg',body}),'utf8');
 pages.push(pathname);
}
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
 ['',...pages].map(p=>`  <url><loc>${base+p||base+'/'}${p?'':'/'}</loc></url>`).join('\n')+
 '\n</urlset>\n';
await writeFile(path.join(root,'public/sitemap.xml'),sitemap);
console.log(`Generated ${pages.length} static SEO pages and sitemap with verified public URLs.`);
