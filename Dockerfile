# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build com variáveis de ambiente
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_AZURE_ORG=sefaz-ceara-lab
ARG VITE_AZURE_PROJECT=DEV
ARG VITE_AZURE_PAT
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AZURE_ORG=$VITE_AZURE_ORG
ENV VITE_AZURE_PROJECT=$VITE_AZURE_PROJECT
ENV VITE_AZURE_PAT=$VITE_AZURE_PAT

RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Copiar configuração nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
