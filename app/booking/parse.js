import { getNow } from './clock.js';

const ZH_WEEKDAYS = '日天一二三四五六';

const ZH_DIGITS = {
  零: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

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

/**
 * @param {string} numeral e.g. "七", "十二", "二十五"
 * @returns {number}
 */
const fromChineseNumeral = (numeral) => {
  if (!numeral.includes('十')) return Number([...numeral].map((c) => ZH_DIGITS[c]).join(''));
  const [tens, ones] = numeral.split('十');
  return (tens ? ZH_DIGITS[tens] : 1) * 10 + (ones ? ZH_DIGITS[ones] : 0);
};

/**
 * Convert full-width characters and Chinese numerals used as counts, times
 * and dates (e.g. "四位", "七點", "十二月五日") to ASCII digits. Numerals in
 * names, such as "一蘭", are left alone.
 * @param {string} text
 * @returns {string}
 */
const normalize = (text) => text
  .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  .replace(/：/g, ':')
  .replace(/[零一二兩三四五六七八九十]{1,3}(?=\s*(?:點|位|人|名|月|日|號|分))/g, fromChineseNumeral);

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
  m = text.match(/(\d{1,2})月(\d{1,2})[日號]/);
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
  m = text.match(new RegExp(`(這|本|下)?(?:個)?(?:星期|禮拜|週|周)([${ZH_WEEKDAYS}])`));
  if (m) {
    const target = Math.max(ZH_WEEKDAYS.indexOf(m[2]) - 1, 0);
    if (m[1] === '下') {
      const monday = addDays(now, -((now.getDay() + 6) % 7));
      return { value: formatDate(addDays(monday, 7 + ((target + 6) % 7))), match: m[0] };
    }
    const days = (target - now.getDay() + 7) % 7;
    return { value: formatDate(addDays(now, days)), match: m[0] };
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
  m = text.match(/(晚上|傍晚|下午|中午|早上|上午)?(\d{1,2})點(?:(半)|(\d{1,2})分)?/);
  if (m) {
    let hours = Number(m[2]);
    if (['晚上', '傍晚', '下午'].includes(m[1]) && hours < 12) hours += 12;
    const minutes = m[3] ? '30' : pad(m[4] || '00');
    return { value: `${pad(hours)}:${minutes}`, match: m[0] };
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
const parseBooking = (text, now = getNow()) => {
  let rest = ` ${normalize(text)} `;
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
