
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const EXPENSE_CATEGORIES = [
  "Comida y Bebida", 
  "Transporte", 
  "Vivienda y Hogar", 
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

const INCOME_CATEGORIES = [
  "Sueldo y Salario", 
  "Ventas y Negocios", 
  "Honorarios Profesionales", 
  "Inversiones y Dividendos", 
  "Regalos y Premios", 
  "Otros Ingresos"
];

const ICON_MAP: Record<string, string> = {
  "Comida y Bebida": "food",
  "Transporte": "transport",
  "Vivienda y Hogar": "home",
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
  "Regalos y Premios": "other",
  "Otros Ingresos": "other",
  "Otros Gastos": "other"
};

const findBestCategoryMatch = (input: string, allowed: string[]): string | null => {
  if (!input) return null;
  const normalizedInput = input.toLowerCase().trim();
  const exactMatch = allowed.find(cat => cat.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;
  return allowed.find(cat => normalizedInput.includes(cat.toLowerCase()) || cat.toLowerCase().includes(normalizedInput)) || null;
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "⚠️ AI Desactivada: Configura tu API_KEY para recibir consejos.";
  if (transactions.length === 0) return "Aún no tienes transacciones para analizar.";

  const ai = new GoogleGenAI({ apiKey });
  const dataSummary = transactions.slice(0, 15).map(t => ({
    t: t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO',
    c: t.category,
    a: t.amount,
    d: t.description
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza brevemente (3 puntos) este historial financiero y dame consejos útiles en español: ${JSON.stringify(dataSummary)}`,
      config: {
        systemInstruction: "Eres un asesor financiero experto y conciso.",
        temperature: 0.7,
      }
    });
    return response.text || "No se pudo generar el análisis. Inténtalo más tarde.";
  } catch (error) {
    console.error("Advice Error:", error);
    return "Error temporal de conexión con el asesor financiero.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const apiKey = getApiKey();
  const isIncome = type === TransactionType.INCOME;
  
  // Reglas Locales de Alta Prioridad
  const localAttempt = localFallback(description, isIncome);
  if (localAttempt.confidence === 1) return localAttempt;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Clasifica esta descripción: "${description}". Categorías permitidas: [${allowedCategories.join(", ")}]. Responde solo JSON.`,
        config: {
          systemInstruction: "Eres un contador experto. Prioriza categorías específicas como 'Bebé', 'Vivienda' o 'Financieros'.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
            },
            required: ["category", "subCategory", "confidence"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
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
      console.warn("AI Fallback a Local");
    }
  }

  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;

  if (!isIncome) {
    if (desc.includes("hogar") || desc.includes("casa") || desc.includes("renta") || desc.includes("mantenimiento")) {
      category = "Vivienda y Hogar";
      confidence = 1;
    } else if (desc.includes("bebe") || desc.includes("leche") || desc.includes("pañal") || desc.includes("baby")) {
      category = "Bebé y Maternidad";
      confidence = 1;
    } else if (desc.includes("prestamo") || desc.includes("banco") || desc.includes("credito") || desc.includes("interes")) {
      category = "Gastos Financieros";
      confidence = 1;
    } else if (desc.includes("comida") || desc.includes("cena") || desc.includes("cafe") || desc.includes("taco")) {
      category = "Comida y Bebida";
      confidence = 0.9;
    } else if (desc.includes("gasol") || desc.includes("uber") || desc.includes("taxi") || desc.includes("bus")) {
      category = "Transporte";
      confidence = 0.9;
    }
  } else {
    if (desc.includes("nomina") || desc.includes("sueldo")) {
      category = "Sueldo y Salario";
      confidence = 1;
    } else if (desc.includes("venta") || desc.includes("tinta")) {
      category = "Ventas y Negocios";
      confidence = 1;
    }
  }

  return {
    category,
    subCategory: confidence === 1 ? "Detección Directa" : "Detección Inteligente",
    icon: ICON_MAP[category] || "other",
    confidence
  };
}
