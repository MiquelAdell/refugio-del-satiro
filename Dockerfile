# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM python:3.12-slim
WORKDIR /app

COPY pyproject.toml ./
COPY backend/ ./backend/
COPY scraper/ ./scraper/
COPY data/ ./data/
RUN pip install --no-cache-dir .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 8000

CMD ["uvicorn", "backend.api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
