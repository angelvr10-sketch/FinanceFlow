
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

const getApiKey = () => {
  // En Netlify/Vercel, process.env.API_KEY debe estar configurado en el panel de control
  const key = process.env.API_KEY || '';
  if (!key) {
    console.warn("⚠️ FinanceFlow: API_KEY no configurada. La categorización por IA no funcionará.");
  }
  return key;
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
  if (!input) return null;
  const normalizedInput = input.toLowerCase().trim();
  
  // Intento 1: Coincidencia exacta
  const exactMatch = allowed.find(cat => cat.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;

  // Intento 2: Coincidencia parcial (la entrada contiene la categoría o viceversa)
  const partialMatch = allowed.find(cat => 
    normalizedInput.includes(cat.toLowerCase()) || 
    cat.toLowerCase().includes(normalizedInput)
  );
  return partialMatch || null;
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Configura tu API_KEY para recibir consejos financieros.";
  if (transactions.length === 0) return "Aún no tienes transacciones para analizar.";

  const ai = new GoogleGenAI({ apiKey });
  const dataSummary = transactions.slice(0, 25).map(t => ({
    t: t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO',
    c: t.category,
    a: t.amount,
    d: t.description
  }));

  const prompt = `Analiza este historial financiero y dame 3 consejos estratégicos breves: ${JSON.stringify(dataSummary)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asesor financiero experto. Responde en español neutro con puntos claros.",
        temperature: 0.5,
      }
    });
    
    // Solución TS18048: Aseguramos que tratamos el texto como string o vacío
    return response.text ?? "Continúa registrando para obtener un análisis detallado.";
  } catch (error) {
    console.error("Advice error:", error);
    return "No se pudo conectar con el asesor. Verifica tu conexión y configuración de API.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const apiKey = getApiKey();
  const isIncome = type === TransactionType.INCOME;
  const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const fallbackCat = isIncome ? "Otros Ingresos" : "Otros Gastos";

  // Si no hay API Key, usamos lógica de respaldo inmediata
  if (!apiKey) {
    return localFallback(description, isIncome);
  }

  const ai = new GoogleGenAI({ apiKey });
  const typeLabel = isIncome ? "INGRESO" : "GASTO";

  const prompt = `Clasifica: "${description}" (Tipo: ${typeLabel}). 
  Debes elegir una de estas: [${allowedCategories.join(", ")}]. 
  Responde solo JSON con: category, subCategory, confidence.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `Eres un clasificador contable ultra-preciso. Tu misión es evitar a toda costa la categoría "Otros" si existe una más específica disponible.`,
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

    // Solución definitiva TS18048 para Netlify
    const rawText: string = response.text || "";
    if (!rawText) throw new Error("Respuesta vacía");

    const result = JSON.parse(rawText);
    const matchedCategory = findBestCategoryMatch(result.category, allowedCategories);
    const finalCategory = matchedCategory || fallbackCat;

    return {
      category: finalCategory,
      subCategory: result.subCategory || "General",
      icon: ICON_MAP[finalCategory] || "other",
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return localFallback(description, isIncome);
  }
};

// Lógica de respaldo local mejorada cuando falla la IA o no hay Key
function localFallback(description: string, isIncome: boolean): CategorizationResult {
  const desc = description.toLowerCase();
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  let sub = "Detección Local";

  if (!isIncome) {
    if (/comida|rest|uber|cena|almuerzo|cafe|desayuno|taco|pizza/.test(desc)) category = "Comida y Bebida";
    else if (/trans|gasol|uber|didi|taxi|bus|metro|viaje/.test(desc)) category = "Transporte";
    else if (/renta|casa|luz|agua|gas|hogar|mueble/.test(desc)) category = "Vivienda y Hogar";
    else if (/cine|netflix|spotify|ocio|juego|diversion/.test(desc)) category = "Ocio y Entretenimiento";
    else if (/farmacia|doctor|medico|salud|gym|gimnasio/.test(desc)) category = "Salud y Bienestar";
    else if (/compra|ropa|mall|amazon|mercado/.test(desc)) category = "Compras y Ropa";
  } else {
    if (/nomina|sueldo|salario|pago/.test(desc)) category = "Sueldo y Salario";
    else if (/venta|negocio|cliente/.test(desc)) category = "Ventas y Negocios";
  }

  return {
    category,
    subCategory: sub,
    icon: ICON_MAP[category] || "other",
    confidence: 0
  };
}
