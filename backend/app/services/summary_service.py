"""
회원 service 가이드
- sns_login_type 이 EMAIL 인 경우 password는 필수
- 그 외 sns_login_type 인 경우 sns_id 는 필수
"""
import hashlib
from pathlib import Path

from fastapi import params
from app.repository.user_repository import UserRepository
from app.repository.feed_repository import FeedRepository
from app.repository.feeds_tags_mappers_repository import FeedsTagsMappersRepository
from app.repository.meals_calendars_repository import MealsCalendarsRepository
from app.repository.summaries_agents_repository import SummariesAgentsRepository
from app.repository.users_childs_repository import UsersChildsRepository
from app.schemas.common_schemas import CommonResponse
from app.core.config import settings
from app.libs.open_ai import openai_call
from app.libs.age_utils import format_child_age

import json

"""
나의 요약 검색 내역 조회
"""
async def search_summary(db, user_hash: str, model: str, model_id: int, query: str, limit: int, offset: int) -> CommonResponse:

    if model is None:
        return CommonResponse(success=False, message="조회를 위한 필수 파라미터가 없습니다.", data=[])

    user = UserRepository.find_by_view_hash(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="존재하지 않는 회원입니다.", data=[])

    params = {"model": model}

    if user.role != "admin":
        params['user_id'] = user.id

    if model_id is not None:
        params['model_id'] = model_id

    if query is not None and query.strip() != "":
        params['query'] = query.strip()

    total = 0
    if model == "FeedsImages":
        rows, total = SummariesAgentsRepository.getListByFeedImages(db, params, offset=offset, limit=limit)

    if total == 0:
        return CommonResponse(success=True, message="요약 검색 성공", data={"summaries": [], "total": 0})

    summary_data = [dict(row._mapping) for row in rows]

    data = {
        "summaries": summary_data,
        "total": total
    }

    return CommonResponse(success=True, message="요약 검색 성공", data=data)

def load_prompt_template(template_name: str) -> str:
    """
    프롬프트 템플릿 로드 함수
    - template_name: 템플릿 파일명 (예: "recipe_summary.txt")
    - 반환값: 템플릿 문자열
    """
    template_path = Path(settings.PROMPT_TEMPLATES_DIR) / template_name

    try:
        with open(template_path, 'r', encoding='utf-8') as file:
            template_content = file.read()
        return template_content
    except FileNotFoundError:
        raise Exception(f"프롬프트 템플릿을 찾을 수 없습니다: {template_name}")

"""
관리자에서 사용할 리스트
"""
async def list_summaries(db, user_hash: str, model: str, model_id: int, search_type: str, search_value: str,  limit: int, offset: int) -> CommonResponse:

    params = {}
    if user_hash is not None:
        user = UserRepository.find_by_view_hash(db, user_hash)
        if not user:
            return CommonResponse(success=False, message="존재하지 않는 회원입니다.", data=[])
        params['user_id'] = user.id

    if model is not None:
        params['model'] = model

    if model_id is not None:
        params['model_id'] = model_id

    if search_type is not None and search_value is not None and search_value.strip() != "":
        params['search_type'] = search_type
        params['search_value'] = search_value.strip()

    summary_list = SummariesAgentsRepository.get_list(db, params, offset=offset, limit=limit).getData()

    return CommonResponse(success=True, message="요약 리스트 조회 성공", data=summary_list)

@staticmethod
def getAiPromptQuestion(prompt: str, recipe: list, desc: str, child_birth: str = None) -> str:
    f_prompt = f"사용자가 다음과 같이 질문했습니다: {prompt}\n\n"
    f_prompt += f"이 음식에 대한 간단한 정보를 참고하여 도움이 될만한 답변을 하세요\n"

    if child_birth is not None:
        f_prompt += f"아이는 {format_child_age(child_birth)}입니다.\n\n"

    f_prompt += f"음식 재료: {', '.join(recipe)}\n\n"


    if desc:
        f_prompt += f"음식 설명: {desc}\n\n"
    return f_prompt

"""
피드요약
- 재료, 상세설명을 참고하여 영양성분을 분석하여 요약을 생성
"""
async def feed_summary(db, data) -> CommonResponse:

    model = data.get("model", "gpt-4o-mini")
    prompt = data['prompt']

    if data['prompt'].strip() == "":
        return CommonResponse(success=False, message="프롬프트를 입력해주세요.", data=[])

    user = UserRepository.find_by_view_hash(db, data["user_hash"])
    if not user:
        return CommonResponse(success=False, message="존재하지 않는 회원입니다.", data=[])

    # used_count = SummariesAgentsRepository.findUsedCountByUserId(db, user.id)
    # if used_count >= settings.FREE_SUMMARY_AGENT_COUNT:
    #     return CommonResponse(success=False, message="무료 요약 생성 횟수를 초과했습니다.", data=[])

    feed = FeedRepository.findById(db, data["feed_id"])
    if not feed:
        return CommonResponse(success=False, message="존재하지 않는 피드입니다.", data=[])

    meal_calendar = MealsCalendarsRepository.get_calendar_by_id(db, feed.ref_meal)
    child_id = meal_calendar.child_id if meal_calendar else None

    child_birth = None
    if child_id is not None:
        child_data = UsersChildsRepository.get_child_by_id(db, child_id)
        if child_data and child_data.child_birth:
            child_birth = child_data.child_birth

    # recipe_list : ["고구마", "브로콜리"]
    recipe_list = sorted(FeedsTagsMappersRepository.get_tags_mapper_by_model_and_model_id(db, "Feeds", feed.id))

    # # 동일한 요약이 있는 경우 재사용
    exist_summary = SummariesAgentsRepository.get_summary_by_model_recipe_data(db, "Feeds", feed.id, recipe_list)
    if exist_summary:
        return CommonResponse(success=True, message="요약 검색 성공", data=exist_summary.answer)

    system_prompt = load_prompt_template("system.md").strip()
    final_prompt  = getAiPromptQuestion(prompt, recipe_list, feed.content, child_birth)

    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": final_prompt
                }
            ]
        }
    ]

    try:
        response = openai_call(messages, model=model)

        # OpenAI API 응답에서 에러 체크
        if "error" in response:
            return CommonResponse(
                success=False,
                message=f"OpenAI API 오류: {response['error']}",
                data=[]
            )

        # OpenAI API 응답 구조: choices[0].message.content
        output_text = response.get("choices", [{}])[0].get("message", {}).get("content", "")

        summary_params = {
            "user_id": user.id,
            "model": "Feeds",
            "model_id": feed.id,
            "recipe_json": recipe_list,
            "question": prompt,
            "answer": output_text,
        }

        summary_agent = SummariesAgentsRepository.create(db, summary_params, is_commit=True)
        if not summary_agent:
            return CommonResponse(
                success=False,
                message="요약 기록 생성에 실패했습니다.",
                data=[]
            )

    except Exception as e:
        return CommonResponse(
            success=False,
            message=f"요청 처리 중 오류가 발생했습니다: {str(e)}",
            data=[]
        )

    return CommonResponse(
        success=True,
        message="요약 성공",
        data=output_text
    )