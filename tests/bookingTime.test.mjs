import assert from "node:assert/strict";
import test from "node:test";
import {
  getVietnamToday,
  getVietnamCurrentTime,
  getVietnamNextDepartureTime,
  isFutureDeparture,
} from "../src/lib/bookingTime.ts";

test("uses Asia/Ho_Chi_Minh time regardless of visitor timezone", () => {
  const now = Date.parse("2026-11-06T07:30:20.000Z"); // 14:30:20 in Viet Nam
  assert.equal(getVietnamToday(now), "2026-11-06");
  assert.equal(getVietnamCurrentTime(now), "14:30");
  assert.equal(getVietnamNextDepartureTime(now), "14:31");
  assert.equal(isFutureDeparture("2026-11-06", "14:30", now), false);
  assert.equal(isFutureDeparture("2026-11-06", "14:31", now), true);
  assert.equal(isFutureDeparture("2026-11-05", "23:59", now), false);
  assert.equal(isFutureDeparture("2026-11-07", "00:00", now), true);
});

test("rejects malformed or impossible departure dates", () => {
  const now = Date.parse("2026-11-06T07:30:20.000Z");
  assert.equal(isFutureDeparture("2026-02-30", "15:00", now), false);
  assert.equal(isFutureDeparture("2026-11-08", "25:00", now), false);
  assert.equal(isFutureDeparture("today", "10:00", now), false);
});

test("rolls over at midnight without offering elapsed hours", () => {
  const now = Date.parse("2026-11-06T16:59:30.000Z"); // 23:59:30 VN
  assert.equal(getVietnamNextDepartureTime(now), "");
  assert.equal(isFutureDeparture("2026-11-06", "23:59", now), false);
  assert.equal(isFutureDeparture("2026-11-07", "00:00", now), true);
});
