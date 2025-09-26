from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.routes import auth, admin, projects, moderation, live, analytics
from app.core.config import get_settings

settings = get_settings()
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])

app = FastAPI(title=settings.project_name)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return limiter._rate_limit_exceeded_handler(request, exc)


if settings.backend_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.backend_cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(projects.router, prefix=settings.api_v1_prefix)
app.include_router(moderation.router, prefix=settings.api_v1_prefix)
app.include_router(live.router, prefix=settings.api_v1_prefix)
app.include_router(analytics.router, prefix=settings.api_v1_prefix)


@app.get("/health")
def healthcheck():
    return {"status": "ok"}
