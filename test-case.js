const testCase = {
  "search": {
    "startDate": "2016-06-07",
    "endDate": "2016-06-10"
  },
  "gapRules": [
    { "gapSize": 2 },
    { "gapSize": 3 }
  ],
  "campsites": [
    { "id": 1, "name": "Grizzly Adams Adventure Cabin" },
    { "id": 2, "name": "Lewis and Clark Camp Spot" },
    { "id": 3, "name": "Jonny Appleseed Log Cabin" },
    { "id": 4, "name": "Davey Crockett Camphouse" },
    { "id": 5, "name": "Daniel Boone Bungalow" },
    { "id": 6, "name": "Teddy Rosevelt Tent Site" },
    { "id": 7, "name": "Edmund Hillary Igloo" },
    { "id": 8, "name": "Bear Grylls Cozy Cave" },
    { "id": 9, "name": "Wyatt Earp Corral" }
  ],
  "reservations": [
    {"campsiteId": 1, "startDate": "2016-06-01", "endDate": "2016-06-04"},
    {"campsiteId": 1, "startDate": "2016-06-11", "endDate": "2016-06-13"},
    {"campsiteId": 2, "startDate": "2016-06-08", "endDate": "2016-06-09"},
    {"campsiteId": 3, "startDate": "2016-06-04", "endDate": "2016-06-06"},
    {"campsiteId": 3, "startDate": "2016-06-14", "endDate": "2016-06-16"},
    {"campsiteId": 4, "startDate": "2016-06-03", "endDate": "2016-06-05"},
    {"campsiteId": 4, "startDate": "2016-06-13", "endDate": "2016-06-14"},
    {"campsiteId": 5, "startDate": "2016-06-03", "endDate": "2016-06-06"},
    {"campsiteId": 5, "startDate": "2016-06-12", "endDate": "2016-06-14"},
    {"campsiteId": 6, "startDate": "2016-06-04", "endDate": "2016-06-06"},
    {"campsiteId": 6, "startDate": "2016-06-11", "endDate": "2016-06-12"},
    {"campsiteId": 6, "startDate": "2016-06-16", "endDate": "2016-06-16"},
    {"campsiteId": 7, "startDate": "2016-06-03", "endDate": "2016-06-04"},
    {"campsiteId": 7, "startDate": "2016-06-07", "endDate": "2016-06-09"},
    {"campsiteId": 7, "startDate": "2016-06-13", "endDate": "2016-06-16"},
    {"campsiteId": 8, "startDate": "2016-06-01", "endDate": "2016-06-02"},
    {"campsiteId": 8, "startDate": "2016-06-05", "endDate": "2016-06-06"},
    {"campsiteId": 9, "startDate": "2016-06-03", "endDate": "2016-06-05"},
    {"campsiteId": 9, "startDate": "2016-06-12", "endDate": "2016-06-16"}
  ]
};
export default testCase;
