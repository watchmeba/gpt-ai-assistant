const REQUIRED_FIELDS = ['restaurant', 'date', 'time', 'partySize'];

class Booking {
  id;

  restaurant;

  date;

  time;

  partySize;

  name;

  notes;

  constructor({
    id = null,
    restaurant = '',
    date = '',
    time = '',
    partySize = 0,
    name = '',
    notes = '',
  } = {}) {
    this.id = id;
    this.restaurant = restaurant;
    this.date = date;
    this.time = time;
    this.partySize = partySize;
    this.name = name;
    this.notes = notes;
  }

  /**
   * @returns {Array<string>}
   */
  get missingFields() {
    return REQUIRED_FIELDS.filter((field) => !this[field]);
  }

  get isComplete() {
    return this.missingFields.length < 1;
  }

  /**
   * @returns {Date}
   */
  get startsAt() {
    const [year, month, day] = this.date.split('-').map(Number);
    const [hours, minutes] = this.time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }

  /**
   * @param {Object} fields
   * @returns {Booking}
   */
  merge(fields) {
    Object.entries(fields)
      .filter(([, value]) => value)
      .forEach(([key, value]) => { this[key] = value; });
    return this;
  }
}

export {
  REQUIRED_FIELDS,
};

export default Booking;
