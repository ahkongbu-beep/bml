"""
회원 service 가이드
- sns_login_type 이 EMAIL 인 경우 password는 필수
- 그 외 sns_login_type 인 경우 sns_id 는 필수
"""
from pathlib import Path
from sqlalchemy import func
from app.models.users import Users
from app.models.feeds import Feeds
from app.models.feeds_images import FeedsImages
from app.models.summaries_agents import SummariesAgents
from app.schemas.common_schemas import CommonResponse
from app.libs.password_utils import hash_password
from app.core.config import settings
from app.libs.open_ai import openai_call

"""
나의 요약 검색 내역 조회
"""
async def search_summary(db, user_hash: str, model: str, model_id: int, query: str, limit: int, offset: int) -> CommonResponse:

    if model is None:
        return CommonResponse(success=False, message="조회를 위한 필수 파라미터가 없습니다.", data=[])

    user = Users.findByViewHash(db, user_hash)
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
        rows, total = SummariesAgents.getListByFeedImages(db, params, offset=offset, limit=limit)

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
        user = Users.findByViewHash(db, user_hash)
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

    summary_list = SummariesAgents.getList(db, params, offset=offset, limit=limit).getData()

    return CommonResponse(success=True, message="요약 리스트 조회 성공", data=summary_list)


"""
이미지 기반 피드 요약 생성
- openai_call 함수를 사용하여 OpenAI API 호출
"""
async def feed_summary(db, data) -> CommonResponse:

    model = data.get("model", "gpt-4o-mini")
    prompt = data['prompt']

    if data['prompt'].strip() == "":
        return CommonResponse(success=False, message="프롬프트를 입력해주세요.", data=[])

    user = Users.findByViewHash(db, data["user_hash"])
    if not user:
        return CommonResponse(success=False, message="존재하지 않는 회원입니다.", data=[])

    used_count = SummariesAgents.findUsedCountByUserId(db, user.id)
    if used_count >= settings.FREE_SUMMARY_AGENT_COUNT:
        return CommonResponse(success=False, message="무료 요약 생성 횟수를 초과했습니다.", data=[])

    feed = Feeds.findById(db, data["feed_id"])
    if not feed:
        return CommonResponse(success=False, message="존재하지 않는 피드입니다.", data=[])

    feed_image = db.query(FeedsImages).filter(
        FeedsImages.id == data["image_id"],
        FeedsImages.feed_id == data["feed_id"]
    ).first()

    if not feed_image:
        return CommonResponse(success=False, message="존재하지 않는 피드 이미지입니다.", data=[])

    # system_prompt = f"""
    # 당신은 뛰어난 요리사 입니다.
    # 주어진 이미지와 프롬프트를 참고하여 사용자에게 요리와 관련된 유용한 정보를 제공해주세요.
    # 이미지에 대한 설명과 프롬프트를 바탕으로 상세하고 흥미로운 답변을 작성해주세요.
    # 답변은 한국어로 작성해주세요.
    # """.strip()

    system_prompt = load_prompt_template("system.md").strip()

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
                    "text": prompt
                },
                # {
                #     "type": "image_url",
                #     "image_url": {
                #         "url": settings.STATIC_BASE_URL + feed_image.image_url
                #     }
                # }
            ]
        }
    ]

    try:
        response = openai_call(messages, model=model)

        # OpenAI API 응답에서 에러 체크
        if "error" in response:
            print(f"OpenAI API 오류: {response['error']}")
            return CommonResponse(
                success=False,
                message=f"OpenAI API 오류: {response['error']}",
                data=[]
            )

        # OpenAI API 응답 구조: choices[0].message.content
        output_text = response.get("choices", [{}])[0].get("message", {}).get("content", "")

        summary_params = {
            "user_id": user.id,
            "model": "FeedsImages",
            "model_id": feed_image.id,
            "question": prompt,
            "answer": output_text,
        }

        summary_agent = SummariesAgents.create(db, summary_params, is_commit=True)
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