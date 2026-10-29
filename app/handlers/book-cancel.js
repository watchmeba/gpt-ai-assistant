import { TYPE_SYSTEM } from '../../constants/command.js';
import { t } from '../../locales/index.js';
import {
  cancelBooking, getBookings, getDraft, removeDraft,
} from '../booking/index.js';
import { Command, COMMAND_BOT_BOOK_CANCEL } from '../commands/index.js';
import Context from '../context.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_BOOK_CANCEL);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    const [, id] = context.trimmedText.match(/#?(\d+)[。.!！?？]?$/) || [];
    if (!id && getDraft(context.userId)) {
      removeDraft(context.userId);
      context.pushText(t('__BOOKING_DRAFT_DISCARDED'));
      return context;
    }
    if (!id) {
      const bookings = getBookings(context.userId);
      if (bookings.length < 1) return context.pushText(t('__BOOKING_LIST_EMPTY'));
      const actions = bookings.slice(0, 13).map((booking) => new Command({
        type: TYPE_SYSTEM,
        label: `#${booking.id} ${booking.restaurant}`.slice(0, 20),
        text: `${COMMAND_BOT_BOOK_CANCEL.text} #${booking.id}`,
      }));
      context.pushText(t('__BOOKING_CANCEL_WHICH'), actions);
      return context;
    }
    const booking = cancelBooking(context.userId, Number(id));
    if (!booking) return context.pushText(t('__BOOKING_NOT_FOUND')(id));
    context.pushText(t('__BOOKING_CANCELLED')(booking.id, t('__BOOKING_SUMMARY')(booking)));
    return context;
  }
)();

export default exec;
