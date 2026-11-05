import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, getDocs, setDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { hasOperatorAccess } from "../lib/simpleAuth";
import { ensureMemberWelcomeBonus } from "../lib/memberWelcomeBonus";
import { db, auth } from "../firebase";
import { Booking, BlockedSeat, User, AppNotification, LimousineConfig, SharedCarConfig, TourCombo, Accommodation, Coupon, LocationPoint, Destination, GuideArticle, Driver, ZaloGroup } from "../types";
import { INITIAL_COMBOS } from "../data/combos";
import { INITIAL_ACCOMMODATIONS } from "../data/accommodations";
import { DEFAULT_LIMOUSINE_CONFIG, DEFAULT_SHARED_CAR_CONFIG, INITIAL_COUPONS, INITIAL_LOCATIONS } from "../data/config";
import { INITIAL_DESTINATIONS } from "../data/destinations";
import { INITIAL_ARTICLES } from "../data/articles";
import { INITIAL_DRIVERS } from "../data/drivers";
import { INITIAL_ZALO_GROUPS } from "../data/zaloGroups";
import { 
  INITIAL_RESTAURANTS, 
  INITIAL_FLOWER_SEASONS, 
  INITIAL_PARTNERS, 
  INITIAL_TAXI_FLEET, 
  INITIAL_MOTORBIKES, 
  INITIAL_AI_FAQS 
} from "../data/operatorDefaults";
import { RestaurantItem } from "../components/operator/RestaurantManagement";
import { FlowerSeasonItem } from "../components/operator/FlowerSeasonManagement";
import { PartnerItem } from "../components/operator/PartnerManagement";
import { TaxiVehicle, TaxiRequest } from "../components/operator/TaxiFleetManagement";
import { MotorbikeVehicle, MotorbikeBookingRequest } from "../components/operator/MotorbikeManagement";
import { AIKnowledgeItem } from "../components/operator/AIAssistantManagement";
import { getLocalList, setLocalList, getDeviceId } from "../lib/firebaseUtils";

const SEED_KEY = "xemc_seed_completed_v1";

