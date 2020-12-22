FROM php:7.3-fpm

MAINTAINER info@idweaver.com

ENV DEBIAN_FRONTEND noninteractive

# Enable secure repository
RUN apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update && apt-get -y install apt-transport-https apt-utils

# Update OS
RUN apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update \
&& apt-get -y dist-upgrade

# install the PHP extensions we need
RUN set -eux; \
	\
	if command -v a2enmod; then \
		a2enmod rewrite; \
	fi; \
	\
	savedAptMark="$(apt-mark showmanual)"; \
	\
	apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update; \
	apt-get install -y --no-install-recommends \
		libfreetype6-dev \
		libjpeg-dev \
		libpng-dev \
		libpq-dev \
		libzip-dev \
		unzip \
		patch \
	; \
	\
	docker-php-ext-configure gd --with-png-dir=/usr/include/ --with-jpeg-dir=/usr/include/ --with-freetype-dir=/usr/include/ \
  ; \
	\
	docker-php-ext-install -j "$(nproc)" \
		gd \
		opcache \
		pdo_mysql \
		zip \
		bcmath \
	; \
	\
# reset apt-mark's "manual" list so that "purge --auto-remove" will remove all build dependencies
	apt-mark auto '.*' > /dev/null; \
	apt-mark manual $savedAptMark; \
	ldd "$(php -r 'echo ini_get("extension_dir");')"/*.so \
		| awk '/=>/ { print $3 }' \
		| sort -u \
		| xargs -r dpkg-query -S \
		| cut -d: -f1 \
		| sort -u \
		| xargs -rt apt-mark manual; \
	\
	apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false; \
	rm -rf /var/lib/apt/lists/*

# Set server timezone
RUN ln -snf /usr/share/zoneinfo/Europe/Brussels /etc/localtime && echo Europe/Brussels > /etc/timezone

# Install composer
COPY --from=composer:1.10 /usr/bin/composer /usr/local/bin/
# https://getcomposer.org/doc/03-cli.md#composer-allow-superuser
ENV COMPOSER_ALLOW_SUPERUSER=1

#Install drush launcher
ADD https://github.com/drush-ops/drush-launcher/releases/download/0.6.0/drush.phar drush.phar
RUN chmod +x drush.phar \
    && mv drush.phar /usr/local/bin/drush

# Authentification for github.com
COPY github_auth.json /root/.composer/config.json

# Change PHP-FPM user
RUN groupadd -g 1000 web \
&& useradd -d /var/www/ -s /usr/sbin/nologin -u 1000 -g 1000 web \
&& chown -R web:web /var/www/ \
&& sed -i s/'user = www-data'/'user = web'/g /usr/local/etc/php-fpm.d/www.conf \
&& sed -i s/'group = www-data'/'group = web'/g /usr/local/etc/php-fpm.d/www.conf

RUN apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update -y; \
    apt-get install mariadb-client -y; \
    pecl install xdebug-2.9.8 apcu; \
    docker-php-ext-enable xdebug apcu; \
    pecl clear-cache;

COPY dev.ini /usr/local/etc/php/conf.d/dev.ini

WORKDIR /app/drupal
