export const MEAL_STAGE = [
  {
    "id": 1,
    "label": "이유식",
    "items": [
      { "id": "home", "label": "수제", "needCode": true },
      { "id": "commercial", "label": "시판", "needCode": false }
    ]
  },
  {
    "id": 2,
    "label": "유아식",
    "items": [
      { "id": "home", "label": "수제", "needCode": true },
      { "id": "no_salt_commercial", "label": "시판\n(저염)", "needCode": false },
      { "id": "commercial", "label": "시판\n(일반식)", "needCode": false },
      { "id": "simple", "label": "간편식", "needCode": false }
    ]
  },
  {
    "id": 3,
    "label": "일반식",
    "items": [
      { "id": "home", "label": "수제", "needCode": true },
      { "id": "outside", "label": "외식·배달", "needCode": false },
      { "id": "simple", "label": "간편식", "needCode": false }
    ]
  },
  {
    "id": 4,
    "label": "간식",
    "items": [
      { "id": "homemdate",  "label": "수제간식", "needCode": true },
      { "id": "commercial", "label": "시판간식", "needCode": false },
    ]
  }
]
