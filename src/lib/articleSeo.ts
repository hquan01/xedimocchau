export const SEO_ARTICLE_SLUGS:Record<string,string>={
  'guide-1':'kinh-nghiem-du-lich-moc-chau-tu-tuc',
  'guide-2':'dia-diem-check-in-moc-chau',
  'guide-3':'an-gi-o-moc-chau-dac-san',
  'guide-4':'mua-hoa-man-moc-chau',
};
export function articlePublicUrl(id:string){
  const slug=SEO_ARTICLE_SLUGS[id];
  return slug?`/cam-nang/${slug}`:`/?bai-viet=${encodeURIComponent(id)}`;
}
