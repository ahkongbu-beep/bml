# app/libs/query_result.py

class SerializerQueryResult:
    """
    SQLAlchemy Query 결과 공통 래퍼
    - ORM 객체
    - Row (컬럼 select)
    모두 지원
    """

    def __init__(self, results):
        self._results = results

    def serialize(self):
        return [
            AttrDict(self._row_to_dict(row))
            for row in self._results
        ]

    def to_list(self):
        """
        순수 딕셔너리 리스트 반환 (Pydantic 직렬화용)
        """
        return [
            self._row_to_dict(row)
            for row in self._results
        ]

    def toJSON(self):
        import json
        return json.dumps(self.serialize(), ensure_ascii=False, default=str)

    def getRawData(self):
        return self._results

    @staticmethod
    def _row_to_dict(row):
        # SQLAlchemy 1.4+ Row
        if hasattr(row, "_mapping"):
            return dict(row._mapping)

        # ORM 객체 (Model 단독 조회)
        if hasattr(row, "__table__"):
            return {
                col.name: getattr(row, col.name)
                for col in row.__table__.columns
            }

        # fallback
        return row

class AttrDict:
    """
    dict + 객체 접근 혼합
    """
    def __init__(self, data: dict):
        self.__dict__["_data"] = data

    def __getattr__(self, item):
        try:
            return self._data[item]
        except KeyError:
            raise AttributeError(item)

    def __getitem__(self, item):
        return self._data[item]

    def model_dump(self):
        return self._data

    def dict(self):
        return self._data