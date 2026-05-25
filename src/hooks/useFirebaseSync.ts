import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, getDocs, setDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { Booking, BlockedSeat, User, AppNotification, LimousineConfig, SharedCarConfig, TourCombo, Accommodation, Coupon, LocationPoint, Destination, GuideArticle } from "../types";
import { INITIAL_COMBOS } from "../data/combos";
import { INITIAL_ACCOMMODATIONS } from "../data/accommodations";
import { DEFAULT_LIMOUSINE_CONFIG, DEFAULT_SHARED_CAR_CONFIG, INITIAL_COUPONS, INITIAL_LOCATIONS } from "../data/config";
import { INITIAL_DESTINATIONS } from "../data/destinations";
import { INITIAL_ARTICLES } from "../data/articles";
import { getLocalList, getDeviceId } from "../lib/firebaseUtils";

export function useFirebaseSync() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSeats, setBlockedSeats] = useState<BlockedSeat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Use data from local data defaults or sync config if needed
  // For simplicity, sticking to initial data arrays for global configs, unless updated by admin
  const [combos, setCombos] = useState<TourCombo[]>(INITIAL_COMBOS);
  const [accommodations, setAccommodations] = useState<Accommodation[]>(INITIAL_ACCOMMODATIONS);
  const [limousineConfig, setLimousineConfig] = useState<LimousineConfig>(DEFAULT_LIMOUSINE_CONFIG);
  const [sharedCarConfig, setSharedCarConfig] = useState<SharedCarConfig>(DEFAULT_SHARED_CAR_CONFIG);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [locations, setLocations] = useState<LocationPoint[]>(INITIAL_LOCATIONS);
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [articles, setArticles] = useState<GuideArticle[]>(INITIAL_ARTICLES);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setCurrentUser(docSnap.data() as User);
          } else {
            // Document doesn't exist in Firestore yet (creation in progress or not created)
            const isHardcoded = user.email === "hquansl001@gmail.com" || user.email === "nhaxe@mocchau.vn";
            if (isHardcoded) {
              setCurrentUser({
                id: user.uid,
                email: user.email || "nhaxe@mocchau.vn",
                name: "Duy Anh (Quản lý Nhà Xe)",
                phone: "0971050324",
                role: "operator",
                points: 9999
              });
            } else {
              setCurrentUser(null);
            }
          }
        }, (error) => {
          console.warn("Retrying profile or using graceful fallback", error);
          if (user.email === "hquansl001@gmail.com" || user.email === "nhaxe@mocchau.vn") {
            setCurrentUser({
              id: user.uid,
              email: user.email || "nhaxe@mocchau.vn",
              name: "Duy Anh (Quản lý Nhà Xe)",
              phone: "0971050324",
              role: "operator",
              points: 9999
            });
          } else {
            setCurrentUser(null);
          }
        });
      } else {
        const cachedAdmin = localStorage.getItem("mock_admin_session");
        if (cachedAdmin) {
          setCurrentUser(JSON.parse(cachedAdmin));
        } else {
          setCurrentUser(null);
        }
      }
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    // Only fetch real-time public/protected data once auth is ready (even for unauthenticated users if your rules allow)
    // Bookings (customer sees theirs, admin sees all)
    let unsubBookings = () => {};
    let unsubBlocked = () => {};
    let unsubConfigs = () => {};
    let unsubNotifications = () => {};
    let unsubCombosCol = () => {};
    let unsubAccCol = () => {};
    let unsubArticlesCol = () => {};
    let unsubCouponsCol = () => {};
    let unsubDestinationsCol = () => {};

    if (authReady) {
      // Bookings: Public read access now allowed by rules, operator gets all, customers can filter frontend
      unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
        console.log("Bookings snapshot received", snap.size);
        const allBookings = snap.docs.map(d => d.data() as Booking);
        const deviceId = getDeviceId();
        
        if (currentUser?.role === 'operator') {
          setBookings(allBookings);
        } else {
          // Show only bookings from this device
          setBookings(allBookings.filter(b => (b as any).deviceId === deviceId));
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, "bookings"));

      unsubCombosCol = onSnapshot(collection(db, "tour_combos"), (snap) => {
        if (snap.empty) {
          setCombos(INITIAL_COMBOS);
          if (currentUser?.role === 'operator' && auth.currentUser) {
            console.log("Seeding initial combos to tour_combos...");
            INITIAL_COMBOS.forEach(item => {
              setDoc(doc(db, "tour_combos", item.id), item).catch(console.error);
            });
          }
        } else {
          setCombos(snap.docs.map(d => d.data() as TourCombo));
        }
      });

      unsubAccCol = onSnapshot(collection(db, "accommodations"), (snap) => {
        if (snap.empty) {
          setAccommodations(INITIAL_ACCOMMODATIONS);
          if (currentUser?.role === 'operator' && auth.currentUser) {
            console.log("Seeding initial accommodations...");
            INITIAL_ACCOMMODATIONS.forEach(item => {
              setDoc(doc(db, "accommodations", item.id), item).catch(console.error);
            });
          }
        } else {
          setAccommodations(snap.docs.map(d => d.data() as Accommodation));
        }
      });

      unsubArticlesCol = onSnapshot(collection(db, "guide_articles"), (snap) => {
        if (snap.empty) {
          setArticles(INITIAL_ARTICLES);
          if (currentUser?.role === 'operator' && auth.currentUser) {
            console.log("Seeding initial guide articles...");
            INITIAL_ARTICLES.forEach(item => {
              setDoc(doc(db, "guide_articles", item.id), item).catch(console.error);
            });
          }
        } else {
          setArticles(snap.docs.map(d => d.data() as GuideArticle));
        }
      });

      unsubCouponsCol = onSnapshot(collection(db, "coupons"), (snap) => {
        if (snap.empty) {
          setCoupons(INITIAL_COUPONS);
          if (currentUser?.role === 'operator' && auth.currentUser) {
            console.log("Seeding initial coupons...");
            INITIAL_COUPONS.forEach(item => {
              setDoc(doc(db, "coupons", item.id), item).catch(console.error);
            });
          }
        } else {
          setCoupons(snap.docs.map(d => d.data() as Coupon));
        }
      });

      unsubDestinationsCol = onSnapshot(collection(db, "destinations"), (snap) => {
        if (snap.empty) {
          setDestinations(INITIAL_DESTINATIONS);
          if (currentUser?.role === 'operator' && auth.currentUser) {
            console.log("Seeding initial destinations...");
            INITIAL_DESTINATIONS.forEach(item => {
              setDoc(doc(db, "destinations", item.id), item).catch(console.error);
            });
          }
        } else {
          setDestinations(snap.docs.map(d => d.data() as Destination));
        }
      });
      
      if (currentUser?.role === 'operator' && auth.currentUser) {
         const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
           setUsers(snap.docs.map(d => d.data() as User));
         }, (error) => handleFirestoreError(error, OperationType.LIST, "users"));
         
         const originalUnsubBookings = unsubBookings;
         unsubBookings = () => { originalUnsubBookings(); unsubUsers(); };
      }

      // Blocked seats - public for reading to see availability
      unsubBlocked = onSnapshot(collection(db, "blocked_seats"), (snap) => {
         setBlockedSeats(snap.docs.map(d => d.data() as BlockedSeat));
      }, (error) => handleFirestoreError(error, OperationType.LIST, "blocked_seats"));

      // Configurations - public read from configs collection for global static params
      unsubConfigs = onSnapshot(collection(db, "configs"), (snap) => {
         if (!snap.empty) {
           snap.docs.forEach(docSnap => {
             const data = docSnap.data();
             if (data.limousineConfig) setLimousineConfig({ ...DEFAULT_LIMOUSINE_CONFIG, ...data.limousineConfig });
             if (data.sharedCarConfig) setSharedCarConfig({ ...DEFAULT_SHARED_CAR_CONFIG, ...data.sharedCarConfig });
             if (data.locations) setLocations(data.locations);
           });
         } else {
           // Create initial configs document quietly if operator exists (first run)
           if (currentUser?.role === 'operator' && auth.currentUser) {
             const initialData = {
               limousineConfig: DEFAULT_LIMOUSINE_CONFIG,
               sharedCarConfig: DEFAULT_SHARED_CAR_CONFIG,
               locations: INITIAL_LOCATIONS,
             };
             Object.entries(initialData).forEach(([key, val]) => {
               setDoc(doc(db, "configs", key), { [key]: val }).catch(console.error);
             });
           }
         }
      }, (error) => handleFirestoreError(error, OperationType.LIST, "configs"));

      // Notifications
      unsubNotifications = onSnapshot(collection(db, "notifications"), (snap) => {
        const allNotifs = snap.docs.map(d => d.data() as AppNotification);
        const deviceId = getDeviceId();
        
        const filtered = currentUser?.role === 'operator' 
          ? allNotifs 
          : allNotifs.filter(n => n.deviceId === deviceId || n.deviceId === "all");

        setNotifications(filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }, (error) => handleFirestoreError(error, OperationType.LIST, "notifications"));
    }

    return () => {
      unsubBookings();
      unsubBlocked();
      unsubConfigs();
      unsubNotifications();
      unsubCombosCol();
      unsubAccCol();
      unsubArticlesCol();
      unsubCouponsCol();
      unsubDestinationsCol();
    };
  }, [authReady, currentUser?.role, currentUser?.id]);

  useEffect(() => {
    const handleUpdate = () => {
      if (!auth.currentUser) {
        // Read from localStorage fallbacks
        
        const localBlocked = getLocalList<BlockedSeat>("blocked_seats", []);
        setBlockedSeats(localBlocked);
        
        const localUsers = getLocalList<User>("users", []);
        setUsers(localUsers);

        try {
          const configsStr = localStorage.getItem("xemc_configs");
          if (configsStr) {
            const parsed = JSON.parse(configsStr);
            if (parsed.limousineConfig) setLimousineConfig(parsed.limousineConfig);
            if (parsed.sharedCarConfig) setSharedCarConfig(parsed.sharedCarConfig);
            if (parsed.combos) setCombos(parsed.combos);
            if (parsed.accommodations) setAccommodations(parsed.accommodations);
            if (parsed.coupons) setCoupons(parsed.coupons);
            if (parsed.locations) setLocations(parsed.locations);
            if (parsed.destinations) setDestinations(parsed.destinations);
            if (parsed.articles) setArticles(parsed.articles);
          }
        } catch (e) {
          // ignore
        }
      }
    };

    window.addEventListener("xedimocchau_db_update", handleUpdate);
    // Initial read
    handleUpdate();

    return () => {
      window.removeEventListener("xedimocchau_db_update", handleUpdate);
    };
  }, [authReady, currentUser]);

  return {
    currentUser,
    setCurrentUser,
    authReady,
    bookings,
    setBookings,
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
    setArticles
  };
}
