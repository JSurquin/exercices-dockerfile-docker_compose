from node:24-alpine

WORKDIR /app

COPY prisma/ package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# COPY pom.xml .

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile && \
    npx prisma generate

COPY . . 

RUN pnpm run build

COPY ./.next/standalone ./
#COPY ./.next/static ./next/static
#COPY .next/public ./
# A LA RACINE DE APP ON A NOTRE SERVER.JS
#COPY .next/standalone/.next/static ./

EXPOSE 3000 
CMD ["node", "./server.js"]

# TO DO = Vous faire juste en dessous du multi stage build

# from node:24-alpine as builder

# WORKDIR /app

# COPY prisma/ package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# RUN npm install -g pnpm && \
#     pnpm install --frozen-lockfile && \
#     npx prisma generate

# COPY . . 

# RUN pnpm run build

# FROM node:24-alpine as runner

# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./next/static

# EXPOSE 3000 
# CMD ["node", "./server.js"]