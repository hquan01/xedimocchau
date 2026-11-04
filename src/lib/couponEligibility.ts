import type { Coupon, User } from '../types';
import { eligibleForNextBookingReward } from './loyalty';

export interface CouponDecision { eligible: boolean; reason: string }
const todayVietnam = (date: Date) => new Date(date.getTime()+7*3600_000).toISOString().slice(0,10);
const validBirthday = (value?: string) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;

export function memberAge(user: Pick<User,'birthDate'>, date=new Date()): number | null {
  if(!validBirthday(user.birthDate))return null;
  const today = todayVietnam(date);
  const [year,month,day]=today.split('-').map(Number);
  const [birthYear,birthMonth,birthDay]=user.birthDate!.split('-').map(Number);
  const age=year-birthYear-(month<birthMonth || (month===birthMonth&&day<birthDay)?1:0);
  return age>=0&&age<=120?age:null;
}

export function couponAudienceLabel(coupon:Coupon):string {
  switch(coupon.audience){
    case 'male':return 'Dành cho nam';
    case 'female':return 'Dành cho nữ';
    case 'birthday':return 'Quà sinh nhật';
    case 'holiday':return 'Dịp lễ / sự kiện';
    case 'random':return 'Hội viên được bốc thăm';
    case 'age':return 'Theo độ tuổi';
    default:return 'Dành cho mọi hội viên';
  }
}

export function couponDecision(
  coupon: Coupon, user: User | null | undefined,
  options: { now?: Date; checkOrder?: boolean } = {}
): CouponDecision {
  if(coupon.isActive===false || coupon.isPublished!==true)
    return {eligible:false,reason:'Mã này chưa được công bố hoặc đã tạm dừng.'};
  const today=todayVietnam(options.now??new Date());
  if(coupon.validFrom && today<coupon.validFrom)
    return {eligible:false,reason:'Chương trình chưa bắt đầu.'};
  if(coupon.validUntil && today>coupon.validUntil)
    return {eligible:false,reason:'Mã ưu đãi đã hết hạn.'};
  if(!user || user.role!=='customer')
    return {eligible:false,reason:'Vui lòng đăng nhập tài khoản hội viên.'};
  if(options.checkOrder!==false && !eligibleForNextBookingReward(user))
    return {eligible:false,reason:'Chỉ áp dụng từ đơn thứ hai, sau khi đơn đầu được xác nhận.'};
  if((user.usedCoupons||[]).map(x=>x.toUpperCase()).includes(coupon.code.toUpperCase()))
    return {eligible:false,reason:'Tài khoản đã sử dụng mã này.'};
  switch(coupon.audience || 'all'){
    case 'male':
      if(user.gender!=='male')return {eligible:false,reason:'Mã này chỉ áp dụng cho hội viên chọn giới tính nam.'};
      break;
    case 'female':
      if(user.gender!=='female')return {eligible:false,reason:'Mã này chỉ áp dụng cho hội viên chọn giới tính nữ.'};
      break;
    case 'birthday': {
      if(!validBirthday(user.birthDate))
        return {eligible:false,reason:'Hãy cập nhật ngày sinh hợp lệ trong hồ sơ để nhận quà sinh nhật.'};
      const monthDay=user.birthDate!.slice(5);
      const birthday= (coupon.birthdayWindow||'month')==='day'
        ? monthDay===today.slice(5) : monthDay.slice(0,2)===today.slice(5,7);
      if(!birthday)return {eligible:false,reason:'Mã này chỉ dùng vào ngày hoặc tháng sinh nhật của hội viên.'};
      break;
    }
    case 'holiday':
      if(!coupon.validFrom || !coupon.validUntil)
        return {eligible:false,reason:'Mã dịp lễ cần có ngày bắt đầu và kết thúc.'};
      break;
    case 'random':
      if(!Array.isArray(coupon.assignedUserIds) || !coupon.assignedUserIds.includes(user.id))
        return {eligible:false,reason:'Mã này chỉ dành cho hội viên được chọn ngẫu nhiên.'};
      break;
    case 'age': {
      const age=memberAge(user,options.now);
      if(age===null)return {eligible:false,reason:'Vui lòng bổ sung ngày sinh trong hồ sơ.'};
      if(coupon.minAge!==undefined && age<coupon.minAge)
        return {eligible:false,reason:'Chưa đạt độ tuổi áp dụng của chương trình.'};
      if(coupon.maxAge!==undefined && age>coupon.maxAge)
        return {eligible:false,reason:'Không thuộc độ tuổi áp dụng của chương trình.'};
      break;
    }
  }
  return {eligible:true,reason:'Đủ điều kiện sử dụng'};
}
