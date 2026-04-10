FROM php:8.3-apache

# Cài đặt các thư viện hệ thống
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# Xoá cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Cài đặt PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Enable Apache mod_rewrite cho Laravel
RUN a2enmod rewrite

# Cấu hình Apache DocumentRoot trỏ vào thư mục public của Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf.d/*.conf

# Copy script của Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Chuyển thư mục làm việc
WORKDIR /var/www/html

# Copy source code vao container
COPY . .

# Cài dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Cấp quyền cho Laravel
RUN chown -R www-data:www-data storage bootstrap/cache

# Render sẽ tự cấp PORT, Apache mặc định chạy cổng 80, Render sẽ tự map
EXPOSE 80

CMD ["apache2-foreground"]
