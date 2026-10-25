FROM nginx:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html santa.js /usr/share/nginx/html/

# data/assignments.json is not baked in: mount it at runtime (see README).
