from datetime import datetime
import pytz
from sqlalchemy import text
from app.libs.hash_utils import generate_sha256_hash
from app.libs.password_utils import hash_password, verify_password
from app.models.users import Users

class UserRepository:
    # 타 repository 에서 호출을 하는건 비효울적이라 직접쿼리를 작성
    @staticmethod
    def get_user_like_count(session, user_id: int):
        query = text("""
        SELECT
            COUNT(DISTINCT fl.id) AS like_count,
            COUNT(DISTINCT mc.id) AS meal_calendar_count
        FROM `users` u
        LEFT JOIN `feeds_likes` fl ON u.id = fl.user_id
        LEFT JOIN `meals_calendars` mc ON u.id = mc.user_id
        WHERE u.id = :user_id
        """)
        result = session.execute(query, {"user_id": user_id}).fetchone()
        return {
            "like_count": result.like_count if result.like_count else 0,
            "meal_count": result.meal_calendar_count if result.meal_calendar_count else 0
        }

    @staticmethod
    def get_user_by_nickname(session, nickname: str):
        """
        닉네임으로 회원 조회
        """
        return session.query(Users).filter(Users.nickname == nickname).first()

    @staticmethod
    def get_user_by_sns_account(session, sns_login_type: str, sns_id: str):
        """
        SNS 로그인 정보로 회원 조회
        """
        return session.query(Users).filter(
            Users.sns_login_type == sns_login_type,
            Users.sns_id == sns_id
        ).first()

    @staticmethod
    def get_user_by_email(session, email: str):
        """
        이메일로 회원 조회
        """
        return session.query(Users).filter(Users.email == email).first()

    @staticmethod
    def get_user_by_name_and_phone(session, name: str, phone: str):
        """
        이름과 전화번호로 회원 조회 (비밀번호 찾기용)
        """
        return session.query(Users).filter(
            Users.nickname == name,
            Users.phone == phone.replace("-", "")
        ).first()


    @staticmethod
    def get_user_by_email_and_name(session, email: str, name: str):
        """
        이메일과 이름으로 회원 조회 (비밀번호 찾기용)
        """
        return session.query(Users).filter(
            Users.email == email,
            Users.nickname == name
        ).first()

    @staticmethod
    def findById(session, user_id: int):
        """
        PK로 회원 조회
        """
        return session.query(Users).filter(Users.id == user_id).first()

    @staticmethod
    def find_by_view_hash(session, view_hash: str):
        """
        view_hash로 회원 조회
        """
        return session.query(Users).filter(Users.view_hash == view_hash).first()

    @staticmethod
    def create(session, params: dict, is_commit: bool = True):
        kst = pytz.timezone("Asia/Seoul")
        now = datetime.now(kst)

        # view_hash 생성 (sns_login_type + sns_id + nickname + email)
        view_hash = generate_sha256_hash(
            params['sns_login_type'],
            params['sns_id'],
            params['nickname'],
            params['email'],
        )

        # password 해싱 (argon2)
        hashed_password = None
        if params.get('sns_login_type') == 'EMAIL' and params.get('password'):
            hashed_password = hash_password(params['password'])

        # 사용자 생성
        user = Users(
            sns_login_type=params['sns_login_type'],
            sns_id=params['sns_id'],
            nickname=params['nickname'],
            email=params['email'],
            password=hashed_password,
            role=params.get('role', "USER"),
            is_active=params.get('is_active', 1),
            marketing_agree=params.get('marketing_agree', 0),
            push_agree=params.get('push_agree', 0),
            profile_image=params.get('profile_image', ''),
            created_at=now,
            updated_at=now,
            last_login_at=now,
            view_hash=view_hash
        )

        session.add(user)
        if is_commit:
            session.commit()
            session.refresh(user)
        else:
            session.flush()  # ID를 생성하기 위해 flush
            session.refresh(user)

        return user

    @staticmethod
    def update(session, user_instance, params: dict, is_commit: bool = True):
        """
        회원정보 수정 시 수정 가능한 항목을 미리 정의
        미리 저장한 항목이 아닌 경우 update 해주지않음
        """

        validate_keys = [
            "nickname",
            "address",
            "profile_image",
            "description",
            "password",
            "marketing_agree",
            "push_agree",
            "is_active",
            "password",
        ]

        try:
            for key, value in params.items():
                """ 해당 속성이 없을 경우 continue """
                if not hasattr(user_instance, key):
                    continue

                """ 수정가능한 항목이 아니면 continue """
                if key not in validate_keys:
                    continue

                """ 비밀번호일 경우 해싱 처리 """
                if key == "password":

                    """ 빈 문자열일 경우 패스 """
                    if not value.strip():
                        continue

                    if user_instance.sns_login_type != "EMAIL":
                        continue

                    value = hash_password(value)

                setattr(user_instance, key, value)

            kst = pytz.timezone("Asia/Seoul")
            user_instance.updated_at = datetime.now(kst)

            if is_commit:
                session.commit()

            return user_instance

        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def verify_password_deprecated(stored_password: str, provided_password: str) -> bool:
        """
        비밀번호 검증 (Deprecated: app.libs.password_utils.verify_password 사용 권장)

        Args:
            stored_password: 데이터베이스에 저장된 해시된 비밀번호
            provided_password: 사용자가 입력한 평문 비밀번호

        Returns:
            bool: 비밀번호 일치 여부
        """
        return verify_password(stored_password, provided_password)

    @staticmethod
    def update_last_login(session, user_id: int):
        """
        마지막 로그인 시간 업데이트
        """
        kst = pytz.timezone("Asia/Seoul")
        now = datetime.now(kst)

        user = session.query(Users).filter(Users.id == user_id).first()
        if user:
            user.last_login_at = now
            session.commit()
            session.refresh(user)

        return user

    @staticmethod
    def apply_filters(query, params: dict):
        from sqlalchemy.inspection import inspect
        mapper = inspect(Users)
        columns = {column.key for column in mapper.columns}

        for key, value in params.items():
            if key in columns and value is not None:
                query = query.filter(getattr(Users, key) == value)

        # 생성일로 조회
        if params.get("created_at_start") and params.get("created_at_end"):
            query = query.filter(
                Users.created_at.between(
                    params["created_at_start"],
                    params["created_at_end"]
                )
            )

        # 수정일로 조회
        if params.get("updated_at_start") and params.get("updated_at_end"):
            query = query.filter(
                Users.updated_at.between(
                    params["updated_at_start"],
                    params["updated_at_end"]
                )
            )

        return query

    @staticmethod
    def get_count(session, params: dict):
        query = session.query(Users).filter(Users.deleted_at == None)
        query = UserRepository.apply_filters(query, params)
        return query.count()

    @staticmethod
    def get_list(session, params: dict = {}):

        query = session.query(Users).filter(Users.deleted_at == None)

        # 모델 컬럼 목록 가져오기
        query = UserRepository.apply_filters(query, params)

        # 정렬
        order_by = params.get("order_by", "id")
        order_direction = params.get("order_direction", "desc")

        if hasattr(Users, order_by):
            col = getattr(Users, order_by)
            query = query.order_by(col.desc() if order_direction == "desc" else col.asc())

        # 페이징
        if params.get("offset") is not None and params.get("limit") is not None:
            query = query.offset(params["offset"]).limit(params["limit"])

        return query.all()