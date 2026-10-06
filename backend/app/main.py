"""Application factory: CORS, error mapping, routers, startup bootstrap."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .api import routes_auth, routes_profile, routes_recipes, routes_store
from .config import get_settings
from .db import bootstrap, make_engine, make_session_factory
from .errors import AppError


def create_app() -> FastAPI:
    settings = get_settings()
    engine = make_engine()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        bootstrap(engine)
        yield

    app = FastAPI(
        title="Cart to Kitchen API",
        version="0.1.0",
        docs_url="/docs",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.engine = engine
    app.state.session_factory = make_session_factory(engine)

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        payload: dict = {"error": {"code": exc.code, "message": exc.message}}
        if exc.details:
            payload["error"]["details"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.get("/healthz", tags=["ops"])
    def healthz():
        with app.state.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok"}

    app.include_router(routes_auth.router, prefix="/api/v1")
    app.include_router(routes_store.router, prefix="/api/v1")
    app.include_router(routes_recipes.router, prefix="/api/v1")
    app.include_router(routes_profile.router, prefix="/api/v1")

    return app


app = create_app()
