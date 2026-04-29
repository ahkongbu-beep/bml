# domains/meal/constants.py

MEAL_STAGE_LIST = [
    {
        "id": 1,
        "label": "이유식",
        "items": [
            {"id": "home", "label": "수제", "needCode": True},
            {"id": "commercial", "label": "시판", "needCode": False}
        ]
    },
    {
        "id": 2,
        "label": "유아식",
        "items": [
        { "id": "home", "label": "수제", "needCode": True },
        { "id": "no_salt_commercial", "label": "시판\n(저염)", "needCode": False },
        { "id": "commercial", "label": "시판\n(일반식)", "needCode": False },
        { "id": "simple", "label": "간편식", "needCode": False }
        ]
    },
    {
        "id": 3,
        "label": "일반식",
        "items": [
            {"id": "home", "label": "집밥", "needCode": True},
            {"id": "outside", "label": "외식·배달", "needCode": False},
            {"id": "simple", "label": "간편식", "needCode": False}
        ]
    },
    {
        "id": 4,
        "label": "간식",
        "items": [
        { "id": "homemdate",  "label": "수제간식", "needCode": True },
        { "id": "commercial", "label": "시판간식", "needCode": False },
        ]
    }
]