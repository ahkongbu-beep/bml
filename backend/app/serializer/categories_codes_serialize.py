from app.schemas.categories_codes_schemas import CategoryCodeItem

def serialize_category_code(category_code) -> CategoryCodeItem:
    return CategoryCodeItem(
        id=category_code.id,
        type=category_code.type,
        code=category_code.code,
        value=category_code.value,
        sort=category_code.sort,
        is_active=category_code.is_active
    )