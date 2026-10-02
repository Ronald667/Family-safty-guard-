import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import {GoogleGenAI} from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

// Initialize Gemini API
const ai = new GoogleGenAI({apiKey: process.env['GEMINI_API_KEY'] || ''});

// AI Safety & Legal Guidance Assistant endpoint
app.post('/api/ai-chat', async (req, res) => {
  try {
    const {message, history} = req.body;
    
    if (!process.env['GEMINI_API_KEY']) {
      return res.json({
        reply: "SafeHaven AI Assistant is currently in offline fallback mode (API key not configured). Please contact emergency services directly at 911 or your local crisis hotline if you are in immediate danger."
      });
    }

    const systemInstruction = `You are SafeHaven AI, a compassionate, trauma-informed, and highly confidential assistant specializing in gender-based violence (GBV) prevention, safety planning, and family protection. 
Your tone is calm, empathetic, empowering, and non-judgmental. 
Always prioritize the user's physical safety first. If a user is in immediate danger, explicitly advise them to press the SOS Panic button or call emergency services (911, 999, 112).
Provide practical steps for safety planning, guidance on documenting incidents securely, and information on legal rights and support resources without giving formal legal verdicts.`;

    const contents = [
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{text: h.content}]
      })),
      {role: 'user', parts: [{text: message}]}
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return res.json({reply: response.text || "I am here to support you. Please stay safe and reach out to our emergency resources if needed."});
  } catch (err: unknown) {
    console.error('AI Chat Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate AI response';
    return res.status(500).json({error: message});
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

