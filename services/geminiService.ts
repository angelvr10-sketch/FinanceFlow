
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

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
  "Sueldo y Salario": "salary",
  "Ventas y Negocios": "business",
  "Honorarios Profesionales": "professional",
  "Inversiones y Dividendos": "investment",
  "Regalos y Premios": "other",
  "Otros Ingresos": "other",
  "Otros Gastos": "other"
};

const findBestCategoryMatch = (input: string, allowed: string[]): string | null => {
  const normalizedInput = input.toLowerCase().trim();
  const exactMatch = allowed.find(cat => cat.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;

  const partialMatch = allowed.find(cat => 
    normalizedInput.includes(cat.toLowerCase()) || 
    cat.toLowerCase().includes(normalizedInput)
  );
  return partialMatch || null;
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Aún no tienes transacciones para analizar.";

  const dataSummary = transactions.slice(0, 25).map(t => ({
    t: t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO',
    c: t.category,
    a: t.amount,
    d: t.description
  }));

  const prompt = `Actúa como un asesor financiero personal de alto nivel. 
  Analiza este historial reciente y dame 3 consejos estratégicos personalizados.
  Historial: ${JSON.stringify(dataSummary)}
  
  FORMATO DE RESPUESTA:
  • Punto 1: Análisis de tendencia.
  • Punto 2: Oportunidad de ahorro o inversión.
  • Punto 3: Acción inmediata recomendada.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asesor financiero experto. Hablas español neutro y profesional.",
        temperature: 0.4,
      }
    });
    
    return response.text || "Sigue registrando para obtener mejores consejos.";
  } catch (error) {
    console.error("Advice error:", error);
    return "No pude conectar con el asesor en este momento.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const isIncome = type === TransactionType.INCOME;
  const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const typeLabel = isIncome ? "INGRESO" : "GASTO";

  const prompt = `Clasifica esta operación: "${description}"
  Tipo: ${typeLabel}
  Lista obligatoria de categorías: [${allowedCategories.join(", ")}]
  
  Reglas:
  - Responde UNICAMENTE en formato JSON.
  - Selecciona la categoría que mejor encaje de la lista proporcionada.
  - Crea una subcategoría muy breve.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `Eres un experto en contabilidad. Clasificas gastos e ingresos basándote estrictamente en las categorías permitidas.`,
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

    // Fix TS18048: Check if text exists before using it
    const rawText = response.text;
    if (!rawText) throw new Error("No response text from AI");

    let cleanText = rawText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
    }

    const result = JSON.parse(cleanText);
    const matchedCategory = findBestCategoryMatch(result.category || "", allowedCategories);
    const finalCategory = matchedCategory || (isIncome ? "Otros Ingresos" : "Otros Gastos");

    return {
      category: finalCategory,
      subCategory: result.subCategory || "General",
      icon: ICON_MAP[finalCategory] || "other",
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("IA Categorization Error:", error);
    const desc = description.toLowerCase();
    let fallbackCat = isIncome ? "Otros Ingresos" : "Otros Gastos";
    
    if (!isIncome) {
      if (desc.includes("comida") || desc.includes("rest") || desc.includes("uber eat")) fallbackCat = "Comida y Bebida";
      if (desc.includes("uber") || desc.includes("taxi") || desc.includes("gasol")) fallbackCat = "Transporte";
    }

    return { 
      category: fallbackCat, 
      subCategory: "Detección Automática",
      icon: ICON_MAP[fallbackCat] || "other", 
      confidence: 0 
    };
  }
};
