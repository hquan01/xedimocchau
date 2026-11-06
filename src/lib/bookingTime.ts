// A journey departs in Viet Nam (UTC+7), not in the visitor's browser timezone.
// Keep this module independent of React/Firebase for consistent booking validation.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getVietnamToday(nowMs: number = Date.now()): string {
  return new Date(nowMs + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function getVietnamCurrentTime(nowMs: number = Date.now()): string {
  return new Date(nowMs + VN_OFFSET_MS).toISOString().slice(11, 16);
}

// Returns an empty string when there is no minute remaining today.
export function getVietnamNextDepartureTime(nowMs: number = Date.now()): string {
  const nextMinuteMs = Math.floor(nowMs / 60000) * 60000 + 60000;
  if (getVietnamToday(nextMinuteMs) !== getVietnamToday(nowMs)) return "";
  return getVietnamCurrentTime(nextMinuteMs);
}

export function isFutureDeparture(date: string, time: string, nowMs: number = Date.now()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return false;
  }
  const timestamp = Date.parse(`${date}T${time}:00+07:00`);
  if (!Number.isFinite(timestamp)) return false;
  // Reject impossible dates too (e.g. February 30).
  if (new Date(timestamp + VN_OFFSET_MS).toISOString().slice(0, 10) !== date) return false;
  return timestamp > nowMs;
}

export const PAST_DEPARTURE_MESSAGE =
  "Ngày hoặc giờ khởi hành đã qua theo giờ Việt Nam. Vui lòng chọn chuyến trong tương lai.";
