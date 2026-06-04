"""Generate Excalidraw diagrams for the technical overview presentation."""

from __future__ import annotations

import hashlib
import json
from typing import Any

# --- Helpers ---

_counter = 0


def _id(prefix: str = "el") -> str:
    global _counter
    _counter += 1
    return f"{prefix}-{_counter:03d}"


def _seed(salt: str) -> int:
    # Deterministic seed derived from a stable salt (typically the element id),
    # so regenerating the diagrams produces byte-identical output and git only
    # diffs structural changes — not random renumbering.
    digest = hashlib.md5(salt.encode("utf-8")).digest()
    return 100_000_000 + (int.from_bytes(digest[:4], "big") % 900_000_000)


def _base(
    id: str,
    type: str,
    x: float,
    y: float,
    w: float,
    h: float,
    *,
    stroke: str = "#1e1e1e",
    bg: str = "transparent",
    fill: str = "solid",
    stroke_w: int = 2,
    roughness: int = 1,
    opacity: int = 100,
    index: str = "a0",
    group_ids: list[str] | None = None,
    frame_id: str | None = None,
    bound: list[dict] | None = None,
    roundness: dict | None = None,
) -> dict[str, Any]:
    return {
        "id": id,
        "type": type,
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "angle": 0,
        "strokeColor": stroke,
        "backgroundColor": bg,
        "fillStyle": fill,
        "strokeWidth": stroke_w,
        "strokeStyle": "solid",
        "roughness": roughness,
        "opacity": opacity,
        "groupIds": group_ids or [],
        "frameId": frame_id,
        "index": index,
        "roundness": roundness,
        "seed": _seed(id),
        "version": 1,
        "versionNonce": _seed(f"{id}#nonce"),
        "isDeleted": False,
        "boundElements": bound,
        "updated": 1700000000000,
        "link": None,
        "locked": False,
    }


def rect(
    id: str,
    x: float,
    y: float,
    w: float,
    h: float,
    *,
    bg: str = "transparent",
    stroke: str = "#1e1e1e",
    stroke_w: int = 2,
    rounded: bool = True,
    frame_id: str | None = None,
    bound: list[dict] | None = None,
    group_ids: list[str] | None = None,
    index: str = "a0",
) -> dict:
    return _base(
        id, "rectangle", x, y, w, h,
        bg=bg, stroke=stroke, stroke_w=stroke_w,
        frame_id=frame_id, bound=bound, group_ids=group_ids, index=index,
        roundness={"type": 3} if rounded else None,
    )


def ellipse(
    id: str, x: float, y: float, w: float, h: float,
    *, bg: str = "transparent", stroke: str = "#1e1e1e",
    frame_id: str | None = None, bound: list[dict] | None = None,
    index: str = "a0",
) -> dict:
    return _base(
        id, "ellipse", x, y, w, h,
        bg=bg, stroke=stroke, frame_id=frame_id, bound=bound, index=index,
        roundness={"type": 2},
    )


def diamond(
    id: str, x: float, y: float, w: float, h: float,
    *, bg: str = "transparent", stroke: str = "#1e1e1e",
    frame_id: str | None = None, bound: list[dict] | None = None,
    index: str = "a0",
) -> dict:
    return _base(
        id, "diamond", x, y, w, h,
        bg=bg, stroke=stroke, frame_id=frame_id, bound=bound, index=index,
    )


def text(
    id: str,
    x: float,
    y: float,
    content: str,
    *,
    size: int = 20,
    font: int = 5,
    align: str = "center",
    valign: str = "middle",
    container_id: str | None = None,
    frame_id: str | None = None,
    stroke: str = "#1e1e1e",
    bold: bool = False,
    index: str = "a1",
) -> dict:
    lines = content.split("\n")
    max_line = max(len(line) for line in lines)
    est_w = max_line * size * 0.55
    est_h = len(lines) * size * 1.25
    el = _base(
        id, "text", x, y, est_w, est_h,
        stroke=stroke, frame_id=frame_id, index=index,
    )
    el.update({
        "text": content,
        "fontSize": size,
        "fontFamily": font,
        "textAlign": align,
        "verticalAlign": valign,
        "containerId": container_id,
        "originalText": content,
        "autoResize": True,
        "lineHeight": 1.25,
    })
    return el


def arrow(
    id: str,
    x: float,
    y: float,
    points: list[list[float]],
    *,
    start_id: str | None = None,
    end_id: str | None = None,
    stroke: str = "#1e1e1e",
    stroke_w: int = 2,
    end_head: str | None = "arrow",
    start_head: str | None = None,
    frame_id: str | None = None,
    elbowed: bool = False,
    index: str = "a2",
) -> dict:
    # Calculate bounding box from points
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    w = max(xs) - min(xs) if len(set(xs)) > 1 else 0
    h = max(ys) - min(ys) if len(set(ys)) > 1 else 0
    el = _base(
        id, "arrow", x, y, max(w, 1), max(h, 1),
        stroke=stroke, stroke_w=stroke_w, frame_id=frame_id, index=index,
        roundness={"type": 2},
    )
    el["points"] = points
    el["startBinding"] = (
        {"elementId": start_id, "focus": 0, "gap": 5, "fixedPoint": None}
        if start_id else None
    )
    el["endBinding"] = (
        {"elementId": end_id, "focus": 0, "gap": 5, "fixedPoint": None}
        if end_id else None
    )
    el["startArrowhead"] = start_head
    el["endArrowhead"] = end_head
    el["elbowed"] = elbowed
    return el


def frame(id: str, x: float, y: float, w: float, h: float, name: str, *, index: str = "a0") -> dict:
    el = _base(id, "frame", x, y, w, h, index=index, stroke="#bbb")
    el["name"] = name
    return el


_BOUND_TEXT_PADDING = 5


def _position_bound_texts(elements: list[dict]) -> list[dict]:
    by_id = {el["id"]: el for el in elements}
    def positioned(el: dict) -> dict:
        if el.get("type") != "text" or not el.get("containerId"):
            return el
        if el["x"] != 0 or el["y"] != 0:
            return el
        container = by_id.get(el["containerId"])
        if not container:
            return el
        cx, cy, cw, ch = container["x"], container["y"], container["width"], container["height"]
        tw, th = el["width"], el["height"]
        align = el.get("textAlign", "center")
        valign = el.get("verticalAlign", "middle")
        tx = (
            cx + _BOUND_TEXT_PADDING if align == "left"
            else cx + cw - tw - _BOUND_TEXT_PADDING if align == "right"
            else cx + (cw - tw) / 2
        )
        ty = (
            cy + _BOUND_TEXT_PADDING if valign == "top"
            else cy + ch - th - _BOUND_TEXT_PADDING if valign == "bottom"
            else cy + (ch - th) / 2
        )
        return {**el, "x": tx, "y": ty}
    return [positioned(el) for el in elements]


def wrap(elements: list[dict]) -> dict:
    return {
        "type": "excalidraw",
        "version": 2,
        "source": "claude-code",
        "elements": _position_bound_texts(elements),
        "appState": {
            "gridSize": 20,
            "gridStep": 5,
            "gridModeEnabled": False,
            "viewBackgroundColor": "#ffffff",
        },
        "files": {},
    }


def save(path: str, elements: list[dict]) -> None:
    with open(path, "w") as f:
        json.dump(wrap(elements), f, indent=2)
    print(f"  Created {path}")


