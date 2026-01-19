
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

// Priorizamos la serie 2.5 por su alta disponibilidad y baja latencia
const PRIMARY_MODEL = 'gemini-2.5-flash-lite-latest';
const FALLBACK_MODEL = 'gemini-2.5-flash-preview';

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
  if (!apiKey) throw new Error("NO_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  // Usamos siempre la serie 2.5 para evitar saturación
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
  
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2, // Temperatura baja para respuestas ultra-rápidas y precisas
          ...(isJson && { 
            responseMimeType: "application/json",
            responseSchema: schema 
          })
        }
      });

      if (response.text) return response.text;
    } catch (error: any) {
      lastError = error;
      const isSaturated = error?.message?.includes('429') || error?.message?.includes('quota');
      if (isSaturated && modelName === PRIMARY_MODEL) {
        await wait(200);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Registra movimientos para recibir consejos.";
  const dataSummary = transactions.slice(0, 20).map(t => ({
    t: t.type === TransactionType.INCOME ? 'I' : 'G',
    c: t.category,
    a: t.amount,
    d: t.description
  }));

  try {
    return await runWithFallback(
      `Analiza y da 3 tips: ${JSON.stringify(dataSummary)}`,
      "Eres un asesor financiero que usa Gemini 2.5. Responde de forma brillante y breve en español."
    );
  } catch (error: any) {
    return "⚠️ El asesor está descansando. Intenta de nuevo en un momento.";
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
      `Responde JSON con category (de [${allowedCategories.join(", ")}]), subCategory y confidence (0-1).`,
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
    console.warn("Usando motor local por seguridad.");
  }

  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;

  if (!isIncome) {
    // REGLAS LOCALES ACTUALIZADAS Y ROBUSTAS
    if (desc.includes("croqueta") || desc.includes("perro") || desc.includes("gato") || desc.includes("mascota") || desc.includes("veterinario") || desc.includes("purina") || desc.includes("whiskas") || desc.includes("arena para") || desc.includes("dog") || desc.includes("cat")) {
      category = "Mascotas";
      confidence = 1;
    } else if (desc.includes("regalo") || desc.includes("presente") || desc.includes("cumple") || desc.includes("donacion") || desc.includes("boda") || desc.includes("aniversario") || desc.includes("gift")) {
      category = "Regalos y Donaciones";
      confidence = 1;
    } else if (desc.includes("paracetamol") || desc.includes("medica") || desc.includes("doctor") || desc.includes("farmacia") || desc.includes("pastilla") || desc.includes("salud") || desc.includes("clinica")) {
      category = "Salud y Bienestar";
      confidence = 1;
    } else if (desc.includes("hogar") || desc.includes("casa") || desc.includes("renta") || desc.includes("luz") || desc.includes("agua") || desc.includes("alquiler")) {
      category = "Vivienda y Hogar";
      confidence = 1;
    } else if (desc.includes("comida") || desc.includes("rest") || desc.includes("cafe") || desc.includes("taco") || desc.includes("cena") || desc.includes("almuerzo")) {
      category = "Comida y Bebida";
      confidence = 0.9;
    } else if (desc.includes("uber") || desc.includes("taxi") || desc.includes("bus") || desc.includes("gasol") || desc.includes("nafta")) {
      category = "Transporte";
      confidence = 0.9;
    }
  } else {
    if (desc.includes("regalo") || desc.includes("premio") || desc.includes("donativo") || desc.includes("suerte")) {
      category = "Regalos y Premios";
      confidence = 1;
    } else if (desc.includes("nomina") || desc.includes("sueldo") || desc.includes("salario") || desc.includes("pago empresa")) {
      category = "Sueldo y Salario";
      confidence = 1;
    }
  }

  return {
    category,
    subCategory: confidence === 1 ? "Detección Instantánea" : "Detección Sugerida",
    icon: ICON_MAP[category] || "other",
    confidence
  };
}
