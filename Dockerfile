FROM nginx:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Only the site itself; setup.js, tests and docs stay out of the image.
COPY src/index.html src/santa.js /usr/share/nginx/html/

# data/assignments.json is not baked in: mount it at runtime (see README).
