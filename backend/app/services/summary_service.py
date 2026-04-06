"""
회원 service 가이드
- sns_login_type 이 EMAIL 인 경우 password는 필수
- 그 외 sns_login_type 인 경우 sns_id 는 필수
"""
from pathlib import Path
import re
import json

from app.core.config import settings
from app.libs.open_ai import openai_call
from app.libs.age_utils import format_child_age

from app.repository.user_repository import UserRepository
from app.repository.feed_repository import FeedRepository
from app.repository.feeds_tags_mappers_repository import FeedsTagsMappersRepository
from app.repository.meals_calendars_repository import MealsCalendarsRepository
from app.repository.summaries_agents_repository import SummariesAgentsRepository
from app.repository.users_childs_repository import UsersChildsRepository

from app.services.meals_summaries_service import get_meal_summary_by_view_hash
from app.schemas.common_schemas import CommonResponse

#============================================
# 함수 정의
#============================================
def set_openai_question(system_prompt: str, user_prompt: str) -> list:
    """
    agent 에게 보낼 메세지 format 을 정의
    """
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
                    "text": user_prompt
                }
            ]
        }
    ]
    return messages

def call_openapi(messages) -> list:
    """
    agent 호출 함수
    """
    try:
        response = openai_call(messages)

        # OpenAI API 응답에서 에러 체크
        if "error" in response:
            return False, f"OpenAI API 오류: {response['error']}"

        # OpenAI API 응답 구조: choices[0].message.content
        return True, response.get("choices", [{}])[0].get("message", {}).get("content", "")
    except Exception as e:
        return False, f"요청 처리 중 오류가 발생했습니다: {str(e)}"

def parse_openai_response(content: str):
    """
    OpenAI 응답에서 JSON 데이터 추출
    - ```json ... ``` 제거
    """
    match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)

    if match:
        json_str = match.group(1)
    else:
        json_str = content  # 혹시 코드블럭 없으면 그대로

    return json.loads(json_str)

def get_week_report_user_prompt(summary_data, child_gender, child_birth):
    gender = "남아" if child_gender == "M" else "여아"
    prompt = f"다음은 {format_child_age(child_birth)} {gender}의 날짜별 식단과 영양소 데이터입니다."
    prompt += f"\n\n모든 날짜와 식사의 영양소를 합산하여 분석하고 System Prompt에서 정의한 JSON 구조로 결과를 반환하세요."
    prompt += f"\n\n데이터:"
    prompt += json.dumps(summary_data, indent=2, ensure_ascii=False)
    return prompt

#============================================
# 서비스 함수 정의
#============================================
def get_week_report(summary_data, child_gender, child_birth):
    system_prompt = load_prompt_template("week_report.md").strip()
    user_prompt = get_week_report_user_prompt(summary_data, child_gender, child_birth)

    messages = set_openai_question(system_prompt, user_prompt)
    is_success, response = call_openapi(messages)
    if not is_success or is_success == False:
        return CommonResponse(
            success=False,
            message=response,
            data=[]
        )

    return response.get("choices", [{}])[0].get("message", {}).get("content", "")

