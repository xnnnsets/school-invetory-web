#!/usr/bin/env sh
set -eu

export PORT="${PORT:-80}"
export API_UPSTREAM="${API_UPSTREAM:-http://localhost:4000}"

envsubst '$PORT $API_UPSTREAM' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

