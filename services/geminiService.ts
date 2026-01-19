
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

/** 
 * Utilizamos la serie Gemini 3 para máxima estabilidad y potencia
 */
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-3-pro-preview';

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
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
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
      
      // Retry logic for quota
      if ((errorMsg.includes('429') || errorMsg.includes('quota')) && modelName === PRIMARY_MODEL) {
        await wait(300);
        continue;
      }
      
      // If model not found, try the next one
      if (errorMsg.includes('404')) {
        continue;
      }

      throw error;
    }
  }
  throw lastError;
}

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length < 5) return "Registra al menos 5 movimientos para recibir consejos personalizados.";
  
  const dataSummary = transactions.slice(0, 15).map(t => 
    `${t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO'}: ${t.amount} (${t.category} - ${t.description})`
  ).join('\n');

  try {
    return await runWithFallback(
      `Analiza estos movimientos y proporciona 3 consejos financieros accionables y breves:\n${dataSummary}`,
      "Eres un consultor financiero experto de élite. Responde en español con 3 puntos clave muy directos."
    );
  } catch (error: any) {
    console.error("Advice Error:", error);
    return "⚠️ El asistente está sincronizando datos. Por favor, intenta de nuevo en un minuto.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const isIncome = type === TransactionType.INCOME;
  const localAttempt = localFallback(description, isIncome);
  
  if (localAttempt.confidence === 1) return localAttempt;

  try {
    const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const responseText = await runWithFallback(
      `Clasifica: "${description}"`,
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
    console.warn("Nube lenta, usando motor local.");
  }

  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;

  if (!isIncome) {
    if (desc.includes("moto") || desc.includes("refaccion") || desc.includes("repuesto") || desc.includes("mecanico") || desc.includes("taller") || desc.includes("aceite") || desc.includes("bujia") || desc.includes("llanta")) {
      category = "Vehículos y Mantenimiento";
      confidence = 1;
    } else if (desc.includes("croqueta") || desc.includes("perro") || desc.includes("gato") || desc.includes("mascota") || desc.includes("veterinario")) {
      category = "Mascotas";
      confidence = 1;
    } else if (desc.includes("regalo") || desc.includes("presente") || desc.includes("familiar") || desc.includes("cumple")) {
      category = "Regalos y Donaciones";
      confidence = 1;
    } else if (desc.includes("renta") || desc.includes("luz") || desc.includes("agua") || desc.includes("hogar")) {
      category = "Vivienda y Hogar";
      confidence = 1;
    } else if (desc.includes("uber") || desc.includes("taxi") || desc.includes("gasol")) {
      category = "Transporte";
      confidence = 0.9;
    } else if (desc.includes("comida") || desc.includes("rest") || desc.includes("cafe")) {
      category = "Comida y Bebida";
      confidence = 0.9;
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