async def temp_meal_summary(db, data) -> CommonResponse:
    """
    임시 식단요약
    - AI 모델을 호출하여 식단 요약 생성
    - 가등록 단계에서 ai에게 질의를 하고 결과를 받아서 임시 테이블에 저장
    - 프론트에서는 실제 등록 시 ai_hash로 결과 조회
    """
    from app.services.users_service import validate_user
    from app.services.users_childs_service import get_child_by_id
    from app.services.ingredients_nutritions_services import get_ingredient_mapper
    from app.services.categories_codes_service import get_category_code_by_id
    from app.services.meals_service import get_meal_stage_text
    from app.services.meals_summaries_service import create_meal_summary, create_ingredient_hash

    from app.schemas.summary_schemas import TempMealSummaryResponse

    user_hash = data.get("user_hash")
    category_code = data.get("category_code")
    input_date = data.get("input_date")
    contents = data.get("contents")
    child_id = data.get("child_id")
    meal_stage = data.get("meal_stage")
    meal_stage_detail = data.get("meal_stage_detail")
    ingredients = data.get("ingredients", [])

    try:
        # user 검증
        user = validate_user(db, user_hash)
        child = get_child_by_id(db, child_id)
        if child is None:
            raise Exception("존재하지 않는 아이정보 입니다.")

        category = get_category_code_by_id(db, category_code)
        if category is None or category.type != "MEALS_GROUP":
            raise Exception("유효하지 않은 카테고리입니다.")

        ingredient_data = []
        for ingredient in ingredients:
            mapper_data = get_ingredient_mapper(db, ingredient)  # 재료 유효성 검증

            if mapper_data:
                ingredient_data.append(mapper_data)

        ingredient_names = [ingredient.get("name") for ingredient in ingredients if ingredient.get("name")]

        view_hash = create_ingredient_hash(
            user.id,
            input_date,
            category.code,
            child_id,
            contents,
            meal_stage,
            meal_stage_detail,
            ingredient_names,
        )

        exist_meal_summary = get_meal_summary_by_view_hash(db, view_hash)  # 동일한 해시가 있는지 확인하여 중복 생성 방지
        if exist_meal_summary:
            data = TempMealSummaryResponse(
                ai_hash=exist_meal_summary.view_hash,
                total_score=exist_meal_summary.total_score,
                total_summary=exist_meal_summary.total_summary,
                analysis_json=exist_meal_summary.analysis_json,
                suggestion=exist_meal_summary.suggestion
            )
            return CommonResponse(success=True, message="식단 요약 생성 성공", data=data)

        meal_stage_text, meal_stage_detail_text = get_meal_stage_text(meal_stage, meal_stage_detail)  # 단계 텍스트로 변환 (예: 이유식 초기)

        system_prompt = load_prompt_template("temp_meal_summary.md")

        final_prompt = f"아이 이름 : {child.child_name}"
        final_prompt += f"\n아이 성별 : {'남아' if child.child_gender == 'M' else '여아'}"
        final_prompt += f"\n아이의 나이: {format_child_age(child.child_birth)}"
        final_prompt += f"\n식단 내용: {contents}"
        final_prompt += f"\n식단 형태: {category.value}"
        final_prompt += f"\n식단 단계: {meal_stage_text} ({meal_stage_detail_text})"
        final_prompt += f"\n식사 성분: {ingredient_data}"

        messages = set_openai_question(system_prompt, final_prompt)
        is_success, response = call_openapi(messages)
        if not is_success:
            return CommonResponse(success=False, message=response, data=[])

        data = parse_openai_response(response)

        suggestion = "_AND_".join(data.get("improvement_suggestions", []))

        params = {
            "user_id": user.id,
            "total_score": data.get("total_score", 0),
            "total_summary": data.get("summary", ""),
            "analysis_json": data.get("nutrient_analysis", ""),
            "score_details": data.get("score_details", ""),
            "view_hash": view_hash,
            "suggestion": suggestion
        }

        # 임시 테이블에 저장
        temp_meal_summary = create_meal_summary(db, params)
        db.commit()
        if not temp_meal_summary:
            raise Exception("임시 식단 요약 저장에 실패했습니다.")

        data = TempMealSummaryResponse(
            ai_hash=temp_meal_summary.view_hash,
            total_score=temp_meal_summary.total_score,
            total_summary=temp_meal_summary.total_summary,
            analysis_json=temp_meal_summary.analysis_json,
            suggestion=temp_meal_summary.suggestion
        )

        return CommonResponse(success=True, message="식단 요약 생성 성공", data=data)

    except Exception as e:
        print("⭕⭕", str(e))
        return CommonResponse(success=False, message=f"{str(e)}", data=[])

async def search_summary(db, user_hash: str, model: str, model_id: int, query: str, limit: int, offset: int) -> CommonResponse:
    """
    나의 요약 검색 내역 조회
    """
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

    # 상대경로인 경우 이 파일 기준으로 절대경로 변환 (backend/prompts/)
    if not template_path.is_absolute():
        base_dir = Path(__file__).resolve().parent.parent.parent
        template_path = base_dir / settings.PROMPT_TEMPLATES_DIR / template_name

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