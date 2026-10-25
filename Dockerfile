FROM nginx:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html santa.js /usr/share/nginx/html/

COPY data/ /usr/share/nginx/html/data
