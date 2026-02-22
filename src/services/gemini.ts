
import { GoogleGenAI, LiveServerMessage, Modality, GenerateContentResponse, Chat, Blob as GenAIBlob, Type, ThinkingLevel } from "@google/genai";
import { MATH_MODELS, SYSTEM_INSTRUCTION } from "../constants";

export type ScanMode = 'handwriting' | 'print' | 'standard';

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

/**
 * Advanced Image Enhancement for Mathematical OCR
 * Handwriting mode increases contrast and applies a sharpening filter to ink strokes.
 * Print mode normalizes lighting and removes shadows.
 */
export const enhanceImage = async (base64: string, mode: ScanMode = 'standard'): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply professional image filters for OCR
      if (mode === 'handwriting') {
        // High contrast, slightly darker, sharpens ink on white paper
        ctx.filter = 'contrast(1.6) grayscale(1) brightness(1.1) saturate(0) contrast(1.2) drop-shadow(0 0 1px black)';
      } else if (mode === 'print') {
        // Normalizes light, cleans up background noise
        ctx.filter = 'contrast(1.4) grayscale(1) brightness(1.05)';
      } else {
        ctx.filter = 'contrast(1.3) brightness(1.02)';
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Use higher quality for OCR intensive tasks
      resolve(canvas.toDataURL('image/jpeg', 0.95).split(',')[1]);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
};

export const generateMathExplanation = async (
  question: string, 
  language: string = 'English', 
  useThinking: boolean = false, 
  useSearch: boolean = false
) => {
  const ai = getGeminiClient();
  const model = useSearch ? MATH_MODELS.SEARCH : (useThinking ? MATH_MODELS.THINKING : 'gemini-3-flash-preview');
  
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.1,
    topP: 0.9,
  };

  if (useSearch) config.tools = [{ googleSearch: {} }];
  if (useThinking) config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };

  const response = await ai.models.generateContent({
    model,
    contents: `Language: ${language}. Greet with "Jay Bheem 💙 Professor Satyam 🎓". Guide me through this: ${question}`,
    config,
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const solveMathFromImage = async (
  base64Data: string, 
  mimeType: string, 
  language: string = 'English', 
  customPrompt?: string,
  useThinking: boolean = false,
  scanMode: ScanMode = 'standard'
) => {
  const ai = getGeminiClient();
  const model = useThinking ? MATH_MODELS.THINKING : MATH_MODELS.TEXT;
  
  // Apply advanced OCR pre-processing
  const enhancedBase64 = await enhanceImage(base64Data, scanMode);
  
  const imagePart = { inlineData: { data: enhancedBase64, mimeType: mimeType } };
  const visualPreprocessingInstruction = `
[MATHEMATICAL SCHOLAR MODE: ADVANCED OCR]
- Greet with: "Jay Bheem 💙 Professor Satyam 🎓".
- You are viewing an image captured in ${scanMode} mode.
- TASK 1: Extract the mathematical formula into LaTeX.
- TASK 2: Use Socratic method to guide the student.
- OCR Focus: Pay extreme attention to subscripts, superscripts, and handwritten Greek symbols.
- Respond in ${language}.`;

  const textPart = { 
    text: customPrompt 
      ? `${visualPreprocessingInstruction}\nStudent Note: "${customPrompt}"` 
      : `${visualPreprocessingInstruction}\nDecipher the handwriting and guide me.` 
  };

  const config: any = { 
    systemInstruction: SYSTEM_INSTRUCTION, 
    temperature: 0.0, // High precision for OCR
    topP: 1.0 
  };
  
  if (useThinking) config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, textPart] },
    config,
  });

  return response.text;
};

export const speakSolution = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getGeminiClient();
  const cleanText = text.replace(/[*#$]/g, '').substring(0, 1000);
  
  const response = await ai.models.generateContent({
    model: MATH_MODELS.TTS,
    contents: [{ parts: [{ text: `Speak this clearly as Professor Satyam: ${cleanText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || '';
};

export const chatWithProfessor = async (history: { role: string, parts: string }[], message: string, language: string = 'English') => {
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + `\nLanguage: ${language}. Greet with "Jay Bheem 💙 Professor Satyam 🎓".`,
      tools: [{ googleSearch: {} }]
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.parts }] })) as any,
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

export const lumenChatBot = async (message: string, history: any[] = []) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: "You are Professor Satyam's AI Assistant. Greet with 'Jay Bheem 💙 Professor Satyam 🎓'.",
    }
  });
  return response.text;
};

export const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const createBlob = (data: Float32Array): GenAIBlob => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
};

export const generateMockTest = async (topic: string, level: string, language: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Jay Bheem. Generate a math mock test on: ${topic} for ${level} in ${language}. 5 questions.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          level: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["id", "question", "options", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["id", "title", "level", "questions"]
      }
    }
  });
  return JSON.parse(response.text.trim());
};
