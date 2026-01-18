
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
  if (!apiKey) return "⚠️ AI Desactivada: Configura tu API_KEY en el panel de Netlify/Vercel para recibir consejos.";
  if (transactions.length === 0) return "Aún no tienes transacciones para analizar.";

  const ai = new GoogleGenAI({ apiKey });
  const dataSummary = transactions.slice(0, 25).map(t => ({
    t: t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO',
    c: t.category,
    a: t.amount,
    d: t.description
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza este historial y dame 3 consejos financieros breves: ${JSON.stringify(dataSummary)}`,
      config: {
        systemInstruction: "Eres un asesor financiero experto. Responde en español.",
        temperature: 0.5,
      }
    });
    return response.text ?? "Continúa registrando para obtener análisis.";
  } catch (error) {
    return "Error al conectar con el asesor IA.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const apiKey = getApiKey();
  const isIncome = type === TransactionType.INCOME;
  
  // PRIMERO: Intentar coincidencia local de alta prioridad (Hogar, Bebé, Préstamo)
  const localAttempt = localFallback(description, isIncome);
  if (localAttempt.confidence === 1) return localAttempt;

  // SEGUNDO: Si hay API_KEY, usar Gemini
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Clasifica: "${description}" (Tipo: ${isIncome ? 'INGRESO' : 'GASTO'}). Categorías: [${allowedCategories.join(", ")}]. Responde JSON con: category, subCategory, confidence.`,
        config: {
          systemInstruction: "Eres un experto contable. Prioriza categorías específicas como 'Bebé', 'Vivienda' o 'Financieros' antes que 'Otros'.",
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
      console.warn("IA falló, usando fallback local...");
    }
  }

  // TERCERO: Fallback final
  return localAttempt;
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase().trim();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let confidence = 0.1;

  if (!isIncome) {
    // Coincidencias de alta precisión (Confidence 1)
    if (desc.includes("hogar") || desc.includes("casa") || desc.includes("renta")) {
      category = "Vivienda y Hogar";
      confidence = 1;
    } else if (desc.includes("bebe") || desc.includes("leche") || desc.includes("pañal") || desc.includes("maternidad")) {
      category = "Bebé y Maternidad";
      confidence = 1;
    } else if (desc.includes("prestamo") || desc.includes("banco") || desc.includes("credito") || desc.includes("financiero")) {
      category = "Gastos Financieros";
      confidence = 1;
    } else if (desc.includes("gasol") || desc.includes("trans") || desc.includes("uber") || desc.includes("taxi")) {
      category = "Transporte";
      confidence = 0.9;
    } else if (desc.includes("comida") || desc.includes("rest") || desc.includes("cena") || desc.includes("cafe")) {
      category = "Comida y Bebida";
      confidence = 0.9;
    }
  } else {
    if (desc.includes("nomina") || desc.includes("sueldo") || desc.includes("pago")) {
      category = "Sueldo y Salario";
      confidence = 1;
    } else if (desc.includes("venta") || desc.includes("tinta") || desc.includes("pago cliente")) {
      category = "Ventas y Negocios";
      confidence = 1;
    }
  }

  return {
    category,
    subCategory: confidence === 1 ? "Clasificación Directa" : "Detección Inteligente",
    icon: ICON_MAP[category] || "other",
    confidence
  };
}