# ============================================================
# DIAGRAM 1: Server Architecture
# ============================================================
def diagram_architecture() -> None:
    els: list[dict] = []
    fid = "frame-arch"
    els.append(frame(fid, 0, 0, 1200, 800, "1. Server Architecture"))

    # Internet cloud — centered above Caddy so the arrow stays straight.
    els.append(ellipse("cloud", 220, 30, 240, 80, bg="#dee2e6", frame_id=fid,
                        bound=[{"id": "cloud-t", "type": "text"}, {"id": "arr-internet", "type": "arrow"}]))
    els.append(text("cloud-t", 0, 0, "Internet\n(users)", size=16, container_id="cloud", frame_id=fid))

    # Arrow from cloud to Caddy (Caddy is the only thing exposed to the internet)
    els.append(arrow("arr-internet", 340, 110, [[0, 0], [0, 110]],
                     start_id="cloud", end_id="caddy-box", stroke="#868e96", frame_id=fid))

    # HTTPS label next to the cloud→Caddy arrow
    els.append(text("arr-internet-label", 350, 155, "HTTPS", size=12,
                     stroke="#868e96", frame_id=fid))

    # Server box (VPS)
    els.append(rect("server-box", 80, 160, 1040, 600, bg="#f8f9fa", stroke="#868e96",
                     stroke_w=1, frame_id=fid,
                     bound=[{"id": "server-t", "type": "text"}]))
    els.append(text("server-t", 100, 170, "Server (VPS)", size=14, align="left", valign="top",
                     container_id="server-box", stroke="#868e96", frame_id=fid))

    # Caddy container
    els.append(rect("caddy-box", 120, 220, 440, 500, bg="#a5d8ff", stroke="#1971c2",
                     frame_id=fid,
                     bound=[{"id": "caddy-title", "type": "text"}, {"id": "arr-internet", "type": "arrow"}]))
    els.append(text("caddy-title", 0, 0, "Caddy (reverse proxy)", size=18,
                     container_id="caddy-box", stroke="#1971c2", valign="top", frame_id=fid))

    # Caddy details
    els.append(rect("caddy-https", 150, 280, 180, 50, bg="#d0bfff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "caddy-https-t", "type": "text"}]))
    els.append(text("caddy-https-t", 0, 0, "HTTPS automatic\n(Let's Encrypt)", size=14,
                     container_id="caddy-https", stroke="#6741d9", frame_id=fid))

    els.append(rect("caddy-route1", 150, 360, 380, 50, bg="#fff3bf", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "caddy-r1-t", "type": "text"}, {"id": "arr-prestamos", "type": "arrow"}]))
    els.append(text("caddy-r1-t", 0, 0, "/prestamos/*  ->  App container", size=14,
                     container_id="caddy-route1", stroke="#f08c00", frame_id=fid))

    els.append(rect("caddy-route2", 150, 430, 380, 50, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "caddy-r2-t", "type": "text"}]))
    els.append(text("caddy-r2-t", 0, 0, "/  ->  Static files (the existing site)", size=14,
                     container_id="caddy-route2", stroke="#2f9e44", frame_id=fid))

    els.append(rect("caddy-ports", 150, 510, 180, 50, bg="#dee2e6", stroke="#868e96", frame_id=fid,
                     bound=[{"id": "caddy-ports-t", "type": "text"}]))
    els.append(text("caddy-ports-t", 0, 0, "Ports 80 / 443", size=14,
                     container_id="caddy-ports", stroke="#868e96", frame_id=fid))

    # App container
    els.append(rect("app-box", 640, 220, 440, 500, bg="#ffd8a8", stroke="#e8590c",
                     frame_id=fid,
                     bound=[{"id": "app-title", "type": "text"}, {"id": "arr-prestamos", "type": "arrow"}]))
    els.append(text("app-title", 0, 0, "App container", size=18,
                     container_id="app-box", stroke="#e8590c", valign="top", frame_id=fid))

    # App internals
    els.append(rect("app-fastapi", 670, 280, 180, 50, bg="#ffc9c9", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "app-fastapi-t", "type": "text"}]))
    els.append(text("app-fastapi-t", 0, 0, "FastAPI (Python)", size=14,
                     container_id="app-fastapi", stroke="#e03131", frame_id=fid))

    els.append(rect("app-react", 870, 280, 180, 50, bg="#d0bfff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "app-react-t", "type": "text"}]))
    els.append(text("app-react-t", 0, 0, "React (frontend)", size=14,
                     container_id="app-react", stroke="#6741d9", frame_id=fid))

    els.append(rect("app-api", 670, 370, 380, 50, bg="#ffffff", stroke="#1e1e1e", frame_id=fid,
                     bound=[{"id": "app-api-t", "type": "text"}]))
    els.append(text("app-api-t", 0, 0, "API routes: /api/games, /api/loans, /login ...", size=14,
                     container_id="app-api", frame_id=fid))

    els.append(rect("app-domain", 670, 440, 380, 50, bg="#ffffff", stroke="#1e1e1e", frame_id=fid,
                     bound=[{"id": "app-domain-t", "type": "text"}]))
    els.append(text("app-domain-t", 0, 0, "Domain logic (use cases, entities)", size=14,
                     container_id="app-domain", frame_id=fid))

    # DB cylinder-ish (rect with icon)
    els.append(rect("app-db", 720, 530, 260, 60, bg="#ffec99", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "app-db-t", "type": "text"}]))
    els.append(text("app-db-t", 0, 0, "SQLite  (refugio.db)", size=16,
                     container_id="app-db", stroke="#f08c00", frame_id=fid))

    els.append(text("db-note", 720, 600, "Single file, persistent volume", size=12,
                     stroke="#868e96", frame_id=fid, align="left"))

    # Arrow Caddy -> App
    els.append(arrow("arr-prestamos", 530, 385, [[0, 0], [110, 0]],
                     start_id="caddy-route1", end_id="app-box", stroke="#e8590c", frame_id=fid))

    # Port label
    els.append(text("port-label", 550, 365, ":8000", size=12, stroke="#868e96", frame_id=fid))

    save("docs/diagrams/01-server-architecture.excalidraw", els)


