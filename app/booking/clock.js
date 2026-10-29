import config from '../../config/index.js';

/**
 * Current wall-clock time in APP_TIMEZONE, as a Date whose local fields hold
 * that time. Booking dates and times are wall-clock values in the same zone,
 * so they compare correctly whatever the server's own time zone is.
 * @param {Date} date
 * @returns {Date}
 */
const getNow = (date = new Date()) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: config.APP_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date).map(({ type, value }) => [type, Number(value)]));
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
};

export {
  getNow,
};

export default getNow;
