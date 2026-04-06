# domains/meal/constants.py

MEAL_STAGE_LIST = [
    {
        "id": 1,
        "label": "이유식",
        "items": [
            {"id": "milk", "label": "분유/모유", "needCode": False},
            {"id": "weaning", "label": "이유식", "needCode": True}
        ]
    },
    {
        "id": 2,
        "label": "유아식",
        "items": [
            {"id": "home", "label": "집밥", "needCode": True},
            {"id": "commercial", "label": "시판", "needCode": False},
            {"id": "simple", "label": "간편식", "needCode": False}
        ]
    },
    {
        "id": 3,
        "label": "일반식",
        "items": [
            {"id": "home", "label": "집밥", "needCode": True},
            {"id": "outside", "label": "외부음식", "needCode": False},
            {"id": "simple", "label": "간편식", "needCode": False}
        ]
    }
]