# ============================================================
# DIAGRAM 2: How a Page Loads Data
# ============================================================
def diagram_data_flow() -> None:
    els: list[dict] = []
    fid = "frame-data"
    els.append(frame(fid, 0, 0, 1200, 750, "2. How a Page Loads Data"))

    # Step labels
    y_step1 = 60
    y_step2 = 300

    # --- Step 1 ---
    els.append(text("s1-label", 40, y_step1, "Step 1: Browser downloads the app", size=20, bold=True,
                     align="left", frame_id=fid))

    els.append(rect("browser1", 60, y_step1 + 50, 200, 80, bg="#a5d8ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "browser1-t", "type": "text"}, {"id": "arr-dl", "type": "arrow"}]))
    els.append(text("browser1-t", 0, 0, "Browser", size=16, container_id="browser1", stroke="#1971c2", frame_id=fid))

    els.append(arrow("arr-dl", 260, y_step1 + 90, [[0, 0], [160, 0]],
                     start_id="browser1", end_id="server1", stroke="#1971c2", frame_id=fid))
    els.append(text("arr-dl-t", 290, y_step1 + 60, "GET /prestamos", size=14, stroke="#868e96", frame_id=fid))

    els.append(rect("server1", 420, y_step1 + 50, 200, 80, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "server1-t", "type": "text"}, {"id": "arr-dl", "type": "arrow"}, {"id": "arr-dl-back", "type": "arrow"}]))
    els.append(text("server1-t", 0, 0, "Server", size=16, container_id="server1", stroke="#e8590c", frame_id=fid))

    els.append(arrow("arr-dl-back", 620, y_step1 + 90, [[0, 0], [160, 0]],
                     start_id="server1", end_id="result1", stroke="#2f9e44", frame_id=fid))

    els.append(rect("result1", 780, y_step1 + 40, 360, 100, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "result1-t", "type": "text"}, {"id": "arr-dl-back", "type": "arrow"}]))
    els.append(text("result1-t", 0, 0, "HTML + JavaScript + CSS\n(the \"app shell\")\nKnows HOW to display,\nbut has no data yet", size=14,
                     container_id="result1", stroke="#2f9e44", frame_id=fid))

    # --- Step 2 ---
    els.append(text("s2-label", 40, y_step2, "Step 2: JavaScript asks for data", size=20, bold=True,
                     align="left", frame_id=fid))

    els.append(rect("browser2", 60, y_step2 + 50, 200, 80, bg="#a5d8ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "browser2-t", "type": "text"}, {"id": "arr-api", "type": "arrow"}]))
    els.append(text("browser2-t", 0, 0, "React app\n(in browser)", size=14, container_id="browser2", stroke="#1971c2", frame_id=fid))

    els.append(arrow("arr-api", 260, y_step2 + 90, [[0, 0], [120, 0]],
                     start_id="browser2", end_id="api-box", stroke="#1971c2", frame_id=fid))
    els.append(text("arr-api-t", 270, y_step2 + 60, "GET /api/games", size=14, stroke="#868e96", frame_id=fid))

    els.append(rect("api-box", 380, y_step2 + 50, 160, 80, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "api-box-t", "type": "text"}, {"id": "arr-api", "type": "arrow"}, {"id": "arr-db", "type": "arrow"}]))
    els.append(text("api-box-t", 0, 0, "FastAPI\n(Python)", size=14, container_id="api-box", stroke="#e8590c", frame_id=fid))

    els.append(arrow("arr-db", 540, y_step2 + 90, [[0, 0], [100, 0]],
                     start_id="api-box", end_id="db-box", stroke="#f08c00", frame_id=fid))
    els.append(text("arr-db-t", 555, y_step2 + 60, "SQL query", size=14, stroke="#868e96", frame_id=fid))

    els.append(rect("db-box", 640, y_step2 + 50, 160, 80, bg="#ffec99", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "db-box-t", "type": "text"}, {"id": "arr-db", "type": "arrow"}, {"id": "arr-json", "type": "arrow"}]))
    els.append(text("db-box-t", 0, 0, "SQLite\nrefugio.db", size=14, container_id="db-box", stroke="#f08c00", frame_id=fid))

    els.append(arrow("arr-json", 800, y_step2 + 90, [[0, 0], [120, 0]],
                     start_id="db-box", end_id="json-box", stroke="#2f9e44", frame_id=fid))

    els.append(rect("json-box", 920, y_step2 + 30, 240, 120, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "json-box-t", "type": "text"}, {"id": "arr-json", "type": "arrow"}]))
    els.append(text("json-box-t", 0, 0, 'JSON response:\n[\n  {"name": "Catan",\n   "status": "available"}\n]', size=13, font=3,
                     container_id="json-box", stroke="#2f9e44", frame_id=fid))

    # --- Step 3 (render) ---
    y_step3 = 530
    els.append(text("s3-label", 40, y_step3, "Step 3: React renders the page", size=20, bold=True,
                     align="left", frame_id=fid))

    els.append(rect("render-box", 60, y_step3 + 50, 1080, 120, bg="#d0bfff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "render-t", "type": "text"}]))
    els.append(text("render-t", 0, 0, "React takes the JSON data and renders game cards on screen.\nEach time someone borrows or returns a game, the data in the database changes,\nand the next page load shows the updated state.", size=16,
                     container_id="render-box", stroke="#6741d9", frame_id=fid))

    save("docs/diagrams/02-data-flow.excalidraw", els)


# ============================================================
# DIAGRAM 3: Login Flow
# ============================================================
def diagram_login() -> None:
    els: list[dict] = []
    fid = "frame-login"
    els.append(frame(fid, 0, 0, 1200, 900, "3. Login Flow"))

    cx_browser = 150
    cx_server = 550
    cx_db = 950
    col_w = 200
    header_y = 40

    # Column headers
    els.append(rect("col-browser", cx_browser - 100, header_y, col_w, 50, bg="#a5d8ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "col-browser-t", "type": "text"}]))
    els.append(text("col-browser-t", 0, 0, "Browser", size=18, container_id="col-browser", stroke="#1971c2", frame_id=fid))

    els.append(rect("col-server", cx_server - 100, header_y, col_w, 50, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "col-server-t", "type": "text"}]))
    els.append(text("col-server-t", 0, 0, "Server (FastAPI)", size=18, container_id="col-server", stroke="#e8590c", frame_id=fid))

    els.append(rect("col-db", cx_db - 100, header_y, col_w, 50, bg="#ffec99", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "col-db-t", "type": "text"}]))
    els.append(text("col-db-t", 0, 0, "Database", size=18, container_id="col-db", stroke="#f08c00", frame_id=fid))

    # Vertical lines
    for cx in [cx_browser, cx_server, cx_db]:
        lid = _id("vline")
        els.append(arrow(lid, cx, 100, [[0, 0], [0, 760]], stroke="#dee2e6", stroke_w=1,
                         end_head=None, frame_id=fid, index="a0"))

    # Step 1: User enters credentials
    y = 140
    els.append(rect("step1", cx_browser - 110, y, 220, 50, bg="#e7f5ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "step1-t", "type": "text"}]))
    els.append(text("step1-t", 0, 0, "User types email\n+ password", size=14,
                     container_id="step1", stroke="#1971c2", frame_id=fid))

    # Arrow 1: POST /login
    y += 70
    els.append(arrow("arr1", cx_browser + 10, y, [[0, 0], [cx_server - cx_browser - 20, 0]],
                     stroke="#1971c2", frame_id=fid))
    els.append(text("arr1-t", cx_browser + 80, y - 25, "POST /login\n{email, password}", size=13, font=3,
                     stroke="#1971c2", frame_id=fid))

    # Step 2: Look up member
    y += 30
    els.append(arrow("arr2", cx_server + 10, y, [[0, 0], [cx_db - cx_server - 20, 0]],
                     stroke="#e8590c", frame_id=fid))
    els.append(text("arr2-t", cx_server + 60, y - 22, "Find member by email", size=13,
                     stroke="#e8590c", frame_id=fid))

    # DB returns member with hash
    y += 40
    els.append(arrow("arr3", cx_db - 10, y, [[0, 0], [-(cx_db - cx_server - 20), 0]],
                     stroke="#f08c00", frame_id=fid))
    els.append(text("arr3-t", cx_server + 60, y - 22, "Member + password_hash", size=13,
                     stroke="#f08c00", frame_id=fid))

    # Step 3: Verify password
    y += 30
    els.append(rect("step3", cx_server - 130, y, 260, 70, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "step3-t", "type": "text"}]))
    els.append(text("step3-t", 0, 0, "bcrypt.verify(\n  typed_password,\n  stored_hash\n)", size=13, font=3,
                     container_id="step3", stroke="#e8590c", frame_id=fid))

    # Step 4: Create JWT
    y += 90
    els.append(rect("step4", cx_server - 130, y, 260, 50, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "step4-t", "type": "text"}]))
    els.append(text("step4-t", 0, 0, "Create JWT token\n(signed, 7-day expiry)", size=14,
                     container_id="step4", stroke="#e8590c", frame_id=fid))

    # Arrow back: Set cookie
    y += 70
    els.append(arrow("arr4", cx_server - 10, y, [[0, 0], [-(cx_server - cx_browser - 20), 0]],
                     stroke="#2f9e44", frame_id=fid))
    els.append(text("arr4-t", cx_browser + 40, y - 25, "Set-Cookie: session_token=JWT\nHttpOnly, SameSite=Lax", size=13, font=3,
                     stroke="#2f9e44", frame_id=fid))

    # Browser stores cookie
    y += 40
    els.append(rect("step5", cx_browser - 120, y, 240, 50, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "step5-t", "type": "text"}]))
    els.append(text("step5-t", 0, 0, "Browser stores cookie\n(automatic!)", size=14,
                     container_id="step5", stroke="#2f9e44", frame_id=fid))

    # Future requests
    y += 80
    els.append(text("future-label", 40, y, "From now on, every request:", size=16, bold=True,
                     align="left", stroke="#1e1e1e", frame_id=fid))

    y += 35
    els.append(arrow("arr5", cx_browser + 10, y, [[0, 0], [cx_server - cx_browser - 20, 0]],
                     stroke="#1971c2", frame_id=fid))
    els.append(text("arr5-t", cx_browser + 60, y - 22, "GET /api/games\nCookie: session_token=JWT", size=13, font=3,
                     stroke="#1971c2", frame_id=fid))

    y += 40
    els.append(rect("step6", cx_server - 130, y, 260, 50, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "step6-t", "type": "text"}]))
    els.append(text("step6-t", 0, 0, "Read JWT from cookie\n-> This is Maria (member #5)", size=13,
                     container_id="step6", stroke="#e8590c", frame_id=fid))

    # Cookie properties callout
    y += 90
    els.append(rect("callout", 60, y, 1080, 120, bg="#fff3bf", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "callout-t", "type": "text"}]))
    els.append(text("callout-t", 0, 0,
                     "Cookie security properties:\n"
                     "  HttpOnly  = JavaScript on the page CANNOT read it (prevents XSS attacks)\n"
                     "  SameSite=Lax  = Only sent to our site, not to others (prevents CSRF attacks)\n"
                     "  Max-Age=7 days  = After 7 days, the member must log in again",
                     size=14, font=3, container_id="callout", stroke="#f08c00", align="left", frame_id=fid))

    save("docs/diagrams/03-login-flow.excalidraw", els)


