import chai from 'chai';
import AvailabilityService from './index.js';
import testCase from '../test-case';

import moment from 'moment';
import 'moment-range';

chai.expect();

const expect = chai.expect;

let availabilityService;
let options = {
  gapRules: [ 2, 3 ],
  idKey: 'campsiteId',
  startKey: 'startDate',
  endKey: 'endDate'
};

describe('Given an instance of my the AvailabilityService', function () {

  describe('Class Instantiation', function () {

    before(function () {
      availabilityService = new AvailabilityService(options);
    });

    it('Should set the options passed to the constructor', function () {
      expect(availabilityService._options.gapRules).to.equal(options.gapRules);
      expect(availabilityService._options.idKey).to.equal(options.idKey);
      expect(availabilityService._options.startDate).to.equal(options.startDate);
      expect(availabilityService._options.endDate).to.equal(options.endDate);
    });
  });

  describe('.parseReservations()', function () {

    it('Should create an array with one element for each siteId', function () {
      before(function () {
        availabilityService = new AvailabilityService(options);
      });

      const parsed = availabilityService.parseReservations([], testCase.reservations[0]);
      expect(parsed).to.be.an('array');
      expect(parsed.length).to.equal(1);
      expect(parsed[0][options.idKey]).to.equal(testCase.reservations[0][options.idKey]);
      expect(parsed[0].reservations).to.be.an('array');
      expect(parsed[0].reservations.length).to.equal(1);

      const parsed2 = availabilityService.parseReservations(parsed, testCase.reservations[1]);
      expect(parsed2).to.be.an('array');
      expect(parsed2.length).to.equal(1);
      expect(parsed2[0][options.idKey]).to.equal(parsed[0][options.idKey]);
      expect(parsed2[0].reservations.length).to.equal(2);
    });

    it('Should save the reservations as an array of moment objects', function () {
      before(function () {
        availabilityService = new AvailabilityService(options);
      });

      const parsed = availabilityService.parseReservations([], testCase.reservations[0]);
      expect(parsed[0].reservations[0].length).to.equal(2);
      expect(moment.isMoment(parsed[0].reservations[0][0])).to.be.ok;
      expect(moment.isMoment(parsed[0].reservations[0][1])).to.be.ok;
    });

    it('Should base the moment objects on the date strings in the source reservation', function () {
      before(function () {
        availabilityService = new AvailabilityService(options);
      });

      const parsed = availabilityService.parseReservations([], testCase.reservations[0]);
      expect(parsed[0].reservations[0][0].format('YYYY-MM-DD')).to.equal(testCase.reservations[0].startDate);
      expect(parsed[0].reservations[0][1].format('YYYY-MM-DD')).to.equal(testCase.reservations[0].endDate);
    });

  });

  describe('.sortReservations()', function () {

    before(function () {
      availabilityService = new AvailabilityService(options);
    });

    it('Should order the reservations based on the startKey', function () {
      const reservations = [
        [ moment('2000-01-03', 'YYYY-MM-DD'), moment('2000-01-04', 'YYYY-MM-DD') ],
        [ moment('2000-01-09', 'YYYY-MM-DD'), moment('2000-01-10', 'YYYY-MM-DD') ],
        [ moment('2000-01-05', 'YYYY-MM-DD'), moment('2000-01-06', 'YYYY-MM-DD') ],
        [ moment('2000-01-07', 'YYYY-MM-DD'), moment('2000-01-08', 'YYYY-MM-DD') ],
        [ moment('2000-01-01', 'YYYY-MM-DD'), moment('2000-01-02', 'YYYY-MM-DD') ]
      ];
      const sorted = reservations.sort(availabilityService.sortReservations);

      for(let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i][0].isBefore(sorted[i + 1][0])).to.be.ok;
      }
    });
  });

  describe('.filterOverlappingReservations()', function () {

    before(function () {
      availabilityService = new AvailabilityService(options);
      availabilityService._requestedRange = moment.range(
        moment('2000-01-02', 'YYYY-MM-DD'),
        moment('2000-01-10', 'YYYY-MM-DD')
      );
    });

    it('Should return false if the requestedRange starts before the existing reservation ends', function () {
      const reservation = {"campsiteId": 1, "startDate": "2000-01-01", "endDate": "2000-01-04"};
      const filtered = availabilityService.filterOverlappingReservations(reservation);
      expect(filtered).to.be.false;
    });

    it('Should return false if the requestedRange ends after the existing reservation starts', function () {
      const reservation = {"campsiteId": 1, "startDate": "2000-01-09", "endDate": "2000-01-12"};
      const filtered = availabilityService.filterOverlappingReservations(reservation);
      expect(filtered).to.be.false;
    });

    it('Should return true if the requested range and the existing reservation do not intersect', function () {
      const reservation = {"campsiteId": 1, "startDate": "2000-01-11", "endDate": "2000-01-12"};
      const filtered = availabilityService.filterOverlappingReservations(reservation);
      expect(filtered).to.be.true;
    });
  });

  describe('.filterUnavailableSites()', function () {

    before(function () {
      availabilityService = new AvailabilityService(options);
      availabilityService._unavailableSites = [ 1, 2, 3 ];
    });

    it('Should return false if the reservation siteId is present in the unavailable sites', function () {
      const reservation = {"campsiteId": 1, "startDate": "2000-01-09", "endDate": "2000-01-12"};
      expect(availabilityService.filterUnavailableSites(reservation)).to.be.false;
    });

    it('Should return true if the reservation siteId is not present in the unavailable sites', function () {
      const reservation = {"campsiteId": 8675309, "startDate": "2000-01-09", "endDate": "2000-01-12"};
      expect(availabilityService.filterUnavailableSites(reservation)).to.be.true;
    });
  });

  describe('.checkSiteAvailability()', function () {
    before(function () {
      availabilityService = new AvailabilityService(options);
      availabilityService._startDate = moment('2000-01-10', 'YYYY-MM-DD');
      availabilityService._endDate = moment('2000-01-14', 'YYYY-MM-DD');
    });

    it('Should return false if the created front gap would be too large', function () {
      const site = {
        campsiteId: 1,
        reservations: [
          [ moment('2000-01-01', 'YYYY-MM-DD'), moment('2000-01-07', 'YYYY-MM-DD') ],
          [ moment('2000-01-15', 'YYYY-MM-DD'), moment('2000-01-18', 'YYYY-MM-DD') ]
        ]
      };
      expect(availabilityService.checkSiteAvailability(site)).to.be.false;
    });

    it('Should return false if the created back gap would be too large', function () {
      const site = {
        campsiteId: 1,
        reservations: [
          [ moment('2000-01-01', 'YYYY-MM-DD'), moment('2000-01-09', 'YYYY-MM-DD') ],
          [ moment('2000-01-17', 'YYYY-MM-DD'), moment('2000-01-18', 'YYYY-MM-DD') ]
        ]
      };
      expect(availabilityService.checkSiteAvailability(site)).to.be.false;
    });

    it('Should return true if the created gaps are not too large', function () {
      const site = {
        campsiteId: 1,
        reservations: [
          [ moment('2000-01-01', 'YYYY-MM-DD'), moment('2000-01-08', 'YYYY-MM-DD') ],
          [ moment('2000-01-16', 'YYYY-MM-DD'), moment('2000-01-18', 'YYYY-MM-DD') ]
        ]
      };
      expect(availabilityService.checkSiteAvailability(site)).to.equal(1);
    });

  });

  describe('.checkAvailability()', function () {
    before(function () {
      availabilityService = new AvailabilityService(options);
    });

    it('Should return the siteIds of the sites that have availability for a given date range', function () {
      const available = availabilityService.checkAvailability(
        testCase.search.startDate,
        testCase.search.endDate,
        testCase.reservations
      );
      expect(available.length).to.equal(4);
      expect(available[0]).to.equal(5);
      expect(available[1]).to.equal(6);
      expect(available[2]).to.equal(8);
      expect(available[3]).to.equal(9);
    });
  });

});
