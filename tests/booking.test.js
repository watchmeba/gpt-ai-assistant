import { afterEach, expect, test } from '@jest/globals';
import { getBookings, handleEvents, removeBookings } from '../app/index.js';
import { parseBooking } from '../app/booking/index.js';
import {
  COMMAND_BOT_BOOK, COMMAND_BOT_BOOK_CANCEL, COMMAND_BOT_BOOK_CONFIRM, COMMAND_BOT_BOOK_LIST,
} from '../app/commands/index.js';
import { t } from '../locales/index.js';
import { createEvents, MOCK_USER_01, TIMEOUT } from './utils.js';

const send = async (text) => {
  const [context] = await handleEvents(createEvents([text]));
  return context.messages.map((message) => message.text);
};

afterEach(() => {
  removeBookings(MOCK_USER_01);
});

test('parseBooking', () => {
  const now = new Date(2026, 9, 29, 12); // Thursday
  expect(parseBooking('Sushi Dai for 4 tomorrow at 7pm with window seat', now)).toEqual({
    restaurant: 'Sushi Dai', date: '2026-10-30', time: '19:00', partySize: 4, notes: 'window seat',
  });
  expect(parseBooking('at Le Bernardin on friday 19:30 for two', now)).toMatchObject({
    restaurant: 'Le Bernardin', date: '2026-10-30', time: '19:30', partySize: 2,
  });
  expect(parseBooking('Nobu, 6 people, 11/3 8pm, note: birthday cake', now)).toMatchObject({
    restaurant: 'Nobu', date: '2026-11-03', time: '20:00', partySize: 6, notes: 'birthday cake',
  });
  expect(parseBooking('明天晚上7點 鼎泰豐 4位', now)).toMatchObject({
    restaurant: '鼎泰豐', date: '2026-10-30', time: '19:00', partySize: 4,
  });
  expect(parseBooking('7pm', now)).toMatchObject({ restaurant: '', time: '19:00' });
});

test('COMMAND_BOT_BOOK', async () => {
  let replies = await send(`${COMMAND_BOT_BOOK.text} Sushi Dai 2099-01-15`);
  expect(replies[0]).toContain(t('__BOOKING_FIELDS').time);
  expect(replies[0]).toContain(t('__BOOKING_FIELDS').partySize);

  replies = await send(`${COMMAND_BOT_BOOK.text} 7pm for 2`);
  expect(replies[0]).toContain('Sushi Dai');
  expect(replies[0]).toContain('19:00');

  replies = await send(COMMAND_BOT_BOOK_CONFIRM.text);
  expect(replies[0]).toContain(t('__BOOKING_REQUEST')(getBookings(MOCK_USER_01)[0]));
  expect(getBookings(MOCK_USER_01)).toHaveLength(1);

  replies = await send(`${COMMAND_BOT_BOOK.text} Nobu 2099-01-15 20:00 for 4`);
  expect(replies[0]).toContain('#1');

  replies = await send(COMMAND_BOT_BOOK_CANCEL.text);
  expect(replies).toEqual([t('__BOOKING_DRAFT_DISCARDED')]);

  replies = await send(COMMAND_BOT_BOOK_LIST.text);
  expect(replies[0]).toContain('Sushi Dai');

  replies = await send(`${COMMAND_BOT_BOOK_CANCEL.text} #1`);
  expect(getBookings(MOCK_USER_01)).toHaveLength(0);

  replies = await send(COMMAND_BOT_BOOK_LIST.text);
  expect(replies).toEqual([t('__BOOKING_LIST_EMPTY')]);
}, TIMEOUT);

test('COMMAND_BOT_BOOK in the past', async () => {
  const replies = await send(`${COMMAND_BOT_BOOK.text} Nobu 2000-01-01 20:00 for 2`);
  expect(replies).toEqual([t('__BOOKING_PAST')]);
}, TIMEOUT);
