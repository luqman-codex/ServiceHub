/**
 * Unit: booking state-machine adjacency (01 §5.3 / BOOKING_TRANSITIONS).
 * Pure table assertions — no DB.
 */
import { BookingStatus, BOOKING_TRANSITIONS } from '../../src/types/enums';

const ALL = Object.values(BookingStatus);

describe('BOOKING_TRANSITIONS adjacency table', () => {
  it('allows exactly the documented moves out of each state', () => {
    expect(new Set(BOOKING_TRANSITIONS[BookingStatus.PENDING])).toEqual(
      new Set([BookingStatus.ACCEPTED, BookingStatus.REJECTED, BookingStatus.CANCELLED]),
    );
    expect(new Set(BOOKING_TRANSITIONS[BookingStatus.ACCEPTED])).toEqual(
      new Set([BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED]),
    );
    expect(new Set(BOOKING_TRANSITIONS[BookingStatus.IN_PROGRESS])).toEqual(
      new Set([BookingStatus.COMPLETED, BookingStatus.CANCELLED]),
    );
  });

  it('treats REJECTED, COMPLETED, CANCELLED as terminal (no outgoing edges)', () => {
    expect(BOOKING_TRANSITIONS[BookingStatus.REJECTED]).toEqual([]);
    expect(BOOKING_TRANSITIONS[BookingStatus.COMPLETED]).toEqual([]);
    expect(BOOKING_TRANSITIONS[BookingStatus.CANCELLED]).toEqual([]);
  });

  it('denies the happy-path "shortcut" and "backwards" moves', () => {
    // cannot jump PENDING -> IN_PROGRESS / COMPLETED
    expect(BOOKING_TRANSITIONS[BookingStatus.PENDING]).not.toContain(BookingStatus.IN_PROGRESS);
    expect(BOOKING_TRANSITIONS[BookingStatus.PENDING]).not.toContain(BookingStatus.COMPLETED);
    // cannot accept a COMPLETED booking
    expect(BOOKING_TRANSITIONS[BookingStatus.COMPLETED]).not.toContain(BookingStatus.ACCEPTED);
    // cannot go IN_PROGRESS -> ACCEPTED (backwards)
    expect(BOOKING_TRANSITIONS[BookingStatus.IN_PROGRESS]).not.toContain(BookingStatus.ACCEPTED);
  });

  it('never lists a state as a transition to itself', () => {
    for (const state of ALL) {
      expect(BOOKING_TRANSITIONS[state]).not.toContain(state);
    }
  });

  it('covers every BookingStatus as a source key', () => {
    for (const state of ALL) {
      expect(BOOKING_TRANSITIONS[state]).toBeDefined();
    }
  });

  it('only references valid BookingStatus values as targets', () => {
    for (const targets of Object.values(BOOKING_TRANSITIONS)) {
      for (const t of targets) expect(ALL).toContain(t);
    }
  });
});
