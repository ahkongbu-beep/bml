from app.models.growths import Growths
class GrowthsRepository:
    @staticmethod
    def add_growth(session, growth_data):
        new_growth = Growths(
            type=growth_data['type'],
            months=growth_data['months'],
            gender=growth_data['gender'],
            value=growth_data['value'],
            percent=growth_data['percent'],
            is_active=growth_data.get('is_active', 'Y')
        )
        session.add(new_growth)
        session.flush()  # 새로 추가된 객체의 ID를 가져오기 위해 flush() 호출
        session.refresh(new_growth)  # 새로 추가된 객체를 새로고침하여

    @staticmethod
    def get_growths_all(session, params):
        query = session.query(Growths).filter(Growths.is_active == 'Y')

        if params.get('gender'):
            query = query.filter(Growths.gender == params['gender'])

        if params.get('months') is not None:
            base_month = int(params.get('months'))  # 소수점 버림
            query = query.filter(Growths.months.between(base_month, base_month + 0.9))

        return query.all()