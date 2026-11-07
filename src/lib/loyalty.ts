import type { Booking, User } from '../types';

// The member wallet conversion rate and welcome bonus remain unchanged.
// A newly confirmed paid seat now earns exactly one reward point.
export const POINT_VALUE_VND = 1000;
export const POINTS_PER_SEAT = 1;

// Old confirmed orders were credited a flat +1 before this policy.
// Preserve that exact historical amount when such an order is cancelled.
export const LEGACY_POINTS_PER_CONFIRMED_BOOKING = 1;
const MAX_REASONABLE_SEATS = 200;

function validSeatCount(value:unknown):number {
  return typeof value === 'number' && Number.isInteger(value) &&
    value > 0 && value <= MAX_REASONABLE_SEATS ? value : 0;
}

/**
 * Reward only actual transport seats shown on the booking, not the number
 * of order records. Limousine/shared-car bookings store one string like
 * ["10 chỗ Limousine"] and also have seatCount=10. Combo bookings store
 * one seatNumbers entry per paid passenger.
 *
 * Charter vehicles are sold by whole vehicle, not per paid seat; no seat
 * reward is inferred for them. Missing/invalid seat counts earn no points
 * rather than inventing a quantity.
 */
export function rewardPointsForBooking(booking:Pick<Booking,'type'|'seatCount'|'seatNumbers'>):number {
  if(!['limousine','shared_car','combo'].includes(booking.type))return 0;
  const explicit=validSeatCount(booking.seatCount);
  if(explicit)return explicit*POINTS_PER_SEAT;
  const entries=Array.isArray(booking.seatNumbers)?
    booking.seatNumbers.filter((entry):entry is string=>typeof entry==='string'&&entry.trim().length>0):[];
  if(entries.length===1){
    const multi=entries[0].match(/^\s*(\d+)\s*(?:chỗ|ghế)(?:\s|$)/i);
    const count=multi?validSeatCount(Number(multi[1])):0;
    if(count)return count*POINTS_PER_SEAT;
  }
  return validSeatCount(entries.length)*POINTS_PER_SEAT;
}

/** Snapshot of actual points earned for this booking. For pre-migration
 * rewarded IDs with no saved snapshot, use the original fixed +1 credit.
 */
export function creditedPointsForBooking(booking:Pick<Booking,'rewardPointsAwarded'>|null|undefined):number {
  const saved=booking?.rewardPointsAwarded;
  return validSeatCount(saved)||LEGACY_POINTS_PER_CONFIRMED_BOOKING;
}

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