export function useFirebaseSync() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [blockedSeats, setBlockedSeats] = useState<BlockedSeat[]>(() => getLocalList<BlockedSeat>("blocked_seats", []));
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [combos, setCombos] = useState<TourCombo[]>(INITIAL_COMBOS);
  const [accommodations, setAccommodations] = useState<Accommodation[]>(INITIAL_ACCOMMODATIONS);
  const [limousineConfig, setLimousineConfig] = useState<LimousineConfig>(DEFAULT_LIMOUSINE_CONFIG);
  const [sharedCarConfig, setSharedCarConfig] = useState<SharedCarConfig>(DEFAULT_SHARED_CAR_CONFIG);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [locations, setLocations] = useState<LocationPoint[]>(INITIAL_LOCATIONS);
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [articles, setArticles] = useState<GuideArticle[]>(INITIAL_ARTICLES);
  const [drivers, setDrivers] = useState<Driver[]>(() => getLocalList<Driver>("drivers", INITIAL_DRIVERS));
  const [zaloGroups, setZaloGroups] = useState<ZaloGroup[]>(() => getLocalList<ZaloGroup>("zalo_groups", INITIAL_ZALO_GROUPS));

  // Additional operator entities persistent in Firestore
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>(() => getLocalList("restaurants", INITIAL_RESTAURANTS));
  const [flowerSeasons, setFlowerSeasons] = useState<FlowerSeasonItem[]>(() => getLocalList("flower_seasons", INITIAL_FLOWER_SEASONS));
  const [partners, setPartners] = useState<PartnerItem[]>(() => getLocalList("partners", INITIAL_PARTNERS));
  const [taxiFleet, setTaxiFleet] = useState<TaxiVehicle[]>(() => getLocalList("taxi_fleet", INITIAL_TAXI_FLEET));
  const [taxiRequests, setTaxiRequests] = useState<TaxiRequest[]>(() => getLocalList("taxi_requests", []));
  const [motorbikeFleet, setMotorbikeFleet] = useState<MotorbikeVehicle[]>(() => getLocalList("motorbike_fleet", INITIAL_MOTORBIKES));
  const [motorbikeRequests, setMotorbikeRequests] = useState<MotorbikeBookingRequest[]>(() => getLocalList("motorbike_requests", []));
  const [aiFaqs, setAiFaqs] = useState<AIKnowledgeItem[]>(() => getLocalList("ai_faqs", INITIAL_AI_FAQS));

  useEffect(() => {
    let unsubscribeProfile = () => {};
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeProfile();
      if (!firebaseUser) {
        setCurrentUser(null);
        setAuthReady(true);
        return;
      }
      try {
        const token = await firebaseUser.getIdTokenResult();
        const hasClaim = hasOperatorAccess(token, firebaseUser.email || undefined);
        if (!hasClaim) {
          try {
            await ensureMemberWelcomeBonus(firebaseUser);
          } catch (error) {
            console.warn('[Member] Could not create/reconcile welcome reward:', error);
          }
        }
        unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), snap => {
          if (snap.exists()) {
            const profile = snap.data() as User;
            const isOperator = hasClaim || (profile.role as string) === 'operator' || (profile.role as string) === 'admin';
            setCurrentUser({ ...profile, id: firebaseUser.uid, role: isOperator ? 'operator' : 'customer' });
          } else {
            setCurrentUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Thành viên',
              phone: firebaseUser.phoneNumber || '',
              points: 0,
              role: hasClaim ? 'operator' : 'customer'
            });
          }
          setAuthReady(true);
        }, error => {
          console.warn('Could not load profile from Firestore (using fallback):', error);
          setCurrentUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Thành viên',
            phone: firebaseUser.phoneNumber || '',
            points: 0,
            role: hasClaim ? 'operator' : 'customer'
          });
          setAuthReady(true);
        });
      } catch (error) {
        console.error('Auth claim lookup failed', error);
        setCurrentUser(null);
        setAuthReady(true);
      }
    });
    return () => { unsubAuth(); unsubscribeProfile(); };
  }, []);

  useEffect(() => {
    const handleDbUpdate = () => {
      setBlockedSeats(getLocalList<BlockedSeat>("blocked_seats", []));
    };
    window.addEventListener("xedimocchau_db_update", handleDbUpdate);
    return () => window.removeEventListener("xedimocchau_db_update", handleDbUpdate);
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const isSeeded = localStorage.getItem(SEED_KEY) === "true";

    const handleEmptyCollection = <T>(
      snapEmpty: boolean,
      docs: T[],
      initialData: T[],
      colName: string,
      setter: (val: T[]) => void
    ) => {
      if (snapEmpty) {
        if (!isSeeded && currentUser?.role === 'operator' && auth.currentUser) {
          console.log(`Seeding initial data for ${colName}...`);
          initialData.forEach((item: any) => {
            if (item.id) {
              setDoc(doc(db, colName, item.id), item).catch(console.error);
            }
          });
          setter(initialData);
        } else if (isSeeded) {
          // If already seeded in the past and collection is empty now, it means admin deleted all items.
          // DO NOT auto-reseed! Respect empty state.
          setter([]);
        } else {
          setter(initialData);
        }
      } else {
        setter(docs);
        localStorage.setItem(SEED_KEY, "true");
      }
    };

    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      const fetchedBookings = snap.docs.map(d => d.data() as Booking);
      setAllBookings(fetchedBookings);
      const deviceId = getDeviceId();
      if (currentUser?.role === 'operator') {
        setBookings(fetchedBookings);
      } else {
        setBookings(fetchedBookings.filter(b => (b as any).deviceId === deviceId));
      }
    }, (error) => {
      console.warn("Bookings snapshot error:", error);
      const localList = getLocalList<Booking>("bookings", []);
      setAllBookings(localList);
      const deviceId = getDeviceId();
      setBookings(currentUser?.role === 'operator' ? localList : localList.filter(b => (b as any).deviceId === deviceId));
    });

    const unsubCombos = onSnapshot(collection(db, "tour_combos"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as TourCombo), INITIAL_COMBOS, "tour_combos", setCombos);
    }, () => setCombos(getLocalList("combos", INITIAL_COMBOS)));

    const unsubAcc = onSnapshot(collection(db, "accommodations"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as Accommodation), INITIAL_ACCOMMODATIONS, "accommodations", setAccommodations);
    }, () => setAccommodations(getLocalList("accommodations", INITIAL_ACCOMMODATIONS)));

    const unsubArticles = onSnapshot(collection(db, "guide_articles"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as GuideArticle), INITIAL_ARTICLES, "guide_articles", setArticles);
    }, () => setArticles(getLocalList("articles", INITIAL_ARTICLES)));

    const unsubCoupons = onSnapshot(collection(db, "coupons"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as Coupon), INITIAL_COUPONS, "coupons", setCoupons);
    }, () => setCoupons(getLocalList("coupons", INITIAL_COUPONS)));

    const unsubDestinations = onSnapshot(collection(db, "destinations"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as Destination), INITIAL_DESTINATIONS, "destinations", setDestinations);
    }, () => setDestinations(getLocalList("destinations", INITIAL_DESTINATIONS)));

    const unsubRestaurants = onSnapshot(collection(db, "restaurants"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as RestaurantItem), INITIAL_RESTAURANTS, "restaurants", setRestaurants);
    }, () => setRestaurants(getLocalList("restaurants", INITIAL_RESTAURANTS)));

    const unsubFlowerSeasons = onSnapshot(collection(db, "flower_seasons"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as FlowerSeasonItem), INITIAL_FLOWER_SEASONS, "flower_seasons", setFlowerSeasons);
    }, () => setFlowerSeasons(getLocalList("flower_seasons", INITIAL_FLOWER_SEASONS)));

    const unsubPartners = onSnapshot(collection(db, "partners"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as PartnerItem), INITIAL_PARTNERS, "partners", setPartners);
    }, () => setPartners(getLocalList("partners", INITIAL_PARTNERS)));

    const unsubTaxiFleet = onSnapshot(collection(db, "taxi_fleet"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as TaxiVehicle), INITIAL_TAXI_FLEET, "taxi_fleet", setTaxiFleet);
    }, () => setTaxiFleet(getLocalList("taxi_fleet", INITIAL_TAXI_FLEET)));

    const unsubTaxiReqs = onSnapshot(collection(db, "taxi_requests"), (snap) => {
      setTaxiRequests(snap.docs.map(d => d.data() as TaxiRequest));
    }, () => setTaxiRequests(getLocalList("taxi_requests", [])));

    const unsubMotorbikeFleet = onSnapshot(collection(db, "motorbike_fleet"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as MotorbikeVehicle), INITIAL_MOTORBIKES, "motorbike_fleet", setMotorbikeFleet);
    }, () => setMotorbikeFleet(getLocalList("motorbike_fleet", INITIAL_MOTORBIKES)));

    const unsubMotorbikeReqs = onSnapshot(collection(db, "motorbike_requests"), (snap) => {
      setMotorbikeRequests(snap.docs.map(d => d.data() as MotorbikeBookingRequest));
    }, () => setMotorbikeRequests(getLocalList("motorbike_requests", [])));

    const unsubAiFaqs = onSnapshot(collection(db, "ai_faqs"), (snap) => {
      handleEmptyCollection(snap.empty, snap.docs.map(d => d.data() as AIKnowledgeItem), INITIAL_AI_FAQS, "ai_faqs", setAiFaqs);
    }, () => setAiFaqs(getLocalList("ai_faqs", INITIAL_AI_FAQS)));

    const unsubBlocked = onSnapshot(collection(db, "blocked_seats"), (snap) => {
      if (!snap.empty) {
        const remote = snap.docs.map(d => d.data() as BlockedSeat);
        setBlockedSeats(remote);
        setLocalList("blocked_seats", remote);
      }
    }, (error) => {
      console.warn("Blocked seats snapshot error:", error);
      setBlockedSeats(getLocalList("blocked_seats", []));
    });

    const unsubConfigs = onSnapshot(collection(db, "configs"), (snap) => {
      if (!snap.empty) {
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.limousineConfig) setLimousineConfig({ ...DEFAULT_LIMOUSINE_CONFIG, ...data.limousineConfig });
          if (data.sharedCarConfig) setSharedCarConfig({ ...DEFAULT_SHARED_CAR_CONFIG, ...data.sharedCarConfig });
          if (data.locations) setLocations(data.locations);
          if (data.drivers && Array.isArray(data.drivers)) setDrivers(data.drivers);
        });
      }
    }, (error) => console.warn("Configs snapshot error (using defaults):", error));

    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snap) => {
      const allNotifs = snap.docs.map(d => d.data() as AppNotification);
      const deviceId = getDeviceId();
      const filtered = currentUser?.role === 'operator' 
        ? allNotifs 
        : allNotifs.filter(n => 
            n.deviceId === deviceId || 
            n.deviceId === "all" || 
            (currentUser?.phone && (n.targetPhone === currentUser.phone || n.metadata?.customerPhone === currentUser.phone))
          );
      setNotifications(filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, (error) => {
      console.warn("Notifications snapshot error:", error);
      setNotifications(getLocalList("notifications", []));
    });

    const unsubZaloGroups = onSnapshot(collection(db, "zalo_groups"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as ZaloGroup);
        setZaloGroups(list.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    }, (error) => {
      console.warn("Zalo groups snapshot error:", error);
      setZaloGroups(getLocalList("zalo_groups", INITIAL_ZALO_GROUPS));
    });

    let unsubUsers = () => {};
    if (currentUser?.role === 'operator' && auth.currentUser) {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setUsers(snap.docs.map(d => d.data() as User));
      }, () => setUsers(getLocalList("users", [])));
    }

    return () => {
      unsubBookings();
      unsubCombos();
      unsubAcc();
      unsubArticles();
      unsubCoupons();
      unsubDestinations();
      unsubRestaurants();
      unsubFlowerSeasons();
      unsubPartners();
      unsubTaxiFleet();
      unsubTaxiReqs();
      unsubMotorbikeFleet();
      unsubMotorbikeReqs();
      unsubAiFaqs();
      unsubBlocked();
      unsubConfigs();
      unsubNotifications();
      unsubZaloGroups();
      unsubUsers();
    };
  }, [authReady, currentUser?.role, currentUser?.id]);

  return {
    currentUser,
    setCurrentUser,
    authReady,
    bookings,
    setBookings,
    allBookings,
    blockedSeats,
    setBlockedSeats,
    users,
    setUsers,
    notifications,
    setNotifications,
    combos,
    setCombos,
    accommodations,
    setAccommodations,
    limousineConfig,
    setLimousineConfig,
    sharedCarConfig,
    setSharedCarConfig,
    coupons,
    setCoupons,
    locations,
    setLocations,
    destinations,
    setDestinations,
    articles,
    setArticles,
    drivers,
    setDrivers,
    zaloGroups,
    setZaloGroups,
    restaurants,
    setRestaurants,
    flowerSeasons,
    setFlowerSeasons,
    partners,
    setPartners,
    taxiFleet,
    setTaxiFleet,
    taxiRequests,
    setTaxiRequests,
    motorbikeFleet,
    setMotorbikeFleet,
    motorbikeRequests,
    setMotorbikeRequests,
    aiFaqs,
    setAiFaqs
  };
}
