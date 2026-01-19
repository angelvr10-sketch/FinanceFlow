
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

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
  if (!apiKey) return "⚠️ Configuración: Falta la API_KEY en las variables de entorno.";
  if (transactions.length === 0) return "Registra algunos movimientos para recibir consejos.";

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
      contents: `Analiza este historial y da 3 consejos breves en español: ${JSON.stringify(dataSummary)}`,
      config: {
        systemInstruction: "Eres un asesor financiero experto. Responde con lenguaje natural y motivador.",
        temperature: 0.7,
      }
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    return "⚠️ Error de conexión con el asesor financiero.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const apiKey = getApiKey();
  const isIncome = type === TransactionType.INCOME;
  
  const localAttempt = localFallback(description, isIncome);
  if (localAttempt.confidence === 1) return localAttempt;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Clasifica: "${description}" (Tipo: ${isIncome ? 'INGRESO' : 'GASTO'}). Categorías permitidas: [${allowedCategories.join(", ")}]. Responde JSON.`,
        config: {
          systemInstruction: "Responde estrictamente en JSON con category (string), subCategory (string), confidence (number).",
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
      console.warn("IA falló, usando local.");
    }
  }

  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;

  if (!isIncome) {
    if (desc.includes("paracetamol") || desc.includes("medica") || desc.includes("doctor") || desc.includes("farmacia") || desc.includes("pastilla") || desc.includes("salud")) {
      category = "Salud y Bienestar";
      confidence = 1;
    } else if (desc.includes("hogar") || desc.includes("casa") || desc.includes("renta") || desc.includes("luz") || desc.includes("agua")) {
      category = "Vivienda y Hogar";
      confidence = 1;
    } else if (desc.includes("bebe") || desc.includes("pañal") || desc.includes("baby")) {
      category = "Bebé y Maternidad";
      confidence = 1;
    } else if (desc.includes("prestamo") || desc.includes("banco") || desc.includes("credito")) {
      category = "Gastos Financieros";
      confidence = 1;
    } else if (desc.includes("comida") || desc.includes("rest") || desc.includes("cafe")) {
      category = "Comida y Bebida";
      confidence = 0.9;
    } else if (desc.includes("uber") || desc.includes("taxi") || desc.includes("bus")) {
      category = "Transporte";
      confidence = 0.9;
    }
  } else {
    if (desc.includes("nomina") || desc.includes("sueldo")) {
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
