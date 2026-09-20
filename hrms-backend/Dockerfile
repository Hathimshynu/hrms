FROM php:8.3-apache
RUN apt-get update && apt-get install -y libpq-dev libzip-dev unzip git \
 && docker-php-ext-install pdo_pgsql zip && a2enmod rewrite
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
  /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction \
 && chown -R www-data:www-data storage bootstrap/cache
COPY docker-start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]