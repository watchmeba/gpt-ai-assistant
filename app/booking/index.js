import Booking, { REQUIRED_FIELDS } from './booking.js';
import { getNow } from './clock.js';
import { formatDate, parseBooking } from './parse.js';

const drafts = new Map();
const bookings = new Map();

const CONFLICT_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * @param {string} userId
 * @returns {Booking|undefined}
 */
const getDraft = (userId) => drafts.get(userId);

/**
 * @param {string} userId
 * @param {Booking} draft
 */
const setDraft = (userId, draft) => {
  drafts.set(userId, draft);
};

/**
 * @param {string} userId
 */
const removeDraft = (userId) => {
  drafts.delete(userId);
};

/**
 * @param {string} userId
 * @param {Date} now
 * @returns {Array<Booking>}
 */
const getBookings = (userId, now = getNow()) => (bookings.get(userId) || [])
  .filter((booking) => booking.startsAt >= now)
  .sort((a, b) => a.startsAt - b.startsAt);

/**
 * @param {string} userId
 * @param {Booking} booking
 * @returns {Booking}
 */
const addBooking = (userId, booking) => {
  const list = bookings.get(userId) || [];
  const id = list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const saved = new Booking({ ...booking, id });
  bookings.set(userId, [...list, saved]);
  return saved;
};

/**
 * @param {string} userId
 * @param {number} id
 * @returns {Booking|undefined}
 */
const cancelBooking = (userId, id) => {
  const list = bookings.get(userId) || [];
  const booking = list.find((item) => item.id === id);
  if (booking) bookings.set(userId, list.filter((item) => item !== booking));
  return booking;
};

/**
 * @param {string} userId
 */
const removeBookings = (userId) => {
  bookings.delete(userId);
  drafts.delete(userId);
};

/**
 * @param {string} userId
 * @param {Booking} booking
 * @returns {Booking|undefined}
 */
const findConflict = (userId, booking) => getBookings(userId, new Date(0))
  .find((item) => Math.abs(item.startsAt - booking.startsAt) < CONFLICT_WINDOW_MS);

export {
  Booking,
  REQUIRED_FIELDS,
  addBooking,
  cancelBooking,
  findConflict,
  formatDate,
  getBookings,
  getNow,
  getDraft,
  parseBooking,
  removeBookings,
  removeDraft,
  setDraft,
};
