/** Browser-side client for the server-mediated GitHub data API. No tokens here. */
export async function githubApi<T>(route:string, init:RequestInit={}):Promise<T>{
  const res=await fetch(route,{...init,credentials:'same-origin',headers:{'Content-Type':'application/json',...(init.headers||{})},cache:'no-store'});
  let data:any;
  try {data=await res.json();}catch{throw new Error(`Máy chủ không trả dữ liệu JSON (HTTP ${res.status}).`);}
  if(!res.ok)throw new Error(String(data.error||data.message||`Lỗi HTTP ${res.status}`));
  return data as T;
}
export const gh={
  status:()=>githubApi<{configured:boolean;provider:string}>('/api/github-data/status'),
  me:()=>githubApi<{user:any}>('/api/github-auth/me'),
  login:(email:string,password:string)=>githubApi<{user:any}>('/api/github-auth/login',{method:'POST',body:JSON.stringify({email,password})}),
  admin:(password:string)=>githubApi<{user:any}>('/api/github-auth/admin-login',{method:'POST',body:JSON.stringify({password})}),
  register:(email:string,password:string,name:string,phone:string)=>githubApi<{user:any}>('/api/github-auth/register',{method:'POST',body:JSON.stringify({email,password,name,phone})}),
  google:(credential:string)=>githubApi<{user:any}>('/api/github-auth/google',{method:'POST',body:JSON.stringify({credential})}),
  logout:()=>githubApi('/api/github-auth/logout',{method:'POST',body:'{}'}),
  list:(collection:string)=>githubApi<{items:any[]}>(`/api/github-data/${encodeURIComponent(collection)}`),
  get:(collection:string,id:string)=>githubApi<{item:any}>(`/api/github-data/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`),
  create:(collection:string,item:any)=>githubApi<{item:any}>(`/api/github-data/${encodeURIComponent(collection)}`,{method:'POST',body:JSON.stringify(item)}),
  patch:(collection:string,id:string,item:any)=>githubApi<{ok:boolean}>(`/api/github-data/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(item)}),
  remove:(collection:string,id:string)=>githubApi<{ok:boolean}>(`/api/github-data/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,{method:'DELETE',body:'{}'}),
  replace:(collection:string,items:any[])=>githubApi<{ok:boolean;changed:number}>(`/api/github-data/${encodeURIComponent(collection)}/_replace`,{method:'PUT',body:JSON.stringify({items})})
};
