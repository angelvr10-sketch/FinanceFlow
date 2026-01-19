
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

/** 
 * Nombres técnicos exactos para la serie 2.5 
 * Usamos las versiones con fecha para máxima estabilidad
 */
const PRIMARY_MODEL = 'gemini-2.5-flash-lite-preview-02-2025';
const FALLBACK_MODEL = 'gemini-2.5-flash-preview-01-2025';

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
  if (!apiKey) throw new Error("Falta la API_KEY en el entorno.");

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
          temperature: 0.1, // Mínima creatividad para máxima velocidad
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
        await wait(200);
        continue;
      }
      
      if (errorMsg.includes('404') && modelName === PRIMARY_MODEL) {
        continue;
      }

      throw error;
    }
  }
  throw lastError;
}

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Registra movimientos para recibir consejos.";
  
  const dataSummary = transactions.slice(0, 15).map(t => 
    `${t.type === TransactionType.INCOME ? '+' : '-'}${t.amount} (${t.category}: ${t.description})`
  ).join(' | ');

  try {
    return await runWithFallback(
      `Analiza estos movimientos y da 3 consejos cortos: ${dataSummary}`,
      "Eres un consultor financiero experto que usa Gemini 2.5. Responde con 3 viñetas breves y directas."
    );
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("429")) return "⚠️ Cuota excedida. Reintentando con Gemini 2.5...";
    if (msg.includes("404")) return "⚠️ Error: Modelo Gemini 2.5 no encontrado. Verifica configuración.";
    return `⚠️ Error de IA: El asesor financiero está teniendo problemas técnicos.`;
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
    console.warn("Error en categorización nube, usando local.");
  }

  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;

  if (!isIncome) {
    // REGLAS LOCALES ACTUALIZADAS
    if (desc.includes("moto") || desc.includes("refaccion") || desc.includes("repuesto") || desc.includes("mecanico") || desc.includes("taller") || desc.includes("aceite") || desc.includes("llanta") || desc.includes("bujia") || desc.includes("freno") || desc.includes("balata")) {
      category = "Vehículos y Mantenimiento";
      confidence = 1;
    } else if (desc.includes("croqueta") || desc.includes("perro") || desc.includes("gato") || desc.includes("mascota") || desc.includes("veterinario")) {
      category = "Mascotas";
      confidence = 1;
    } else if (desc.includes("regalo") || desc.includes("presente") || desc.includes("cumple") || desc.includes("donacion") || desc.includes("boda") || desc.includes("familiar")) {
      category = "Regalos y Donaciones";
      confidence = 1;
    } else if (desc.includes("medica") || desc.includes("doctor") || desc.includes("farmacia") || desc.includes("salud")) {
      category = "Salud y Bienestar";
      confidence = 1;
    } else if (desc.includes("luz") || desc.includes("agua") || desc.includes("gas") || desc.includes("renta") || desc.includes("casa")) {
      category = "Vivienda y Hogar";
      confidence = 1;
    } else if (desc.includes("uber") || desc.includes("taxi") || desc.includes("bus") || desc.includes("gasol")) {
      category = "Transporte";
      confidence = 0.9;
    } else if (desc.includes("comida") || desc.includes("rest") || desc.includes("cafe")) {
      category = "Comida y Bebida";
      confidence = 0.9;
    }
  } else {
    if (desc.includes("regalo") || desc.includes("premio") || desc.includes("donativo")) {
      category = "Regalos y Premios";
      confidence = 1;
    } else if (desc.includes("nomina") || desc.includes("sueldo") || desc.includes("salario")) {
      category = "Sueldo y Salario";
      confidence = 1;
    }
  }

  return {
    category,
    subCategory: confidence === 1 ? "Motor Local (Instantáneo)" : "Detección Sugerida",
    icon: ICON_MAP[category] || "other",
    confidence
  };
}
