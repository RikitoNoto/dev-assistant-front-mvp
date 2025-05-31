# To run this container and connect to a backend server on localhost:8888, use:
# Docker for Mac/Windows: docker build -t dev-assistant-front . && docker run -p 80:80 dev-assistant-front
# Docker for Linux: docker build -t dev-assistant-front . && docker run -p 80:80 --add-host=host.docker.internal:host-gateway dev-assistant-front

# Stage 1: Build the application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json/yarn.lock
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM nginx:stable-alpine

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Configure nginx to handle SPA routing
RUN echo '\
server {\
    listen       80;\
    server_name  localhost;\
    \
    location / {\
        root   /usr/share/nginx/html;\
        index  index.html index.htm;\
        try_files $uri $uri/ /index.html;\
    }\
    \
    # Proxy all API requests to backend server\
    location ~ ^/(chat|projects|documents) {\
        proxy_pass http://host.docker.internal:8888;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
    \
    error_page   500 502 503 504  /50x.html;\
    location = /50x.html {\
        root   /usr/share/nginx/html;\
    }\
}' > /etc/nginx/conf.d/default.conf

# Start nginx
CMD ["nginx", "-g", "daemon off;"]