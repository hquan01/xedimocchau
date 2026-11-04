import type { User } from '../types';

// Published policy: one point after the operator confirms a booked trip;
// accumulated points may be used on the next and later confirmed bookings.
export const POINT_VALUE_VND = 1000;
export const POINTS_PER_CONFIRMED_BOOKING = 1;

export function previousConfirmedBookings(user: User | null | undefined): number {
  if (!user || user.role !== 'customer') return 0;
  const tracked = Array.isArray(user.rewardedBookingIds) ? user.rewardedBookingIds.length : 0;
  const legacy = typeof user.completedBookingsCount === 'number'
    ? Math.max(0, Math.floor(user.completedBookingsCount)) : 0;
  return Math.max(tracked, legacy);
}

export function eligibleForNextBookingReward(user: User | null | undefined): boolean {
  return previousConfirmedBookings(user) >= 1;
}

export function redeemablePoints(user: User | null | undefined): number {
  if (!eligibleForNextBookingReward(user)) return 0;
  return Math.max(0, Math.min(1000, Math.floor(user?.points || 0)));
}
