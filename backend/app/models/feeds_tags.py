from sqlalchemy import Column, BigInteger, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class FeedsTags(Base):
    __tablename__ = "feeds_tags"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)

    mappers = relationship(
        "FeedsTagsMapper",          # ← 문자열이면 import 순서 문제 없어짐
        back_populates="tag",
        cascade="all, delete-orphan"
    )

    """
    태그 이름으로 태그 조회, 없으면 생성
    """
    @staticmethod
    def get_or_create_tag(session, tag_name: str, is_commit=True):

        tag_name = tag_name.replace("#", "").strip()
        tag = session.query(FeedsTags).filter(FeedsTags.name == tag_name).first()

        if not tag:
            tag = FeedsTags(name=tag_name)
            session.add(tag)
            if is_commit:
                session.commit()
                session.refresh(tag)
            else:
                session.flush()  # flush로 ID 생성
        return tag