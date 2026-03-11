from datetime import date, datetime

def format_child_age(birth_date: str) -> str:
    """
    생년월일을 받아 '아이 나이: 0세 (1개월)' 형태로 반환

    Args:
        birth_date (str): YYYY-MM-DD

    Returns:
        str
    """

    if isinstance(birth_date, str):
        birth = datetime.strptime(birth_date, "%Y-%m-%d").date()
    elif isinstance(birth_date, date):
        birth = birth_date
    else:
        raise ValueError("birth_date must be str or date")

    today = date.today()

    # 전체 개월 수 계산
    months = (today.year - birth.year) * 12 + (today.month - birth.month)

    if today.day < birth.day:
        months -= 1

    if months < 0:
        months = 0

    years = months // 12
    remain_months = months % 12

    return f"아이 나이: {years}세 ({remain_months}개월)"