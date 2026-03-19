FROM node:20-slim

WORKDIR /app

RUN npm install -g openclaw

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["openclaw", "start", "--headless"]
```

4. Scroll down → tap **Commit new file** → tap the green **Commit new file** button
5. ✅ Dockerfile saved.

---

### 🔵 STEP 8 — Create the README (Hugging Face metadata)

Hugging Face Spaces needs a special header in the README to recognize your app.

1. On your GitHub repo, tap on the file **README.md** → tap the pencil ✏️ icon to edit
2. **Replace everything** in it with this:
```
---
title: My OpenClaw Assistant
emoji: 🦞
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
app_port: 3000
---

# OpenClaw Assistant
My personal AI assistant running 24/7.
