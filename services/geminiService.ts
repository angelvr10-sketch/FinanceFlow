
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

const PRIMARY_MODEL = 'gemini-3-pro-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';

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
  schema?: any,
  imageData?: { data: string, mimeType: string }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  // Para visión preferimos Flash por su velocidad, para razonamiento preferimos Pro.
  const modelName = imageData ? FLASH_MODEL : PRIMARY_MODEL;
  
  try {
    const isPro = modelName.includes('pro');
    const contents: any = imageData 
      ? { parts: [{ inlineData: imageData }, { text: prompt }] }
      : prompt;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction,
        temperature: isPro ? 0.7 : 0.2,
        ...(isPro && !imageData && { thinkingConfig: { thinkingBudget: 16000 } }),
        ...(isJson && { 
          responseMimeType: "application/json",
          responseSchema: schema 
        })
      }
    });

    return response.text || "";
  } catch (error: any) {
    console.error("AI Error:", error);
    throw error;
  }
}

/**
 * Analiza una imagen de un ticket para extraer datos financieros
 */
export const analyzeReceipt = async (base64Data: string, mimeType: string): Promise<any> => {
  try {
    const responseText = await runWithFallback(
      "Analiza este ticket y extrae la información solicitada en formato JSON.",
      "Eres un experto en contabilidad. Extrae del ticket: 1. amount (el total final como número), 2. merchant (nombre del establecimiento), 3. date (fecha en formato YYYY-MM-DD, si no hay usa hoy), 4. category (una de las permitidas).",
      true,
      {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          merchant: { type: Type.STRING },
          date: { type: Type.STRING },
          category: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ["amount", "merchant", "category"]
      },
      { data: base64Data, mimeType }
    );

    const result = JSON.parse(responseText);
    const matchedCategory = findBestCategoryMatch(result.category, EXPENSE_CATEGORIES) || "Otros Gastos";
    
    return {
      amount: result.amount || 0,
      description: result.merchant || "Compra",
      date: result.date || new Date().toISOString().split('T')[0],
      category: matchedCategory,
      icon: ICON_MAP[matchedCategory] || "shopping"
    };
  } catch (error) {
    console.error("Receipt analysis failed:", error);
    throw error;
  }
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length < 5) return "Registra al menos 5 movimientos para recibir consejos personalizados.";
  const dataSummary = transactions.slice(0, 30).map(t => 
    `${t.date} | ${t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO'}: $${t.amount} | Cat: ${t.category} | Desc: ${t.description}`
  ).join('\n');

  try {
    return await runWithFallback(
      `ANALIZA PROFUNDAMENTE ESTA DATA FINANCIERA:\n${dataSummary}\n\nIdentifica patrones de fuga de capital y oportunidades de optimización.`,
      "Eres un modelo de razonamiento financiero avanzado. Sé crítico, directo y detecta correlaciones entre categorías y montos. Responde en español con 3-4 puntos clave."
    );
  } catch (error: any) {
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
      `Clasifica: "${description}"`,
      `Responde en JSON con: category (una de [${allowedCategories.join(", ")}]), subCategory y confidence (0-1).`,
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
  } catch (e) {}
  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;
  if (!isIncome) {
    if (desc.includes("moto") || desc.includes("taller")) { category = "Vehículos y Mantenimiento"; confidence = 1; }
    else if (desc.includes("perro") || desc.includes("gato")) { category = "Mascotas"; confidence = 1; }
  } else {
    if (desc.includes("sueldo") || desc.includes("nomina")) { category = "Sueldo y Salario"; confidence = 1; }
  }
  return { category, subCategory: confidence === 1 ? "Motor Local" : "Sugerido", icon: ICON_MAP[category] || "other", confidence };
}
