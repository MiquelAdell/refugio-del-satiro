from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.routes.admin import router as admin_router
from backend.api.routes.auth_routes import router as auth_router
from backend.api.routes.bgg import router as bgg_router
from backend.api.routes.content import router as content_router
from backend.api.routes.games import router as games_router
from backend.api.routes.loans import router as loans_router
from backend.api.routes.members import router as members_router
from backend.api.routes.rpg_items import router as rpg_items_router

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


def create_app() -> FastAPI:
    app = FastAPI(title="Refugio del Sátiro", version="0.1.0")

    app.include_router(games_router)
    app.include_router(rpg_items_router)
    app.include_router(auth_router)
    app.include_router(loans_router)
    app.include_router(members_router)
    app.include_router(admin_router)
    app.include_router(content_router)
    app.include_router(bgg_router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    if FRONTEND_DIR.is_dir():
        app.mount(
            "/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets"
        )

        @app.get("/{full_path:path}")
        def serve_spa(request: Request, full_path: str) -> FileResponse:
            file_path = FRONTEND_DIR / full_path
            if full_path and file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(FRONTEND_DIR / "index.html")

    return app
