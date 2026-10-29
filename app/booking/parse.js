const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

const pad = (n) => String(n).padStart(2, '0');

/**
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/**
 * @param {string} text
 * @param {Date} now
 * @returns {{ value: string, match: string }|null}
 */
const parseDate = (text, now) => {
  let m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return { value: `${m[1]}-${pad(m[2])}-${pad(m[3])}`, match: m[0] };
  m = text.match(/(?:\bon\s+)?\b(\d{1,2})\/(\d{1,2})\b/i);
  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    let date = new Date(now.getFullYear(), month - 1, day);
    if (date < addDays(now, 0)) date = new Date(now.getFullYear() + 1, month - 1, day);
    return { value: formatDate(date), match: m[0] };
  }
  const relatives = [
    [/\b(?:today|tonight)\b|今天|今晚|今日/i, 0],
    [/\btomorrow\b|明天|明晚|明日/i, 1],
    [/後天|后天/, 2],
  ];
  const relative = relatives.find(([pattern]) => pattern.test(text));
  if (relative) {
    const [pattern, days] = relative;
    return { value: formatDate(addDays(now, days)), match: text.match(pattern)[0] };
  }
  m = text.match(new RegExp(`(?:\\b(?:on|this|next)\\s+)?\\b(${WEEKDAYS.join('|')})\\b`, 'i'));
  if (m) {
    const target = WEEKDAYS.indexOf(m[1].toLowerCase());
    const days = ((target - now.getDay() + 7) % 7) || 7;
    return { value: formatDate(addDays(now, days)), match: m[0] };
  }
  return null;
};

/**
 * @param {string} text
 * @returns {{ value: string, match: string }|null}
 */
const parseTime = (text) => {
  let m = text.match(/(?:\bat\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (m) {
    let hours = Number(m[1]) % 12;
    if (m[3].toLowerCase() === 'pm') hours += 12;
    return { value: `${pad(hours)}:${m[2] || '00'}`, match: m[0] };
  }
  m = text.match(/(?:\bat\s+)?\b([01]?\d|2[0-3]):([0-5]\d)\b/i);
  if (m) return { value: `${pad(m[1])}:${m[2]}`, match: m[0] };
  m = text.match(/(晚上|下午|中午|早上)?(\d{1,2})點(半)?/);
  if (m) {
    let hours = Number(m[2]);
    if ((m[1] === '晚上' || m[1] === '下午') && hours < 12) hours += 12;
    return { value: `${pad(hours)}:${m[3] ? '30' : '00'}`, match: m[0] };
  }
  if (/\bnoon\b/i.test(text)) return { value: '12:00', match: text.match(/(?:\bat\s+)?\bnoon\b/i)[0] };
  return null;
};

/**
 * @param {string} text
 * @returns {{ value: number, match: string }|null}
 */
const parsePartySize = (text) => {
  const words = Object.keys(NUMBER_WORDS).join('|');
  let m = text.match(new RegExp(`\\b(?:for|party of|table for)\\s+(\\d{1,2}|${words})\\b(?!\\s*(?::|am|pm))`, 'i'));
  if (!m) m = text.match(new RegExp(`\\b(\\d{1,2}|${words})\\s*(?:people|persons|pax|guests|adults)\\b`, 'i'));
  if (!m) m = text.match(/(\d{1,2})\s*(?:位|人|名)/);
  if (!m) return null;
  const value = NUMBER_WORDS[m[1].toLowerCase()] || Number(m[1]);
  return value > 0 ? { value, match: m[0] } : null;
};

/**
 * @param {string} text
 * @returns {{ value: string, match: string }|null}
 */
const parseNotes = (text) => {
  const m = text.match(/(?:\bnotes?:|\brequests?:|備註[:：]?|\bwith\b)\s*(.+)$/i);
  return m ? { value: m[1].trim(), match: m[0] } : null;
};

/**
 * @param {string} text
 * @returns {string}
 */
const parseRestaurant = (text) => {
  const m = text.match(/(?:\bat\b|@|在)\s*([^\d,，][^,，]*)/i);
  const candidate = (m ? m[1] : text)
    .replace(/\b(?:a\s+)?table\b|\bbook(?:ing)?\b|\breserve\b|\bplease\b|訂位/gi, '')
    .replace(/[\s,，.。!！?？]+/g, ' ')
    .trim();
  return candidate;
};

/**
 * Extract booking fields from a free-text request, e.g.
 * "Sushi Dai for 4 tomorrow at 7pm with window seat".
 * @param {string} text
 * @param {Date} now
 * @returns {Object}
 */
const parseBooking = (text, now = new Date()) => {
  let rest = ` ${text} `;
  const take = (result) => {
    if (result) rest = rest.replace(result.match, ' ');
    return result ? result.value : undefined;
  };
  const notes = take(parseNotes(rest));
  const date = take(parseDate(rest, now));
  const time = take(parseTime(rest));
  const partySize = take(parsePartySize(rest));
  const restaurant = parseRestaurant(rest);
  return {
    restaurant, date, time, partySize, notes,
  };
};

export {
  formatDate,
  parseBooking,
};

export default parseBooking;
