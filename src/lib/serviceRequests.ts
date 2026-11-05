/** Public inquiries are stored in Firestore; never pretend a browser-only draft reached Admin. */
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type ServiceKind = 'taxi' | 'motorbike';
export type InquiryStatus = 'pending' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';
export interface ServiceInquiry {
  id: string;
  kind: ServiceKind;
  customerName: string;
  customerPhone: string;
  status: InquiryStatus;
  createdAt: string;
  pickupPoint?: string;
  dropoffPoint?: string;
  travelDate?: string;
  departureTime?: string;
  seats?: number;
  bikeType?: string;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  deliveryLocation?: string;
  notes?: string;
  quotedPrice?: number;
}

export const validVietnamPhone = (v: string) => /^(?:\+84|84|0)[35789]\d{8}$/.test(v.replace(/[\s.\-]/g, ''));

export async function submitServiceInquiry(input: Omit<ServiceInquiry, 'id'|'createdAt'|'status'>): Promise<string> {
  const name = input.customerName.trim();
  const phone = input.customerPhone.trim().replace(/[\s.\-]/g,'');
  if (name.length < 2 || name.length > 100 || !validVietnamPhone(phone)) throw new Error('Vui lòng nhập họ tên và số điện thoại Việt Nam hợp lệ.');
  if (input.kind === 'taxi' && (!input.pickupPoint?.trim() || !input.dropoffPoint?.trim() || !input.travelDate || ![4,7,9,16].includes(input.seats || 0))) {
    throw new Error('Vui lòng chọn xe và nhập đầy đủ điểm đón, điểm đến, ngày sử dụng.');
  }
  if (input.kind === 'motorbike' && (!input.startDate || !input.endDate || input.endDate < input.startDate || !input.deliveryLocation?.trim() || !input.quantity || input.quantity < 1 || input.quantity > 20)) {
    throw new Error('Vui lòng kiểm tra ngày nhận/trả, số lượng xe và nơi nhận xe.');
  }
  const values = Object.fromEntries(Object.entries(input).filter(([,v]) => v !== undefined && v !== null));
  if((import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_DATA_PROVIDER==='github'){
    // Preview migration: customer requests and the operator's inbox share one
    // encrypted backend. Never report success when the server write fails.
    const {gh}=await import('../client/githubApi');
    const saved=await gh.create('service_requests',{...values,customerName:name,customerPhone:phone,kind:input.kind});
    if(!saved.item?.id)throw new Error('Máy chủ chưa xác nhận đã nhận đơn dịch vụ.');
    return String(saved.item.id);
  }
  const payload = {
    ...values,
    customerName: name,
    customerPhone: phone,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    createdAtServer: serverTimestamp(),
    customerUid: auth.currentUser?.uid || '',
    quotedPrice: 0,
  };
  // A successful write is the only condition under which a confirmation may be shown.
  const record = await addDoc(collection(db, 'service_requests'), payload);
  return record.id;
}

export function subscribeServiceInquiries(onChange: (orders: ServiceInquiry[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, 'service_requests'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(q, snapshot => onChange(snapshot.docs.map(d => ({...d.data(), id:d.id}) as ServiceInquiry)), onError);
}

export async function updateServiceInquiryStatus(id: string, status: InquiryStatus, quotedPrice?: number) {
  if (!['pending','contacted','confirmed','completed','cancelled'].includes(status)) throw new Error('Trạng thái không hợp lệ.');
  if (quotedPrice !== undefined && (!Number.isFinite(quotedPrice) || quotedPrice < 0)) throw new Error('Giá không hợp lệ.');
  await updateDoc(doc(db, 'service_requests', id), {
    status,
    ...(quotedPrice !== undefined ? {quotedPrice} : {}),
    updatedAt: new Date().toISOString()
  });
}
