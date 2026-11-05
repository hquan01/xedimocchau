import {useCallback,useEffect,useState} from 'react';
import type {Booking,BlockedSeat,User,AppNotification,LimousineConfig,SharedCarConfig,TourCombo,Accommodation,Coupon,LocationPoint,Destination,GuideArticle,Driver,ZaloGroup} from '../types';
import {gh} from '../client/githubApi';
import {INITIAL_COMBOS} from '../data/combos';
import {INITIAL_ACCOMMODATIONS} from '../data/accommodations';
import {DEFAULT_LIMOUSINE_CONFIG,DEFAULT_SHARED_CAR_CONFIG,INITIAL_COUPONS,INITIAL_LOCATIONS} from '../data/config';
import {INITIAL_DESTINATIONS} from '../data/destinations';
import {INITIAL_ARTICLES} from '../data/articles';
import {INITIAL_DRIVERS} from '../data/drivers';
import {INITIAL_ZALO_GROUPS} from '../data/zaloGroups';
import {INITIAL_RESTAURANTS,INITIAL_FLOWER_SEASONS,INITIAL_PARTNERS,INITIAL_TAXI_FLEET,INITIAL_MOTORBIKES,INITIAL_AI_FAQS} from '../data/operatorDefaults';
import type {RestaurantItem} from '../components/operator/RestaurantManagement';
import type {FlowerSeasonItem} from '../components/operator/FlowerSeasonManagement';
import type {PartnerItem} from '../components/operator/PartnerManagement';
import type {TaxiVehicle,TaxiRequest} from '../components/operator/TaxiFleetManagement';
import type {MotorbikeVehicle,MotorbikeBookingRequest} from '../components/operator/MotorbikeManagement';
import type {AIKnowledgeItem} from '../components/operator/AIAssistantManagement';

/**
 * CUSTOMER and CMS GH read layer. Cannot seed Firebase/localStorage into the
 * new customer/order store. Published content keeps its bundled defaults only
 * until the operator migrates historical posts and media.
 */
