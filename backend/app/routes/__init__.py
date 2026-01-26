from app.routes.auth_router import router as auth_router
from app.routes.notices_router import router as notices_router
from app.routes.categories_codes_router import router as categories_codes_router
from app.routes.users_router import router as users_router
from app.routes.feeds_router import router as feeds_router
from app.routes.meals_router import router as meals_router
from app.routes.summary_router import router as summary_router
from app.routes.dashboard_router import router as dashboard_router
from app.routes.communities_router import router as communities_router

__all__ = ["auth_router", "notices_router", "categories_codes_router", "users_router", "feeds_router", "meals_router", "summary_router", "dashboard_router", "communities_router"]