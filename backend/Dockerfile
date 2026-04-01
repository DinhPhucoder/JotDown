FROM php:8.2-fpm

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
