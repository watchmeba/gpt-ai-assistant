import { t } from '../../locales/index.js';
import {
  findConflict, getDraft, getNow, parseBooking, setDraft, Booking,
} from '../booking/index.js';
import { COMMAND_BOT_BOOK, COMMAND_BOT_BOOK_CANCEL, COMMAND_BOT_BOOK_CONFIRM } from '../commands/index.js';
import Context from '../context.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_BOOK);

/**
 * @param {Context} context
 * @returns {string}
 */
const stripCommand = (context) => {
  const content = context.trimmedText;
  const prefix = [COMMAND_BOT_BOOK.text, ...COMMAND_BOT_BOOK.aliases]
    .sort((a, b) => b.length - a.length)
    .find((alias) => content.toLowerCase().startsWith(alias.toLowerCase()));
  return content.slice(prefix.length).replace(/[。.!！?？]$/, '').trim();
};

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    const fields = parseBooking(stripCommand(context));
    const draft = getDraft(context.userId) || new Booking({ name: context.source.name });
    draft.merge(fields);
    const summary = t('__BOOKING_SUMMARY')(draft);
    if (!draft.isComplete) {
      setDraft(context.userId, draft);
      const missing = draft.missingFields.map((field) => t('__BOOKING_FIELDS')[field]).join(', ');
      context.pushText(t('__BOOKING_MISSING')(summary, missing), [COMMAND_BOT_BOOK_CANCEL]);
      return context;
    }
    if (draft.startsAt < getNow()) {
      draft.time = '';
      setDraft(context.userId, draft);
      context.pushText(t('__BOOKING_PAST'), [COMMAND_BOT_BOOK_CANCEL]);
      return context;
    }
    setDraft(context.userId, draft);
    const conflict = findConflict(context.userId, draft);
    if (conflict) context.pushText(t('__BOOKING_CONFLICT')(conflict.id, conflict.restaurant, `${conflict.date} ${conflict.time}`));
    context.pushText(t('__BOOKING_REVIEW')(summary), [COMMAND_BOT_BOOK_CONFIRM, COMMAND_BOT_BOOK_CANCEL]);
    return context;
  }
)();

export default exec;
