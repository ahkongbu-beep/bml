from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi import Form, Query
from app.schemas.feeds_schemas import FeedsUserResponse
from app.schemas.users_schemas import UserChildItemSchema

class MealsCalendarInsertRequest(BaseModel):
    user_hash: Optional[str] = None
    category_id: int
    input_date: str
    contents: str
    isPreMade: str = "N"
    ingredients: str = "[]"
    is_public: str = "N"
    meal_condition: int = 0
    child_id: Optional[int] = None
    meal_stage: Optional[int] = 0
    meal_stage_detail: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        user_hash: Optional[str] = Form(None),
        category_id: int = Form(...),
        input_date: str = Form(...),
        contents: str = Form(...),
        isPreMade: str = Form("N"),
        ingredients: str = Form("[]"),
        is_public: str = Form("N"),
        meal_condition: int = Form(0),
        child_id: Optional[int] = Form(None),
        meal_stage: Optional[int] = Form(0),
        meal_stage_detail: Optional[str] = Form(None),
    ):
        return cls(
            user_hash=user_hash,
            category_id=category_id,
            input_date=input_date,
            contents=contents,
            isPreMade=isPreMade,
            ingredients=ingredients,
            is_public=is_public,
            meal_condition=meal_condition,
            child_id=child_id,
            meal_stage=meal_stage,
            meal_stage_detail=meal_stage_detail,
        )


class CalendarCopyRequest(BaseModel):
    target_user_hash: str
    target_feed_id: int
    copy_input_date: str
    category_id: int

class FeedListRequest(BaseModel):
    type: str = "list"
    view_type: str = "all"
    limit: int = Field(10, ge=1)
    offset: int = Field(0, ge=0)
    cursor: Optional[int] = None
    title: Optional[str] = None
    nickname: Optional[str] = None
    sort_by: str = "created_at"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    target_user_hash: Optional[str] = None
    # 앞으로 계속 추가하면 됨
    meal_stage: Optional[int] = None
    meal_stage_detail: Optional[str] = None
    ingredient_name: Optional[List[str]] = Field(default=None, alias="ingredient_name")

    def __init__(self, **data):
        super().__init__(**data)

    @classmethod
    def as_query(
        cls,
        type: str = Query("list"),
        view_type: str = Query("all"),
        limit: int = Query(10, ge=1),
        offset: int = Query(0, ge=0),
        cursor: Optional[int] = Query(None),
        title: Optional[str] = Query(None),
        nickname: Optional[str] = Query(None),
        sort_by: str = Query("created_at"),
        start_date: Optional[str] = Query(None),
        end_date: Optional[str] = Query(None),
        target_user_hash: Optional[str] = Query(None),
        meal_stage: Optional[int] = Query(None),
        meal_stage_detail: Optional[str] = Query(None),
        ingredient_name: Optional[List[str]] = Query(None),
    ):
        return cls(
            type=type,
            view_type=view_type,
            limit=limit,
            offset=offset,
            cursor=cursor,
            title=title,
            nickname=nickname,
            sort_by=sort_by,
            start_date=start_date,
            end_date=end_date,
            target_user_hash=target_user_hash,
            meal_stage=meal_stage,
            meal_stage_detail=meal_stage_detail,
            ingredient_name=ingredient_name,
        )


class MappedTagResponse(BaseModel):
    mapper_name: str
    mapper_score: str
    mapper_id: Optional[str] = None

class MealsCalendarResponse(BaseModel):
    id:int
    contents: str
    tags: List[str] = []
    input_date: str
    month: str
    child_id: int
    meal_condition: Optional[str] = None
    is_liked: Optional[bool] = False
    category_id: int
    category_name: Optional[str] = None
    is_public: str
    view_count: int
    like_count: Optional[int] = 0
    is_pre_made: str
    mapped_tags: List[MappedTagResponse] = []
    refer_feed_id: int
    refer_info: Optional[dict] = None
    meal_stage: Optional[int] = None
    meal_stage_detail: Optional[str] = None
    image_url: Optional[str] = None
    view_hash: str
    user:FeedsUserResponse
    childs: Optional[UserChildItemSchema] = None

class MealItem(BaseModel):
    meal_id: int
    category_code: str
    category_name: Optional[str] = None
    user_id: int
    nickname: Optional[str] = None
    username: Optional[str] = None
    user_hash: Optional[str] = None
    profile_image: Optional[str] = None
    input_date: Optional[str] = None
    meal_stage: Optional[int] = None
    meal_stage_detail: Optional[str] = None
    contents: Optional[str] = None
    month: Optional[str] = None
    meal_condition: Optional[str] = None
    view_count: int
    like_count: int
    is_public: str
    is_pre_made: str
    is_active: str
    created_at: str
    updated_at: str
    deleted_at: Optional[str] = None
    view_hash: str

class MealsCalendarCreateRequest(BaseModel):
    category_id: int
    input_date: str
    title: str
    contents: str
    tags: Optional[List[str]] = []
