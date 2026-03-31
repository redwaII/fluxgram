FROM node:20-alpine AS frontend-build
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_URL=
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /fe/dist /usr/share/nginx/html