export function useGithubSync(){
  const [currentUser,setCurrentUser]=useState<User|null>(null);
  const [authReady,setAuthReady]=useState(false);
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [allBookings,setAllBookings]=useState<Booking[]>([]);
  const [blockedSeats,setBlockedSeats]=useState<BlockedSeat[]>([]);
  const [users,setUsers]=useState<User[]>([]);
  const [notifications,setNotifications]=useState<AppNotification[]>([]);
  const [combos,setCombos]=useState<TourCombo[]>(INITIAL_COMBOS);
  const [accommodations,setAccommodations]=useState<Accommodation[]>(INITIAL_ACCOMMODATIONS);
  const [limousineConfig,setLimousineConfig]=useState<LimousineConfig>(DEFAULT_LIMOUSINE_CONFIG);
  const [sharedCarConfig,setSharedCarConfig]=useState<SharedCarConfig>(DEFAULT_SHARED_CAR_CONFIG);
  const [coupons,setCoupons]=useState<Coupon[]>(INITIAL_COUPONS);
  const [locations,setLocations]=useState<LocationPoint[]>(INITIAL_LOCATIONS);
  const [destinations,setDestinations]=useState<Destination[]>(INITIAL_DESTINATIONS);
  const [articles,setArticles]=useState<GuideArticle[]>(INITIAL_ARTICLES);
  const [drivers,setDrivers]=useState<Driver[]>(INITIAL_DRIVERS);
  const [zaloGroups,setZaloGroups]=useState<ZaloGroup[]>(INITIAL_ZALO_GROUPS);
  const [restaurants,setRestaurants]=useState<RestaurantItem[]>(INITIAL_RESTAURANTS);
  const [flowerSeasons,setFlowerSeasons]=useState<FlowerSeasonItem[]>(INITIAL_FLOWER_SEASONS);
  const [partners,setPartners]=useState<PartnerItem[]>(INITIAL_PARTNERS);
  const [taxiFleet,setTaxiFleet]=useState<TaxiVehicle[]>(INITIAL_TAXI_FLEET);
  const [taxiRequests,setTaxiRequests]=useState<TaxiRequest[]>([]);
  const [motorbikeFleet,setMotorbikeFleet]=useState<MotorbikeVehicle[]>(INITIAL_MOTORBIKES);
  const [motorbikeRequests,setMotorbikeRequests]=useState<MotorbikeBookingRequest[]>([]);
  const [aiFaqs,setAiFaqs]=useState<AIKnowledgeItem[]>(INITIAL_AI_FAQS);
  const [syncError,setSyncError]=useState('');

  useEffect(()=>{
    let active=true;
    gh.me().then(result=>{if(active)setCurrentUser((result.user||null) as User|null);})
      .catch(e=>{if(active)setSyncError('Không xác minh được phiên đăng nhập: '+String(e));})
      .finally(()=>{if(active)setAuthReady(true);});
    return()=>{active=false};
  },[]);

  const load=useCallback(async()=>{
    const loadPublic=async<T>(collection:string,fallback:T[],update:(v:T[])=>void)=>{
      const result=await gh.list(collection);
      // Empty repo is NOT historical Firebase content. Keep bundled defaults,
      // but never pretend they are saved to GitHub.
      update((result.items&&result.items.length?result.items:fallback) as T[]);
    };
    const publicTasks=[
      loadPublic('tour_combos',INITIAL_COMBOS,setCombos),
      loadPublic('accommodations',INITIAL_ACCOMMODATIONS,setAccommodations),
      loadPublic('coupons',INITIAL_COUPONS,setCoupons),
      loadPublic('destinations',INITIAL_DESTINATIONS,setDestinations),
      loadPublic('guide_articles',INITIAL_ARTICLES,setArticles),
      loadPublic('drivers',INITIAL_DRIVERS,setDrivers).catch(()=>{}), // Admin-only collection
      loadPublic('zalo_groups',INITIAL_ZALO_GROUPS,setZaloGroups),
      loadPublic('restaurants',INITIAL_RESTAURANTS,setRestaurants),
      loadPublic('flower_seasons',INITIAL_FLOWER_SEASONS,setFlowerSeasons),
      loadPublic('partners',INITIAL_PARTNERS,setPartners),
      loadPublic('taxi_fleet',INITIAL_TAXI_FLEET,setTaxiFleet),
      loadPublic('motorbike_fleet',INITIAL_MOTORBIKES,setMotorbikeFleet),
      loadPublic('ai_faqs',INITIAL_AI_FAQS,setAiFaqs)
    ];
    const results=await Promise.allSettled(publicTasks);
    const failed=results.filter(x=>x.status==='rejected') as PromiseRejectedResult[];
    if(failed.length)setSyncError('Một số dữ liệu Khám phá không tải được từ GitHub. Vui lòng thử lại.');
    // Guest GET is allowed but only own records are returned by the server.
    try{const own=await gh.list('bookings');const values=(own.items||[]) as Booking[];setBookings(values);setAllBookings(values);}
    catch(e){setSyncError('Không tải được vé của bạn: '+String(e));}
    try{const rows=await gh.list('service_requests'); void rows;}catch{}
    try {
      const list=await gh.list('blocked_seats');setBlockedSeats(list.items as BlockedSeat[]);
    }catch{ // Locked seats require a public, privacy-safe read endpoint.
      try{const r=await fetch('/api/github-data/_public-seat-status',{cache:'no-store'});
        if(r.ok){const j=await r.json();setBlockedSeats((j.items||[]) as BlockedSeat[]);}
      }catch{}
    }
    const configs=await Promise.allSettled(['limousineConfig','sharedCarConfig','locations'].map(id=>gh.get('configs',id)));
    if(configs[0].status==='fulfilled'){
      const c=configs[0].value.item as any;
      if(c?.limousineConfig)setLimousineConfig({...DEFAULT_LIMOUSINE_CONFIG,...c.limousineConfig});
    }
    if(configs[1].status==='fulfilled'){
      const c=configs[1].value.item as any;
      if(c?.sharedCarConfig)setSharedCarConfig({...DEFAULT_SHARED_CAR_CONFIG,...c.sharedCarConfig});
    }
    if(configs[2].status==='fulfilled'){
      const c=configs[2].value.item as any;
      if(Array.isArray(c?.locations))setLocations(c.locations);
    }
  },[]);
  useEffect(()=>{if(authReady)void load();},[authReady,currentUser?.id,load]);
  return {
    currentUser,setCurrentUser,authReady,bookings,setBookings,allBookings,blockedSeats,setBlockedSeats,
    users,setUsers,notifications,setNotifications,combos,setCombos,accommodations,setAccommodations,
    limousineConfig,setLimousineConfig,sharedCarConfig,setSharedCarConfig,
    coupons,setCoupons,locations,setLocations,destinations,setDestinations,articles,setArticles,
    drivers,setDrivers,zaloGroups,setZaloGroups,restaurants,setRestaurants,
    flowerSeasons,setFlowerSeasons,partners,setPartners,taxiFleet,setTaxiFleet,
    taxiRequests,setTaxiRequests,motorbikeFleet,setMotorbikeFleet,motorbikeRequests,setMotorbikeRequests,
    aiFaqs,setAiFaqs,syncError,refresh:load
  };
}
