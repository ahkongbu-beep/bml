from app.models.growths_reports import GrowthReport
class GrowthsReportsRepository:

    @staticmethod
    def validate_report_exists(session, user_id, child_id, type, today):
        existing_report = session.query(GrowthReport).filter_by(
            user_id=user_id,
            child_id=child_id,
            type=type,
            created_at=today
        ).first()

        return existing_report

    @staticmethod
    def create(session, growth_data):
        new_growth_report = GrowthReport(
            user_id=growth_data['user_id'],
            child_id=growth_data['child_id'],
            type=growth_data['type'],
            months=growth_data['months'],
            value=growth_data['value'],
            percent=growth_data['percent']
        )
        session.add(new_growth_report)
        session.flush()  # 새로 추가된 객체의 ID를 가져오기 위해 flush() 호출
        session.refresh(new_growth_report)  # 새로 추가된 객체를 새로고침하여
        return new_growth_report

    @staticmethod
    def update(session, existing_report, growth_data):
        existing_report.type = growth_data['type']
        existing_report.months = growth_data['months']
        existing_report.value = growth_data['value']
        existing_report.percent = growth_data['percent']
        session.flush()  # 변경 사항을 데이터베이스에 반영하기 위해 flush() 호출
        session.refresh(existing_report)  # 변경된 객체를 새로고침하여 최신 상태로 유지
        return existing_report

    @staticmethod
    def get_reports_by_child_id(session, user_id, child_id):
        reports = session.query(GrowthReport).filter_by(
            user_id=user_id,
            child_id=child_id
        ).order_by(GrowthReport.id.desc()).all()
        return reports