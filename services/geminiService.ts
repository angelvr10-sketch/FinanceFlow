
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

// Definición clara de categorías por tipo para guiar a la IA
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
  • Punto 3: Acción inmediata recomendada.
  
  Sé extremadamente breve pero impactante. No uses markdown de títulos.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asesor financiero experto. Analizas patrones de gasto e ingreso para maximizar el ahorro. Hablas español neutro y profesional.",
        temperature: 0.4, // Menos aleatoriedad para consejos más consistentes
      }
    });
    
    return response.text || "Sigue registrando para obtener mejores consejos.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "No pude conectar con el asesor. Revisa tu presupuesto manualmente.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const isIncome = type === TransactionType.INCOME;
  const allowedCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const typeLabel = isIncome ? "INGRESO" : "GASTO";

  const prompt = `Analiza la descripción: "${description}"
  Esta operación es un ${typeLabel}.
  
  Reglas:
  1. Debes elegir la categoría más lógica de esta lista: [${allowedCategories.join(", ")}].
  2. Genera una 'subCategory' corta y específica (ej: "Netflix", "Gasolina", "Freelance").
  3. No asignes categorías de ingreso a gastos ni viceversa.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `Eres un motor de categorización contable infalible. Tu objetivo es clasificar descripciones bancarias o personales con precisión milimétrica. Si la descripción es ambigua, usa el contexto del tipo de operación (${typeLabel}).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { 
              type: Type.STRING, 
              description: "La categoría principal seleccionada de la lista permitida." 
            },
            subCategory: { 
              type: Type.STRING, 
              description: "Un término más específico derivado de la descripción." 
            },
            confidence: { 
              type: Type.NUMBER, 
              description: "Nivel de confianza de 0 a 1." 
            },
          },
          required: ["category", "subCategory", "confidence"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    // Validar que la categoría devuelta esté en nuestra lista (por seguridad)
    const finalCategory = allowedCategories.includes(result.category) 
      ? result.category 
      : (isIncome ? "Otros Ingresos" : "Otros Gastos");

    return {
      category: finalCategory,
      subCategory: result.subCategory || "",
      icon: ICON_MAP[finalCategory] || "other",
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("Categorization error:", error);
    return { 
      category: isIncome ? "Otros Ingresos" : "Otros Gastos", 
      icon: "other", 
      confidence: 0 
    };
  }
};
