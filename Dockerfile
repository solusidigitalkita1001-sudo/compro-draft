# =============================================================
# Stage 1: BUILD
# Menjalankan build.js (node build.js) untuk generate folder dist/
# dari source/ + page.config.json + i18n
# =============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy semuanya yang dibutuhkan build.js
COPY build.js page.config.json ./
COPY source ./source
COPY css ./css
COPY js ./js
COPY image ./image
COPY icons ./icons
COPY scss ./scss
COPY contact ./contact

# build.js murni pakai modul bawaan Node (fs, path) -- tidak perlu npm install
RUN node build.js

# =============================================================
# Stage 2: RUNTIME
# Serve folder dist/ (hasil build) pakai nginx, image kecil & ringan
# =============================================================
FROM nginx:1.27-alpine AS runtime

# Hapus default nginx config & static content bawaan
RUN rm -rf /usr/share/nginx/html/* \
    && rm -f /etc/nginx/conf.d/default.conf

# Config nginx khusus untuk static site bilingual ini
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy hasil build (bukan source-nya) ke web root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
