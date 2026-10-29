import { t } from '../../locales/index.js';
import { getBookings } from '../booking/index.js';
import { COMMAND_BOT_BOOK_DEMO, COMMAND_BOT_BOOK_LIST } from '../commands/index.js';
import Context from '../context.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_BOOK_LIST);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    const bookings = getBookings(context.userId);
    if (bookings.length < 1) {
      context.pushText(t('__BOOKING_LIST_EMPTY'), [COMMAND_BOT_BOOK_DEMO]);
      return context;
    }
    const items = bookings.map((booking) => `#${booking.id}\n${t('__BOOKING_SUMMARY')(booking)}`);
    context.pushText([t('__BOOKING_LIST_TITLE'), ...items].join('\n\n'));
    return context;
  }
)();

export default exec;