# ============================================================
# DIAGRAM 4: Database Schema
# ============================================================
def diagram_database() -> None:
    els: list[dict] = []
    fid = "frame-db"
    els.append(frame(fid, 0, 0, 1200, 800, "4. Database Tables"))

    # Games table
    gx, gy = 60, 60
    els.append(rect("tbl-games-header", gx, gy, 280, 40, bg="#a5d8ff", stroke="#1971c2", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-games-header-t", "type": "text"}]))
    els.append(text("tbl-games-header-t", 0, 0, "games", size=18, container_id="tbl-games-header", stroke="#1971c2", frame_id=fid))
    els.append(rect("tbl-games-body", gx, gy + 40, 280, 220, bg="#e7f5ff", stroke="#1971c2", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-games-body-t", "type": "text"}]))
    els.append(text("tbl-games-body-t", 0, 0,
                     "id  (primary key)\n"
                     "bgg_id  (from BoardGameGeek)\n"
                     "name\n"
                     "thumbnail_url\n"
                     "image_url\n"
                     "year_published\n"
                     "min_players / max_players\n"
                     "playing_time\n"
                     "bgg_rating",
                     size=14, font=3, container_id="tbl-games-body", stroke="#1971c2", align="left", frame_id=fid))

    # Members table
    mx, my = 60, 440
    els.append(rect("tbl-members-header", mx, my, 280, 40, bg="#b2f2bb", stroke="#2f9e44", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-members-header-t", "type": "text"}]))
    els.append(text("tbl-members-header-t", 0, 0, "members", size=18, container_id="tbl-members-header", stroke="#2f9e44", frame_id=fid))
    els.append(rect("tbl-members-body", mx, my + 40, 280, 220, bg="#ebfbee", stroke="#2f9e44", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-members-body-t", "type": "text"}]))
    els.append(text("tbl-members-body-t", 0, 0,
                     "id  (primary key)\n"
                     "email  (unique)\n"
                     "first_name / last_name\n"
                     "nickname\n"
                     "display_name\n"
                     "password_hash  (bcrypt)\n"
                     "is_admin  (0 or 1)\n"
                     "is_active  (0 or 1)\n"
                     "member_number",
                     size=14, font=3, container_id="tbl-members-body", stroke="#2f9e44", align="left", frame_id=fid))

    # Loans table (center)
    lx, ly = 460, 200
    els.append(rect("tbl-loans-header", lx, ly, 280, 40, bg="#ffd8a8", stroke="#e8590c", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-loans-header-t", "type": "text"}]))
    els.append(text("tbl-loans-header-t", 0, 0, "loans", size=18, container_id="tbl-loans-header", stroke="#e8590c", frame_id=fid))
    els.append(rect("tbl-loans-body", lx, ly + 40, 280, 160, bg="#fff4e6", stroke="#e8590c", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-loans-body-t", "type": "text"}]))
    els.append(text("tbl-loans-body-t", 0, 0,
                     "id  (primary key)\n"
                     "game_id  -> games.id\n"
                     "member_id  -> members.id\n"
                     "borrowed_at\n"
                     "returned_at  (NULL = active)",
                     size=14, font=3, container_id="tbl-loans-body", stroke="#e8590c", align="left", frame_id=fid))

    # Password tokens table
    px, py = 460, 520
    els.append(rect("tbl-tokens-header", px, py, 280, 40, bg="#d0bfff", stroke="#6741d9", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-tokens-header-t", "type": "text"}]))
    els.append(text("tbl-tokens-header-t", 0, 0, "password_tokens", size=18, container_id="tbl-tokens-header", stroke="#6741d9", frame_id=fid))
    els.append(rect("tbl-tokens-body", px, py + 40, 280, 130, bg="#f3f0ff", stroke="#6741d9", rounded=False, frame_id=fid,
                     bound=[{"id": "tbl-tokens-body-t", "type": "text"}]))
    els.append(text("tbl-tokens-body-t", 0, 0,
                     "id  (primary key)\n"
                     "token  (random, unique)\n"
                     "member_id  -> members.id\n"
                     "expires_at  (48 hours)\n"
                     "used_at  (NULL = unused)",
                     size=14, font=3, container_id="tbl-tokens-body", stroke="#6741d9", align="left", frame_id=fid))

    # Relationship arrows
    els.append(arrow("rel-game-loan", 340, 200, [[0, 0], [120, 60]],
                     stroke="#868e96", stroke_w=1, frame_id=fid))
    els.append(text("rel-gl-t", 360, 200, "1:N", size=12, stroke="#868e96", frame_id=fid))

    els.append(arrow("rel-member-loan", 340, 540, [[0, 0], [120, -100]],
                     stroke="#868e96", stroke_w=1, frame_id=fid))
    els.append(text("rel-ml-t", 360, 470, "1:N", size=12, stroke="#868e96", frame_id=fid))

    els.append(arrow("rel-member-token", 340, 600, [[0, 0], [120, 0]],
                     stroke="#868e96", stroke_w=1, frame_id=fid))
    els.append(text("rel-mt-t", 370, 580, "1:N", size=12, stroke="#868e96", frame_id=fid))

    # Explanation box
    els.append(rect("explain", 820, 60, 340, 340, bg="#fff3bf", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "explain-t", "type": "text"}]))
    els.append(text("explain-t", 0, 0,
                     "How to read this:\n\n"
                     "Each table = an Excel sheet\n"
                     "Each row = one record\n"
                     "Arrows = relationships\n\n"
                     "1:N means \"one to many\".\n"
                     "One game can have many loans\n"
                     "(borrowed multiple times).\n"
                     "One member can have many loans\n"
                     "(borrow multiple games).\n\n"
                     "All of this lives in a single\n"
                     "file: refugio.db",
                     size=14, container_id="explain", stroke="#f08c00", align="left", frame_id=fid))

    save("docs/diagrams/04-database.excalidraw", els)


# ============================================================
# DIAGRAM 5: Deployment Pipeline
# ============================================================
def diagram_deploy() -> None:
    els: list[dict] = []
    fid = "frame-deploy"
    els.append(frame(fid, 0, 0, 1200, 700, "5. Deployment: git push to live"))

    bx = 60  # base x for the flow
    y = 80

    # Step 1: Developer
    els.append(rect("dev", bx, y, 240, 80, bg="#d0bfff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "dev-t", "type": "text"}, {"id": "arr-push", "type": "arrow"}]))
    els.append(text("dev-t", 0, 0, "Developer\ngit push development", size=16,
                     container_id="dev", stroke="#6741d9", frame_id=fid))

    els.append(arrow("arr-push", bx + 240, y + 40, [[0, 0], [140, 0]],
                     start_id="dev", end_id="github", stroke="#6741d9", frame_id=fid))

    # Step 2: GitHub
    els.append(rect("github", bx + 380, y, 240, 80, bg="#1e1e1e", stroke="#1e1e1e", frame_id=fid,
                     bound=[{"id": "github-t", "type": "text"}, {"id": "arr-push", "type": "arrow"}, {"id": "arr-actions", "type": "arrow"}]))
    els.append(text("github-t", 0, 0, "GitHub\n(code hosting)", size=16,
                     container_id="github", stroke="#ffffff", frame_id=fid))

    els.append(arrow("arr-actions", bx + 620, y + 40, [[0, 0], [140, 0]],
                     start_id="github", end_id="actions", stroke="#1e1e1e", frame_id=fid))
    els.append(text("arr-actions-t", bx + 640, y - 5, "triggers", size=13, stroke="#868e96", frame_id=fid))

    # Step 3: GitHub Actions
    els.append(rect("actions", bx + 760, y, 340, 80, bg="#ffc9c9", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "actions-t", "type": "text"}, {"id": "arr-actions", "type": "arrow"}, {"id": "arr-ssh", "type": "arrow"}]))
    els.append(text("actions-t", 0, 0, "GitHub Actions\n(automation runner)", size=16,
                     container_id="actions", stroke="#e03131", frame_id=fid))

    # Arrow down to server
    els.append(arrow("arr-ssh", bx + 930, y + 80, [[0, 0], [0, 80]],
                     start_id="actions", end_id="server-deploy", stroke="#e03131", frame_id=fid))
    els.append(text("arr-ssh-t", bx + 945, y + 100, "SSH\nconnection", size=13, stroke="#868e96", frame_id=fid))

    # Server
    y_server = 240
    els.append(rect("server-deploy", bx + 60, y_server, 1040, 420, bg="#f8f9fa", stroke="#868e96", stroke_w=1, frame_id=fid,
                     bound=[{"id": "server-deploy-label", "type": "text"}, {"id": "arr-ssh", "type": "arrow"}]))
    els.append(text("server-deploy-label", 0, 0, "Server (VPS)", size=14, valign="top", align="left",
                     container_id="server-deploy", stroke="#868e96", frame_id=fid))

    # Deploy steps inside server
    steps = [
        ("ds1", "1. git pull", "Download latest code", "#a5d8ff", "#1971c2"),
        ("ds2", "2. docker compose\n   up --build", "Rebuild containers\nwith new code", "#ffd8a8", "#e8590c"),
        ("ds3", "3. refugio migrate", "Apply any new\ndatabase changes", "#ffec99", "#f08c00"),
        ("ds4", "4. refugio\n   import-games", "Sync game catalogue\nfrom BoardGameGeek", "#b2f2bb", "#2f9e44"),
        ("ds5", "5. refugio\n   enrich-games", "Update details:\nimages, ratings", "#d0bfff", "#6741d9"),
    ]

    sx = bx + 100
    sy = y_server + 50
    for i, (sid, label, desc, bg_col, stroke_col) in enumerate(steps):
        els.append(rect(sid, sx, sy, 200, 80, bg=bg_col, stroke=stroke_col, frame_id=fid,
                         bound=[{"id": f"{sid}-t", "type": "text"}]))
        els.append(text(f"{sid}-t", 0, 0, label, size=14, font=3,
                         container_id=sid, stroke=stroke_col, frame_id=fid))
        els.append(text(f"{sid}-desc", sx + 220, sy + 15, desc, size=13, align="left",
                         stroke="#868e96", frame_id=fid))
        if i < len(steps) - 1:
            els.append(arrow(f"arr-ds{i}", sx + 100, sy + 80, [[0, 0], [0, 10]],
                             stroke="#868e96", stroke_w=1, frame_id=fid))
        sy += 90

    # Result callout
    els.append(rect("result-deploy", bx + 580, y_server + 120, 460, 180, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "result-deploy-t", "type": "text"}]))
    els.append(text("result-deploy-t", 0, 0,
                     "Result:\n\n"
                     "The website is updated live\n"
                     "in ~2 minutes after git push.\n\n"
                     "No manual SSH needed.\n"
                     "No files to upload.",
                     size=16, container_id="result-deploy", stroke="#2f9e44", frame_id=fid))

    # PythonAnywhere comparison
    els.append(rect("compare", bx + 580, y_server + 340, 460, 70, bg="#fff3bf", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "compare-t", "type": "text"}]))
    els.append(text("compare-t", 0, 0,
                     "Similar to PythonAnywhere's \"git pull + reload\",\nbut fully automatic on push.",
                     size=14, container_id="compare", stroke="#f08c00", frame_id=fid))

    save("docs/diagrams/05-deployment.excalidraw", els)


# ============================================================
# DIAGRAM 6: Docker Explained
# ============================================================
def diagram_docker() -> None:
    els: list[dict] = []
    fid = "frame-docker"
    els.append(frame(fid, 0, 0, 1200, 700, "6. What is Docker?"))

    # Without Docker
    els.append(text("without-label", 40, 50, "Without Docker:", size=20, align="left",
                     bold=True, frame_id=fid))

    els.append(rect("no-d1", 60, 100, 240, 80, bg="#ffc9c9", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "no-d1-t", "type": "text"}]))
    els.append(text("no-d1-t", 0, 0, 'My laptop\nPython 3.12, Node 20\n"Works fine!"', size=14,
                     container_id="no-d1", stroke="#e03131", frame_id=fid))

    els.append(text("neq", 320, 115, "!=", size=28, stroke="#e03131", frame_id=fid))

    els.append(rect("no-d2", 380, 100, 240, 80, bg="#ffc9c9", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "no-d2-t", "type": "text"}]))
    els.append(text("no-d2-t", 0, 0, 'Server\nPython 3.10, Node 18\n"Crashes!"', size=14,
                     container_id="no-d2", stroke="#e03131", frame_id=fid))

    # With Docker
    els.append(text("with-label", 40, 220, "With Docker:", size=20, align="left",
                     bold=True, frame_id=fid))

    # Container concept
    els.append(rect("container-concept", 60, 270, 560, 160, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "container-concept-t", "type": "text"}]))
    els.append(text("container-concept-t", 0, 0,
                     "Docker Container = a box with everything inside:\n\n"
                     "  Python 3.12  (exact version)\n"
                     "  + all libraries  (exact versions)\n"
                     "  + built frontend  (React app, compiled)\n"
                     "  + our code\n\n"
                     "Runs identically on ANY machine.",
                     size=15, font=3, container_id="container-concept", stroke="#2f9e44", align="left", frame_id=fid))

    # Our two containers
    els.append(text("our-containers", 40, 470, "Our setup has two containers:", size=18, align="left",
                     bold=True, frame_id=fid))

    els.append(rect("c-caddy", 60, 520, 300, 140, bg="#a5d8ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "c-caddy-t", "type": "text"}, {"id": "arr-c", "type": "arrow"}]))
    els.append(text("c-caddy-t", 0, 0,
                     "Caddy\n(the doorman)\n\n"
                     "Handles HTTPS encryption\n"
                     "Routes traffic to the right place",
                     size=14, container_id="c-caddy", stroke="#1971c2", frame_id=fid))

    els.append(arrow("arr-c", 360, 590, [[0, 0], [100, 0]],
                     start_id="c-caddy", end_id="c-app", stroke="#868e96", frame_id=fid))

    els.append(rect("c-app", 460, 520, 300, 140, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "c-app-t", "type": "text"}, {"id": "arr-c", "type": "arrow"}]))
    els.append(text("c-app-t", 0, 0,
                     "App\n(the application)\n\n"
                     "Python + React + Database\n"
                     "All the lending system logic",
                     size=14, container_id="c-app", stroke="#e8590c", frame_id=fid))

    # Analogy
    els.append(rect("analogy", 700, 60, 460, 380, bg="#fff3bf", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "analogy-t", "type": "text"}]))
    els.append(text("analogy-t", 0, 0,
                     "Analogy:\n\n"
                     "Docker is like shipping\n"
                     "a food truck instead of\n"
                     "a recipe.\n\n"
                     "The recipe says:\n"
                     "\"Install Python, install Node,\n"
                     "install these 50 libraries...\"\n"
                     "Things can go wrong.\n\n"
                     "The food truck arrives ready:\n"
                     "everything is already installed\n"
                     "and configured inside.\n"
                     "Just plug it in and serve.",
                     size=16, container_id="analogy", stroke="#f08c00", align="left", frame_id=fid))

    # Docker compose note
    els.append(rect("compose-note", 820, 520, 340, 140, bg="#dee2e6", stroke="#868e96", frame_id=fid,
                     bound=[{"id": "compose-note-t", "type": "text"}]))
    els.append(text("compose-note-t", 0, 0,
                     "Docker Compose\n\n"
                     "Defines how multiple\n"
                     "containers work together.\n"
                     "One config file, one command\n"
                     "to start everything.",
                     size=14, container_id="compose-note", stroke="#868e96", frame_id=fid))

    save("docs/diagrams/06-docker-explained.excalidraw", els)


