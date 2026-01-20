
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

// Definición de modelos para diferentes tareas
const DEEP_ANALYSIS_MODEL = 'gemini-3-pro-preview';
const FAST_TASK_MODEL = 'gemini-3-flash-preview';

const getApiKey = () => {
  try {
    return (process.env.API_KEY || '').trim();
  } catch (e) {
    return '';
  }
};

export const EXPENSE_CATEGORIES = [
  "Comida y Bebida", 
  "Transporte", 
  "Vivienda y Hogar", 
  "Mascotas",
  "Regalos y Donaciones",
  "Vehículos y Mantenimiento",
  "Ocio y Entretenimiento", 
  "Salud y Bienestar", 
  "Educación", 
  "Compras y Ropa", 
  "Servicios y Suscripciones", 
  "Viajes",
  "Bebé y Maternidad",
  "Gastos Financieros",
  "Otros Gastos"
];

export const INCOME_CATEGORIES = [
  "Sueldo y Salario", 
  "Ventas y Negocios", 
  "Honorarios Profesionales", 
  "Inversiones y Dividendos", 
  "Regalos y Premios", 
  "Otros Ingresos"
];

export const ICON_MAP: Record<string, string> = {
  "Comida y Bebida": "food",
  "Transporte": "transport",
  "Vivienda y Hogar": "home",
  "Mascotas": "pets",
  "Regalos y Donaciones": "gifts",
  "Vehículos y Mantenimiento": "maintenance",
  "Ocio y Entretenimiento": "leisure",
  "Salud y Bienestar": "health",
  "Educación": "education",
  "Compras y Ropa": "shopping",
  "Servicios y Suscripciones": "other",
  "Viajes": "transport",
  "Bebé y Maternidad": "health",
  "Gastos Financieros": "investment",
  "Sueldo y Salario": "salary",
  "Ventas y Negocios": "business",
  "Honorarios Profesionales": "professional",
  "Inversiones y Dividendos": "investment",
  "Regalos y Premios": "gifts",
  "Otros Ingresos": "other",
  "Otros Gastos": "other"
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const findBestCategoryMatch = (input: string, allowed: string[]): string | null => {
  if (!input) return null;
  const normalizedInput = input.toLowerCase().trim();
  // Búsqueda exacta
  const exactMatch = allowed.find(cat => cat.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;
  // Búsqueda por inclusión
  return allowed.find(cat => 
    normalizedInput.includes(cat.toLowerCase()) || 
    cat.toLowerCase().includes(normalizedInput)
  ) || null;
};

async function runAiRequest(
  modelName: string,
  prompt: string, 
  systemInstruction: string, 
  config: { isJson?: boolean, schema?: any, useThinking?: boolean, imageData?: { data: string, mimeType: string } } = {}
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  const contents: any = config.imageData 
    ? { parts: [{ inlineData: config.imageData }, { text: prompt }] }
    : prompt;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction,
      temperature: config.useThinking ? 0.7 : 0.1, // Temperatura baja para tareas técnicas (categorización)
      ...(config.useThinking && modelName.includes('pro') && { 
        thinkingConfig: { thinkingBudget: 12000 } 
      }),
      ...(config.isJson && { 
        responseMimeType: "application/json",
        responseSchema: config.schema 
      })
    }
  });

  if (!response.text) throw new Error("EMPTY_RESPONSE");
  return response.text;
}

export const analyzeReceipt = async (base64Data: string, mimeType: string): Promise<any> => {
  try {
    const responseText = await runAiRequest(
      FAST_TASK_MODEL,
      "Extrae la información de este ticket.",
      `Eres un asistente contable. Analiza la imagen y extrae: amount (número), merchant (nombre corto), date (YYYY-MM-DD), y category (una de: ${EXPENSE_CATEGORIES.join(", ")}).`,
      { 
        isJson: true, 
        schema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            merchant: { type: Type.STRING },
            date: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["amount", "merchant", "category"]
        },
        imageData: { data: base64Data, mimeType }
      }
    );

    const result = JSON.parse(responseText);
    const matchedCategory = findBestCategoryMatch(result.category, EXPENSE_CATEGORIES) || "Otros Gastos";
    
    return {
      amount: result.amount || 0,
      description: result.merchant || "Compra detectada",
      date: result.date || new Date().toISOString().split('T')[0],
      category: matchedCategory,
      icon: ICON_MAP[matchedCategory] || "shopping"
    };
  } catch (error) {
    console.error("Error analizando ticket:", error);
    throw error;
  }
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length < 5) return "Registra al menos 5 movimientos para que mi motor de razonamiento pueda detectar patrones.";
  
  const dataSummary = transactions.slice(0, 40).map(t => 
    `${t.date} | ${t.type}: $${t.amount} | ${t.category} | ${t.description}`
  ).join('\n');

  try {
    // Intentamos con Pro + Thinking para máxima calidad
    return await runAiRequest(
      DEEP_ANALYSIS_MODEL,
      `Analiza estos datos:\n${dataSummary}`,
      "Eres un consultor financiero de élite. Usa tu capacidad de razonamiento profundo para identificar: 1. Gastos hormiga ocultos. 2. Correlaciones temporales (ej: gastas más los martes). 3. Consejos de ahorro agresivos. Responde en español de forma directa y profesional.",
      { useThinking: true }
    );
  } catch (error) {
    // Fallback a Flash si Pro falla
    console.warn("Pro saturado, usando Flash para consejos.");
    return await runAiRequest(
      FAST_TASK_MODEL,
      `Analiza estos datos:\n${dataSummary}`,
      "Eres un asistente financiero. Da 3 consejos rápidos de ahorro basados en los datos proporcionados. Sé breve y conciso."
    );
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const isIncome = type === TransactionType.INCOME;
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  try {
    const responseText = await runAiRequest(
      FAST_TASK_MODEL,
      `Clasifica: "${description}"`,
      `Responde exclusivamente con un objeto JSON. La categoría DEBE ser exactamente una de estas: [${categories.join(", ")}].`,
      {
        isJson: true,
        schema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["category", "confidence"]
        }
      }
    );

    const result = JSON.parse(responseText);
    const matched = findBestCategoryMatch(result.category, categories);
    
    if (matched) {
      return {
        category: matched,
        subCategory: result.subCategory || "",
        icon: ICON_MAP[matched] || "other",
        confidence: result.confidence || 0.9,
      };
    }
  } catch (e) {
    console.error("Error en categorización IA:", e);
  }

  // Si todo falla, motor local ultra-básico mejorado
  return localFallback(description, isIncome);
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.3;

  const rules = [
    { keys: ["uber", "taxi", "gasolina", "bus", "metro", "moto"], cat: "Transporte" },
    { keys: ["comida", "restaurante", "oxxo", "super", "walmart", "cena", "almuerzo"], cat: "Comida y Bebida" },
    { keys: ["nomina", "sueldo", "pago", "salario"], cat: "Sueldo y Salario" },
    { keys: ["renta", "luz", "agua", "internet", "netflix"], cat: "Vivienda y Hogar" }
  ];

  for (const rule of rules) {
    if (rule.keys.some(k => desc.includes(k))) {
      category = findBestCategoryMatch(rule.cat, isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES) || category;
      confidence = 0.8;
      break;
    }
  }

  return {
    category,
    subCategory: "Local",
    icon: ICON_MAP[category] || "other",
    confidence
  };
}
