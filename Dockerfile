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
ARG EMAILJS_PUBLIC_KEY
ARG EMAILJS_SERVICE_ID
ARG EMAILJS_TEMPLATE_ID
ARG EMAILJS_RECIPIENT
RUN EMAILJS_PUBLIC_KEY="$EMAILJS_PUBLIC_KEY" \
    EMAILJS_SERVICE_ID="$EMAILJS_SERVICE_ID" \
    EMAILJS_TEMPLATE_ID="$EMAILJS_TEMPLATE_ID" \
    EMAILJS_RECIPIENT="$EMAILJS_RECIPIENT" \
    node build.js

# =============================================================
# Stage 2: RUNTIME
# Serve folder dist/ (hasil build) pakai nginx, image kecil & ringan
# =============================================================
FROM php:8.3-fpm-alpine AS runtime

RUN apk add --no-cache nginx wget \
    && mkdir -p /run/nginx

WORKDIR /var/www/html

# Hapus default nginx config & static content bawaan
RUN rm -rf /usr/share/nginx/html/* \
    && rm -f /etc/nginx/conf.d/default.conf

# Config nginx khusus untuk static site bilingual ini
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy hasil build (bukan source-nya) ke web root
COPY --from=builder /app/dist /usr/share/nginx/html

RUN sed -i 's|^user = .*|user = nginx|; s|^group = .*|group = nginx|; s|^listen.owner = .*|listen.owner = nginx|; s|^listen.group = .*|listen.group = nginx|' /usr/local/etc/php-fpm.d/www.conf \
    && chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]