# ============================================================
# DIAGRAM 7: Agentic Workflow
# ============================================================
def diagram_agentic() -> None:
    els: list[dict] = []
    fid = "frame-agent"
    els.append(frame(fid, 0, 0, 1200, 700, "7. Agentic Development Workflow"))

    # Flow
    y = 60
    steps = [
        ("ag1", "User describes\nwhat they want", "#d0bfff", "#6741d9", 60),
        ("ag2", "AI agent reads\nproject context", "#a5d8ff", "#1971c2", 280),
        ("ag3", "Agent proposes\nchanges", "#ffec99", "#f08c00", 500),
        ("ag4", "User reviews\n& approves", "#ffc9c9", "#e03131", 720),
        ("ag5", "Agent writes\ncode + tests", "#b2f2bb", "#2f9e44", 940),
    ]

    for i, (sid, label, bg_col, stroke_col, sx) in enumerate(steps):
        els.append(rect(sid, sx, y, 200, 80, bg=bg_col, stroke=stroke_col, frame_id=fid,
                         bound=[{"id": f"{sid}-t", "type": "text"}]))
        els.append(text(f"{sid}-t", 0, 0, label, size=15,
                         container_id=sid, stroke=stroke_col, frame_id=fid))
        if i < len(steps) - 1:
            next_sx = steps[i + 1][4]
            els.append(arrow(f"arr-ag{i}", sx + 200, y + 40, [[0, 0], [next_sx - sx - 200, 0]],
                             stroke="#868e96", frame_id=fid))

    # Arrow from last step down to git push
    els.append(arrow("arr-ag-deploy", 1040, y + 80, [[0, 0], [0, 40]],
                     stroke="#868e96", frame_id=fid))
    els.append(rect("ag-deploy", 900, y + 120, 260, 50, bg="#1e1e1e", stroke="#1e1e1e", frame_id=fid,
                     bound=[{"id": "ag-deploy-t", "type": "text"}]))
    els.append(text("ag-deploy-t", 0, 0, "git push -> auto deploy!", size=15,
                     container_id="ag-deploy", stroke="#ffffff", frame_id=fid))

    # Context files
    y_files = 260
    els.append(text("files-label", 40, y_files, "What the AI agent reads:", size=18, bold=True,
                     align="left", frame_id=fid))

    files = [
        ("f1", ".claude/CLAUDE.md", "Coding conventions,\narchitecture rules", "#d0bfff", "#6741d9"),
        ("f2", "openspec/config.yaml", "Tech stack, directory\nstructure, standards", "#a5d8ff", "#1971c2"),
        ("f3", "openspec/specs/", "Feature specifications\n(what the system does)", "#b2f2bb", "#2f9e44"),
        ("f4", "openspec/changes/", "Change proposals\n(how to modify things)", "#ffd8a8", "#e8590c"),
        ("f5", "tasks/prd-*.md", "Product Requirements\n(user stories, decisions)", "#ffec99", "#f08c00"),
    ]

    fx = 60
    fy = y_files + 45
    for sid, name, desc, bg_col, stroke_col in files:
        els.append(rect(sid, fx, fy, 220, 70, bg=bg_col, stroke=stroke_col, frame_id=fid,
                         bound=[{"id": f"{sid}-t", "type": "text"}]))
        els.append(text(f"{sid}-t", 0, 0, name, size=14, font=3,
                         container_id=sid, stroke=stroke_col, frame_id=fid))
        els.append(text(f"{sid}-desc", fx + 240, fy + 10, desc, size=13,
                         stroke="#868e96", align="left", frame_id=fid))
        fy += 85

    # Key point
    els.append(rect("key-point", 620, y_files + 60, 520, 200, bg="#fff3bf", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "key-point-t", "type": "text"}]))
    els.append(text("key-point-t", 0, 0,
                     "Key idea:\n\n"
                     "The AI reads these files to understand\n"
                     "the project's rules and patterns.\n\n"
                     "It follows the same conventions a human\n"
                     "developer would — consistent code style,\n"
                     "architecture, and testing standards.\n\n"
                     "When we integrate the existing site, we'll\n"
                     "create new change proposals here.",
                     size=15, container_id="key-point", stroke="#f08c00", align="left", frame_id=fid))

    save("docs/diagrams/07-agentic-workflow.excalidraw", els)


