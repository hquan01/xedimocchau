import type { User as FirebaseUser } from "firebase/auth";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import type { User } from "../types";

export const WELCOME_BONUS_POINTS = 10;

// Some first-time Google visitors signed in just before this feature shipped.
// Their profile was created with zero points. Repair only those recently
// CREATED Firebase accounts without existing rewards or discounts.
// An existing long-standing account is not a new member.
const RECENT_NEW_ACCOUNT_DAYS = 14;
const recentlyCreated = (account: FirebaseUser): boolean => {
  const creationTime = Date.parse(account.metadata.creationTime || "");
  const age = Date.now() - creationTime;
  return Number.isFinite(creationTime) &&
    age >= 0 && age <= RECENT_NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
};

export interface WelcomeResult {
  profile: User;
  awarded: boolean;
  created: boolean;
}

/**
 * Make a customer's first membership profile and welcome +10 a single
 * Firestore transaction. Multiple tabs, Google sign-in, email registration
 * and the auth-state listener cannot credit the same UID twice.
 *
 * IMPORTANT: Existing legacy Firestore rules are permissive. A client-side
 * transaction protects against accidental duplicate awards, but is NOT an
 * anti-fraud guarantee. Securing wallet changes requires server-enforced rules.
 */
export async function ensureMemberWelcomeBonus(
  account: FirebaseUser,
  options: { preferredName?: string; preferredPhone?: string; isAdmin?: boolean } = {}
): Promise<WelcomeResult> {
  const memberRef = doc(db, "users", account.uid);
  const now = new Date().toISOString();
  const preferredName = options.preferredName?.trim() || "";
  const preferredPhone = options.preferredPhone?.trim() || "";

  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(memberRef);
    if (!snapshot.exists()) {
      const isAdmin = options.isAdmin === true;
      const baseProfile: User = {
        id: account.uid,
        email: account.email || "",
        name: preferredName || account.displayName || account.email || "Thành viên",
        phone: preferredPhone || account.phoneNumber || "",
        role: "customer",
        points: isAdmin ? 0 : WELCOME_BONUS_POINTS,
        ...(isAdmin ? {} : {
          welcomeBonusGranted: true,
          welcomeBonusPoints: WELCOME_BONUS_POINTS,
          welcomeBonusAt: now
        })
      };
      transaction.set(memberRef, { ...baseProfile, createdAt: now });
      return { profile: { ...baseProfile, role: isAdmin ? "operator" : "customer" } as User,
        awarded: !isAdmin, created: true };
    }

    const existing = snapshot.data() as User;
    const isAdmin = options.isAdmin === true || existing.role === "operator";
    const noPreviousRewards =
      (typeof existing.points !== "number" || existing.points === 0) &&
      !(existing.rewardedBookingIds?.length) &&
      !(existing.completedBookingsCount && existing.completedBookingsCount > 0) &&
      !(existing.usedCoupons?.length);
    const needsFirstTimeRepair = !isAdmin &&
      existing.welcomeBonusGranted !== true &&
      noPreviousRewards;

    const changes: Partial<User> = {};
    if (preferredName && preferredName !== existing.name) changes.name = preferredName;
    if (preferredPhone && preferredPhone !== existing.phone) changes.phone = preferredPhone;
    if (needsFirstTimeRepair) {
      changes.points = WELCOME_BONUS_POINTS;
      changes.welcomeBonusGranted = true;
      changes.welcomeBonusPoints = WELCOME_BONUS_POINTS;
      changes.welcomeBonusAt = now;
    }

    if (Object.keys(changes).length > 0)
      transaction.set(memberRef, changes, { merge: true });

    return {
      profile: {
        ...existing,
        ...changes,
        id: account.uid,
        email: account.email || existing.email,
        role: isAdmin ? "operator" : "customer"
      } as User,
      awarded: needsFirstTimeRepair,
      created: false
    };
  });
}
