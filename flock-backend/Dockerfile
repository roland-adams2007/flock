# 1. Write the template directly into Alpine's default Nginx configuration folder
RUN cat <<'EOF' > /etc/nginx/http.d/default.conf.template
server {
    listen ${PORT};
    server_name _;
    root /var/www/html/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php index.html;

    charset utf-8;

    client_max_body_size 60M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 120;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

# 2. Create the missing supervisor folder before writing the configuration
RUN mkdir -p /etc/supervisor/conf.d && cat <<'EOF' > /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/dev/stdout
logfile_maxbytes=0

[program:php-fpm]
command=php-fpm -F
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# 3. Update the entrypoint to use the correct http.d paths
RUN cat <<'EOF' > /entrypoint.sh
#!/bin/sh
set -e

export PORT="${PORT:-10000}"

# Updated paths here:
envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

if [ ! -f /var/www/html/.env ] && [ -f /var/www/html/.env.example ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

if [ "$RUN_MIGRATIONS" = "true" ]; then
    php artisan migrate --force
fi

exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /entrypoint.sh

EXPOSE 10000

ENV PORT=10000

ENTRYPOINT ["/entrypoint.sh"]