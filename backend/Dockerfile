FROM php:8.3-fpm

# Cài đặt các thư viện hệ thống cần thiết cho bản Laravel
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Xoá cache của package manager
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Cài đặt PHP extensions cần thiết
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Copy script của Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Chuyển thư mục làm việc mặc định
WORKDIR /var/www

# Copy source code vao container
COPY . .

# Cai dependencies cho production va toi uu autoloader
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Tao cache de giam startup time
RUN php artisan config:cache && php artisan route:cache && php artisan view:cache

# Cap quyen ghi cho cac thu muc runtime cua Laravel
RUN chown -R www-data:www-data storage bootstrap/cache

# Render cap cong qua bien PORT, fallback 10000 cho local run
CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