# ============================================================
# DIAGRAM 8: Password Setup Flow
# ============================================================
def diagram_password_setup() -> None:
    els: list[dict] = []
    fid = "frame-pwd"
    els.append(frame(fid, 0, 0, 1200, 900, "8. How Members Get Their Password"))

    # Intro text
    els.append(text("intro", 40, 40,
                     "Members don't register themselves. An admin imports them; from then on the member"
                     " can either be onboarded by the admin or use \"I forgot my password\" themselves.",
                     size=16, align="left", stroke="#868e96", frame_id=fid))

    # --- Phase 1: Import ---
    y = 100
    els.append(rect("phase1-bg", 40, y, 1120, 200, bg="#f8f9fa", stroke="#dee2e6", stroke_w=1, frame_id=fid))
    els.append(text("phase1-label", 60, y + 10, "Phase 1: Admin imports members", size=18,
                     align="left", bold=True, frame_id=fid))

    els.append(rect("csv", 60, y + 50, 220, 70, bg="#ffec99", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "csv-t", "type": "text"}, {"id": "arr-csv", "type": "arrow"}]))
    els.append(text("csv-t", 0, 0, "members.csv\n(name, email, phone)", size=14, font=3,
                     container_id="csv", stroke="#f08c00", frame_id=fid))

    els.append(arrow("arr-csv", 280, y + 85, [[0, 0], [80, 0]],
                     start_id="csv", end_id="cli-import", stroke="#f08c00", frame_id=fid))

    els.append(rect("cli-import", 360, y + 50, 260, 70, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "cli-import-t", "type": "text"}, {"id": "arr-csv", "type": "arrow"}, {"id": "arr-import-db", "type": "arrow"}]))
    els.append(text("cli-import-t", 0, 0, "refugio import-members\n(CLI command)", size=14, font=3,
                     container_id="cli-import", stroke="#e8590c", frame_id=fid))

    els.append(arrow("arr-import-db", 620, y + 85, [[0, 0], [80, 0]],
                     start_id="cli-import", end_id="db-import", stroke="#e8590c", frame_id=fid))

    els.append(rect("db-import", 700, y + 40, 200, 90, bg="#a5d8ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "db-import-t", "type": "text"}, {"id": "arr-import-db", "type": "arrow"}, {"id": "arr-gen-token", "type": "arrow"}]))
    els.append(text("db-import-t", 0, 0, "Creates member\nin database\n(no password yet!)", size=14,
                     container_id="db-import", stroke="#1971c2", frame_id=fid))

    els.append(arrow("arr-gen-token", 900, y + 85, [[0, 0], [60, 0]],
                     start_id="db-import", end_id="token-out", stroke="#1971c2", frame_id=fid))

    els.append(rect("token-out", 960, y + 40, 180, 90, bg="#d0bfff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "token-out-t", "type": "text"}, {"id": "arr-gen-token", "type": "arrow"}]))
    els.append(text("token-out-t", 0, 0, "Generates\none-time link\n(48h expiry)", size=14,
                     container_id="token-out", stroke="#6741d9", frame_id=fid))

    # Output example
    els.append(rect("link-example", 60, y + 150, 700, 35, bg="#f3f0ff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "link-example-t", "type": "text"}]))
    els.append(text("link-example-t", 0, 0,
                     "Output:  Maria (maria@example.com): https://refugidelsatiro.cat/prestamos/set-password?token=a3f8c9...",
                     size=13, font=3, container_id="link-example", stroke="#6741d9", frame_id=fid))

    # --- Phase 2: How the link reaches the member (two options) ---
    y2 = 330
    els.append(rect("phase2-bg", 40, y2, 1120, 230, bg="#f8f9fa", stroke="#dee2e6", stroke_w=1, frame_id=fid))
    els.append(text("phase2-label", 60, y2 + 10, "Phase 2: How the link reaches the member", size=18,
                     align="left", bold=True, frame_id=fid))

    # Option A — Admin onboards the member
    els.append(text("opt-a-label", 60, y2 + 45,
                     "Option A — Admin onboards the member (first-time setup)",
                     size=14, align="left", stroke="#868e96", frame_id=fid))

    els.append(rect("admin-share", 60, y2 + 70, 160, 40, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "admin-share-t", "type": "text"}, {"id": "arr-share", "type": "arrow"}]))
    els.append(text("admin-share-t", 0, 0, "Admin", size=14, container_id="admin-share", stroke="#e8590c", frame_id=fid))

    els.append(arrow("arr-share", 220, y2 + 90, [[0, 0], [140, 0]],
                     start_id="admin-share", end_id="share-method", stroke="#e8590c", frame_id=fid))

    els.append(rect("share-method", 360, y2 + 65, 300, 50, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "share-method-t", "type": "text"}, {"id": "arr-share", "type": "arrow"}, {"id": "arr-to-member", "type": "arrow"}]))
    els.append(text("share-method-t", 0, 0, "Sends link via WhatsApp,\nemail, Signal, etc.", size=14,
                     container_id="share-method", stroke="#2f9e44", frame_id=fid))

    els.append(arrow("arr-to-member", 660, y2 + 90, [[0, 0], [100, 0]],
                     start_id="share-method", end_id="member-receives", stroke="#2f9e44", frame_id=fid))

    els.append(rect("member-receives", 760, y2 + 70, 160, 40, bg="#a5d8ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "member-receives-t", "type": "text"}, {"id": "arr-to-member", "type": "arrow"}]))
    els.append(text("member-receives-t", 0, 0, "Member", size=14, container_id="member-receives", stroke="#1971c2", frame_id=fid))

    # Option B — Member self-serves via "I forgot my password"
    els.append(text("opt-b-label", 60, y2 + 130,
                     "Option B — Member self-serves (forgot password, password expired, etc.)",
                     size=14, align="left", stroke="#868e96", frame_id=fid))

    els.append(rect("self-member", 60, y2 + 155, 160, 40, bg="#a5d8ff", stroke="#1971c2", frame_id=fid,
                     bound=[{"id": "self-member-t", "type": "text"}, {"id": "arr-self-1", "type": "arrow"}]))
    els.append(text("self-member-t", 0, 0, "Member", size=14, container_id="self-member", stroke="#1971c2", frame_id=fid))

    els.append(arrow("arr-self-1", 220, y2 + 175, [[0, 0], [140, 0]],
                     start_id="self-member", end_id="self-form", stroke="#1971c2", frame_id=fid))

    els.append(rect("self-form", 360, y2 + 150, 300, 50, bg="#d0bfff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "self-form-t", "type": "text"}, {"id": "arr-self-1", "type": "arrow"}, {"id": "arr-self-2", "type": "arrow"}]))
    els.append(text("self-form-t", 0, 0, "Visits \"I forgot my password\"\nand enters their email", size=14,
                     container_id="self-form", stroke="#6741d9", frame_id=fid))

    els.append(arrow("arr-self-2", 660, y2 + 175, [[0, 0], [100, 0]],
                     start_id="self-form", end_id="self-server", stroke="#6741d9", frame_id=fid))

    els.append(rect("self-server", 760, y2 + 150, 200, 50, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "self-server-t", "type": "text"}, {"id": "arr-self-2", "type": "arrow"}]))
    els.append(text("self-server-t", 0, 0, "Server emails the link\nto the registered address", size=14,
                     container_id="self-server", stroke="#e8590c", frame_id=fid))

    # --- Phase 3: Member sets password ---
    y3 = 590
    els.append(rect("phase3-bg", 40, y3, 1120, 300, bg="#f8f9fa", stroke="#dee2e6", stroke_w=1, frame_id=fid))
    els.append(text("phase3-label", 60, y3 + 10, "Phase 3: Member clicks link and sets password", size=18,
                     align="left", bold=True, frame_id=fid))

    flow_y = y3 + 55
    steps = [
        ("pw1", "Member clicks\nthe link", "#a5d8ff", "#1971c2"),
        ("pw2", "Browser shows\n\"Set password\" form", "#d0bfff", "#6741d9"),
        ("pw3", "Member types\nnew password", "#a5d8ff", "#1971c2"),
        ("pw4", "Server checks:\ntoken valid?\nnot expired?\nnot used?", "#ffd8a8", "#e8590c"),
    ]

    px = 60
    for i, (sid, label, bg_col, stroke_col) in enumerate(steps):
        h = 90 if sid == "pw4" else 70
        els.append(rect(sid, px, flow_y, 220, h, bg=bg_col, stroke=stroke_col, frame_id=fid,
                         bound=[{"id": f"{sid}-t", "type": "text"}]))
        els.append(text(f"{sid}-t", 0, 0, label, size=14,
                         container_id=sid, stroke=stroke_col, frame_id=fid))
        if i < len(steps) - 1:
            els.append(arrow(f"arr-pw{i}", px + 220, flow_y + 35, [[0, 0], [40, 0]],
                             stroke="#868e96", frame_id=fid))
        px += 260

    # Result
    flow_y2 = flow_y + 120
    els.append(arrow("arr-pw-result", 700, flow_y + 90, [[0, 0], [0, 30]],
                     stroke="#2f9e44", frame_id=fid))

    els.append(rect("pw-result", 60, flow_y2, 1080, 100, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "pw-result-t", "type": "text"}]))
    els.append(text("pw-result-t", 0, 0,
                     "If valid:\n"
                     "  1. Password is hashed with bcrypt and stored in the database\n"
                     "  2. Token is marked as \"used\" (can't be reused)\n"
                     "  3. Member is redirected to the login page — they can now log in normally!",
                     size=15, font=3, container_id="pw-result", stroke="#2f9e44", align="left", frame_id=fid))

    save("docs/diagrams/08-password-setup.excalidraw", els)


# ============================================================
# DIAGRAM 9: Website Integration Vision
# ============================================================
def diagram_integration() -> None:
    els: list[dict] = []
    fid = "frame-vision"
    els.append(frame(fid, 0, 0, 1200, 800, "9. Website Integration: Current vs Future"))

    # --- CURRENT STATE (left) ---
    els.append(text("current-label", 40, 40, "CURRENT STATE", size=22, bold=True,
                     align="left", stroke="#e03131", frame_id=fid))

    # Existing site box
    els.append(rect("cur-static", 40, 90, 500, 280, bg="#ffc9c9", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "cur-static-title", "type": "text"}]))
    els.append(text("cur-static-title", 0, 0, "The existing static site", size=18,
                     container_id="cur-static", stroke="#e03131", valign="top", frame_id=fid))

    els.append(rect("cur-s1", 70, 140, 200, 40, bg="#ffffff", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "cur-s1-t", "type": "text"}]))
    els.append(text("cur-s1-t", 0, 0, "Home page", size=14, container_id="cur-s1", stroke="#e03131", frame_id=fid))

    els.append(rect("cur-s2", 70, 195, 200, 40, bg="#ffffff", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "cur-s2-t", "type": "text"}]))
    els.append(text("cur-s2-t", 0, 0, "About / Info", size=14, container_id="cur-s2", stroke="#e03131", frame_id=fid))

    els.append(rect("cur-s3", 70, 250, 200, 40, bg="#ffffff", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "cur-s3-t", "type": "text"}]))
    els.append(text("cur-s3-t", 0, 0, "Events / Calendar", size=14, container_id="cur-s3", stroke="#e03131", frame_id=fid))

    els.append(rect("cur-s4", 70, 305, 200, 40, bg="#ffffff", stroke="#e03131", frame_id=fid,
                     bound=[{"id": "cur-s4-t", "type": "text"}]))
    els.append(text("cur-s4-t", 0, 0, "Contact", size=14, container_id="cur-s4", stroke="#e03131", frame_id=fid))

    els.append(text("cur-tech1", 300, 150, "HTML + CSS\n(no server logic)\n\nHosted on\nPythonAnywhere\nor similar",
                     size=14, stroke="#868e96", align="left", frame_id=fid))

    # Lending system box (separate)
    els.append(rect("cur-lending", 40, 400, 500, 120, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "cur-lending-title", "type": "text"}]))
    els.append(text("cur-lending-title", 0, 0, "Lending system (separate!)", size=18,
                     container_id="cur-lending", stroke="#e8590c", valign="top", frame_id=fid))

    els.append(text("cur-lending-detail", 70, 440, "Python + React + SQLite\nAt /prestamos/ on a different server",
                     size=14, stroke="#868e96", align="left", frame_id=fid))

    # Disconnection indicator
    els.append(text("disconnect", 200, 375, "separate, not connected", size=14,
                     stroke="#e03131", frame_id=fid))

    # --- FUTURE STATE (right) ---
    els.append(text("future-label", 620, 40, "FUTURE: UNIFIED WEBSITE", size=22, bold=True,
                     align="left", stroke="#2f9e44", frame_id=fid))

    # Unified site
    els.append(rect("fut-site", 620, 90, 540, 520, bg="#b2f2bb", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "fut-site-title", "type": "text"}]))
    els.append(text("fut-site-title", 0, 0, "refugidelsatiro.cat", size=20,
                     container_id="fut-site", stroke="#2f9e44", valign="top", frame_id=fid))

    # Navigation bar
    els.append(rect("fut-nav", 650, 140, 480, 40, bg="#dee2e6", stroke="#868e96", frame_id=fid,
                     bound=[{"id": "fut-nav-t", "type": "text"}]))
    els.append(text("fut-nav-t", 0, 0, "Home    About    Events    Lending    Contact", size=14,
                     container_id="fut-nav", stroke="#868e96", frame_id=fid))

    # Static sections
    els.append(rect("fut-static-area", 650, 200, 480, 150, bg="#ffffff", stroke="#2f9e44", frame_id=fid,
                     bound=[{"id": "fut-static-t", "type": "text"}]))
    els.append(text("fut-static-t", 0, 0,
                     "Static pages (the existing site):\n\n"
                     "  /              Home page\n"
                     "  /about         About the association\n"
                     "  /events        Events and calendar\n"
                     "  /contact       Contact info",
                     size=14, font=3, container_id="fut-static-area", stroke="#2f9e44", align="left", frame_id=fid))

    # Lending section
    els.append(rect("fut-lending-area", 650, 370, 480, 130, bg="#ffd8a8", stroke="#e8590c", frame_id=fid,
                     bound=[{"id": "fut-lending-t", "type": "text"}]))
    els.append(text("fut-lending-t", 0, 0,
                     "Dynamic section (lending system):\n\n"
                     "  /prestamos/           Game catalogue\n"
                     "  /prestamos/games/:id  Game detail + borrow\n"
                     "  /prestamos/my-loans   My active loans",
                     size=14, font=3, container_id="fut-lending-area", stroke="#e8590c", align="left", frame_id=fid))

    # Shared elements callout
    els.append(rect("fut-shared", 650, 520, 480, 70, bg="#d0bfff", stroke="#6741d9", frame_id=fid,
                     bound=[{"id": "fut-shared-t", "type": "text"}]))
    els.append(text("fut-shared-t", 0, 0,
                     "Shared: same visual style, same navigation bar,\n"
                     "same login across the whole site",
                     size=14, container_id="fut-shared", stroke="#6741d9", frame_id=fid))

    # Arrow connecting current to future
    els.append(arrow("arr-transform", 540, 300, [[0, 0], [80, 0]],
                     stroke="#2f9e44", stroke_w=3, frame_id=fid))

    # How it works (bottom)
    els.append(rect("how-box", 40, 640, 1120, 120, bg="#fff3bf", stroke="#f08c00", frame_id=fid,
                     bound=[{"id": "how-t", "type": "text"}]))
    els.append(text("how-t", 0, 0,
                     "How it connects:\n\n"
                     "Caddy (the reverse proxy) routes traffic based on URL path:\n"
                     "  /prestamos/*  ->  App container (FastAPI + React)     = dynamic, with database and login\n"
                     "  everything else  ->  Static files                    = static HTML/CSS pages\n\n"
                     "Both live on the same domain, same server. One Caddy config ties them together.",
                     size=14, font=3, container_id="how-box", stroke="#f08c00", align="left", frame_id=fid))

    save("docs/diagrams/09-website-integration.excalidraw", els)


# ============================================================
# Main
# ============================================================
if __name__ == "__main__":
    import os
    os.makedirs("docs/diagrams", exist_ok=True)
    print("Generating Excalidraw diagrams...")
    diagram_architecture()
    diagram_data_flow()
    diagram_login()
    diagram_database()
    diagram_deploy()
    diagram_docker()
    diagram_agentic()
    diagram_password_setup()
    diagram_integration()
    print("Done! Open any .excalidraw file in VS Code or at https://excalidraw.com")
