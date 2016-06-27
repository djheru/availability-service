import moment from 'moment';
import 'moment-range';

const defaultOptions = {
  gapRules: [ 1 ],
  idKey: 'siteId',
  startKey: 'startDate',
  endKey: 'endDate'
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const DATE_FORMAT = 'YYYY-MM-DD';

export default class AvailabilityService {

  constructor(options) {
    this._options = Object.assign(defaultOptions, options);

    // Stores the requested dates
    this._startDate = null;
    this._endDate = null;
    this._requestedRange = null;

    // Stores the id of sites that contain an overlapping reservation
    this._unavailableSites = [];

    // Bounded context for callback functions
    this.parseReservations = this.parseReservations.bind(this);
    this.filterOverlappingReservations = this.filterOverlappingReservations.bind(this);
    this.filterUnavailableSites = this.filterUnavailableSites.bind(this);
    this.checkSiteAvailability = this.checkSiteAvailability.bind(this);
  }

  /**
   * Transform an array of reservation input objects into an array of site objects that contain
   * a unique identifier and an array of the reservations for that site
   * @param parsedReservations - an accumulator array
   * @param reservationObject - An object containing options.idKey, options.startKey and options.endKey as keys
   * @returns {Array} - An array of objects similar to: { "campsiteId": 1, "reservations": [ res1, res2, ... ] }
   * where each reservation is an array like [ moment(resStart, DATE_FORMAT), moment(resEnd, DATE_FORMAT) ]
   */
  parseReservations(parsedReservations, reservationObject) {

    // The names of the keys in each reservation object (e.g. "startDate", "endDate", "campsiteId")
    const {startKey, endKey, idKey} = this._options;
    const resId = reservationObject[idKey]; // The site Id

    // We're creating an array of these to represent the reservations for each site
    const dateRange = [
      moment(reservationObject[startKey], DATE_FORMAT),
      moment(reservationObject[endKey], DATE_FORMAT)
    ];

    // Is there already an object representing this site?
    const currentSiteIndex = parsedReservations.findIndex((el, i) => el[idKey] === resId);

    // If we already have an object for this site, push the reservation onto the array
    if (currentSiteIndex >= 0) {
      parsedReservations[currentSiteIndex].reservations.push(dateRange);
    } else {
      // create an object to represent this site, then create an array to hold the reservations
      const newSite = {reservations: [dateRange]};

      newSite[idKey] = resId; // A unique identifier for each site
      parsedReservations.push(newSite); // add to the accumulator
    }

    return parsedReservations;
  }

  /**
   * Sorts reservations based on the start date
   * @param reservationA
   * @param reservationB
   * @returns {number}
   */
  sortReservations(reservationA, reservationB) {
    if(reservationA[0].isSame(reservationB[0])) {
      return 0;
    }
    return (reservationA[0].isBefore(reservationB[0])) ? -1 : 1;
  }

  /**
   * Removes reservations that overlap the requested date range
   * @param reservation
   * @returns {boolean}
   */
  filterOverlappingReservations(reservation) {
    const {startKey, endKey, idKey} = this._options;
    // remove the reservations that overlap with the requestedRange
    const reservationRange = moment.range(
      moment(reservation[startKey], DATE_FORMAT),
      moment(reservation[endKey], DATE_FORMAT)
    );

    if (reservationRange.overlaps(this._requestedRange)) {
      this._unavailableSites.push(reservation[idKey]);
      return false;
    }
    return true;
  }

  /**
   * Removes sites that have a reservation that overlaps the requested date range
   * @param reservation
   * @returns {boolean}
   */
  filterUnavailableSites(reservation) {
    const {idKey} = this._options;

    return (this._unavailableSites.indexOf(reservation[idKey]) === -1);
  }

  /**
   * Checks whether a given site has availability for the requested date range
   * @param site
   * @returns {Number|Boolean} Returns the site Id if the site has availability or false if not
   */
  checkSiteAvailability(site) {
    const {idKey, gapRules} = this._options;
    const minGap = gapRules.sort().slice(0, 1); // Use the smallest gap rule

    // sort the reservation ranges by start date
    site.reservations.sort(this.sortReservations);

    // find the first reservation with the startDate after the endDate of the requested range
    const afterIndex = site.reservations.findIndex(reservation => reservation[0].isAfter(this._endDate));

    let openingStart, openingEnd; // Create a date range to represent the opening we're trying to fit into

    if (afterIndex === -1) {
      // The requested range is after all existing reservations. We only have to check the front gap
      openingStart = site.reservations[site.reservations.length - 1];
      openingEnd = this._endDate; //
    } else if (afterIndex === 0) {
      // The requested range is before all existing reservations. We only have to check the end gap
      openingStart = this._startDate;
      openingEnd = site.reservations[0];
    } else {
      // The requested range is between two existing reservations. Check both gaps.
      openingStart = site.reservations[afterIndex - 1][1];
      openingEnd = site.reservations[afterIndex][0];
    }

    // Mind the gap
    const frontGap = moment.range(openingStart, this._startDate).valueOf() / DAY_IN_MS;
    const backGap = moment.range(this._endDate, openingEnd).valueOf() / DAY_IN_MS;

    // Return false if the gap size is invalid
    return (frontGap > minGap || backGap > minGap) ? false : site[idKey];
  }

  checkAvailability(start, end, reservationCollection = []) {
    this._startDate = moment(start, DATE_FORMAT);
    this._endDate = moment(end, DATE_FORMAT);
    this._requestedRange = moment.range(this._startDate, this._endDate);

    return reservationCollection
      .filter(this.filterOverlappingReservations)
      .filter(this.filterUnavailableSites)
      .reduce(this.parseReservations, [])
      .map(this.checkSiteAvailability)
      .filter(siteId => siteId);
  }
}
