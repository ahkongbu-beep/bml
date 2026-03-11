export const MEAL_STAGE = [
  {
    "id": 1,
    "label": "이유식",
    "items": [
      { "id": "milk", "label": "분유/모유", "needCode": false },
      { "id": "weaning", "label": "이유식", "needCode": true }
    ]
  },
  {
    "id": 2,
    "label": "유아식",
    "items": [
      { "id": "home", "label": "집밥", "needCode": true },
      { "id": "commercial", "label": "시판", "needCode": false },
      { "id": "simple", "label": "간편식", "needCode": false }
    ]
  },
  {
    "id": 3,
    "label": "일반식",
    "items": [
      { "id": "home", "label": "집밥", "needCode": true },
      { "id": "outside", "label": "외부음식", "needCode": false },
      { "id": "simple", "label": "간편식", "needCode": false }
    ]
  }
]
