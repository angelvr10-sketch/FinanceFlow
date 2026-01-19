
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

/** 
 * Utilizamos Gemini 3 Pro con capacidades de razonamiento profundo (Thinking)
 */
const PRIMARY_MODEL = 'gemini-3-pro-preview';
const FALLBACK_MODEL = 'gemini-3-flash-preview';

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
  const exactMatch = allowed.find(cat => cat.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;
  return allowed.find(cat => normalizedInput.includes(cat.toLowerCase()) || cat.toLowerCase().includes(normalizedInput)) || null;
};

async function runWithFallback(
  prompt: string, 
  systemInstruction: string, 
  isJson: boolean = false,
  schema?: any
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
  
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const isPro = modelName.includes('pro');
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: isPro ? 0.7 : 0.2, // Un poco más de creatividad para el Pro
          // Activamos el presupuesto de pensamiento (Thinking Budget) para el modelo Pro
          ...(isPro && { 
            thinkingConfig: { thinkingBudget: 16000 } 
          }),
          ...(isJson && { 
            responseMimeType: "application/json",
            responseSchema: schema 
          })
        }
      });

      if (response.text) return response.text;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      
      if ((errorMsg.includes('429') || errorMsg.includes('quota')) && modelName === PRIMARY_MODEL) {
        await wait(500);
        continue;
      }
      
      if (errorMsg.includes('404')) continue;
      throw error;
    }
  }
  throw lastError;
}

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length < 5) return "Registra al menos 5 movimientos para recibir consejos personalizados.";
  
  const dataSummary = transactions.slice(0, 30).map(t => 
    `${t.date} | ${t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO'}: $${t.amount} | Cat: ${t.category} | Desc: ${t.description}`
  ).join('\n');

  try {
    return await runWithFallback(
      `ANALIZA PROFUNDAMENTE ESTA DATA FINANCIERA:\n${dataSummary}\n\nIdentifica patrones de fuga de capital, anomalías en gastos recurrentes y oportunidades de optimización agresiva.`,
      "Eres un modelo de razonamiento financiero avanzado (estilo R1/DeepSeek). Tu objetivo es realizar un análisis deductivo impecable. No des consejos genéricos. Sé crítico, directo y detecta correlaciones entre fechas, categorías y montos. Responde en español con un tono profesional y analítico, usando 3-4 puntos clave altamente específicos."
    );
  } catch (error: any) {
    console.error("Advice Error:", error);
    return "⚠️ El motor de razonamiento está analizando otros flujos. Reintenta en breve.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const isIncome = type === TransactionType.INCOME;
  const localAttempt = localFallback(description, isIncome);
  
  if (localAttempt.confidence === 1) return localAttempt;

  try {
    const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const responseText = await runWithFallback(
      `Clasifica con precisión lógica: "${description}"`,
      `Responde exclusivamente en JSON con: category (debe ser una de [${allowedCategories.join(", ")}]), subCategory y confidence (0-1).`,
      true,
      {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          subCategory: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ["category", "subCategory", "confidence"],
      }
    );

    const result = JSON.parse(responseText);
    const matched = findBestCategoryMatch(result.category, allowedCategories);
    
    if (matched) {
      return {
        category: matched,
        subCategory: result.subCategory || "General",
        icon: ICON_MAP[matched] || "other",
        confidence: result.confidence || 0.8,
      };
    }
  } catch (e) {
    console.warn("Usando motor local.");
  }

  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;

  if (!isIncome) {
    if (desc.includes("moto") || desc.includes("refaccion") || desc.includes("repuesto") || desc.includes("mecanico") || desc.includes("taller")) {
      category = "Vehículos y Mantenimiento";
      confidence = 1;
    } else if (desc.includes("croqueta") || desc.includes("perro") || desc.includes("gato") || desc.includes("veterinario")) {
      category = "Mascotas";
      confidence = 1;
    }
  } else {
    if (desc.includes("sueldo") || desc.includes("nomina") || desc.includes("pago")) {
      category = "Sueldo y Salario";
      confidence = 1;
    }
  }

  return {
    category,
    subCategory: confidence === 1 ? "Motor Local" : "Sugerido",
    icon: ICON_MAP[category] || "other",
    confidence
  };
}
