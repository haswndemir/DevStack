import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 5173,
    },
    plugins: [
      {
        name: 'dev-api-ai-proxy',
        configureServer(server) {
          server.middlewares.use('/api/ai/chat', async (req, res, next) => {
            if (req.method === 'POST') {
              // Ensure process.env.GEMINI_API_KEY is available in local dev
              process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
              process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || env.GEMINI_MODEL;

              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  req.body = body ? JSON.parse(body) : {};

                  res.status = (statusCode) => {
                    res.statusCode = statusCode;
                    return res;
                  };
                  res.json = (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return res;
                  };

                  const { default: handler } = await import('./api/ai/chat.js');
                  await handler(req, res);
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } else {
              next();
            }
          });
        },
      },
    ],
  };
});
