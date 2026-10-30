import { t } from '../../locales/index.js';
import { addBooking, getDraft, removeDraft } from '../booking/index.js';
import { COMMAND_BOT_BOOK_CONFIRM, COMMAND_BOT_BOOK_DEMO, COMMAND_BOT_BOOK_LIST } from '../commands/index.js';
import Context from '../context.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_BOOK_CONFIRM);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    const draft = getDraft(context.userId);
    if (!draft || !draft.isComplete) {
      context.pushText(t('__BOOKING_NO_DRAFT'), [COMMAND_BOT_BOOK_DEMO]);
      return context;
    }
    const booking = addBooking(context.userId, draft);
    removeDraft(context.userId);
    const summary = t('__BOOKING_SUMMARY')(booking);
    context.pushText(t('__BOOKING_CONFIRMED')(booking.id, summary, t('__BOOKING_REQUEST')(booking)), [COMMAND_BOT_BOOK_LIST]);
    return context;
  }
)();

export default exec;
