FROM node:23.1-alpine3.19

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Update Vite configuration to listen on all interfaces (no proxy — okube handles discovery)
RUN echo 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    host: "0.0.0.0",\n    port: 5173\n  }\n});' > vite.config.js

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]