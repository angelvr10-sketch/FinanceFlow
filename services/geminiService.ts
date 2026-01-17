
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

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Aún no tienes transacciones para analizar.";

  // Simplificamos los datos para no exceder tokens y evitar confusiones del modelo
  const dataSummary = transactions.slice(0, 20).map(t => ({
    t: t.type,
    c: t.category,
    a: t.amount,
    d: t.description
  }));

  const prompt = `Actúa como un asesor financiero personal. Analiza este resumen de transacciones recientes y dame 3 consejos clave para mejorar mi salud financiera.
  Resumen: ${JSON.stringify(dataSummary)}
  
  REQUISITOS:
  1. Usa lenguaje claro y directo.
  2. Devuelve la respuesta en formato de lista con puntos (•).
  3. No uses markdown complejo, solo texto y saltos de línea.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asesor financiero experto. Hablas español. Tus respuestas son breves y útiles.",
        temperature: 0.7,
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Lo siento, el servicio de IA está experimentando alta demanda. Por favor, intenta de nuevo en unos minutos.";
  }
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const categories = ["Comida", "Transporte", "Ocio", "Hogar", "Salud", "Educación", "Sueldo", "Inversión", "Ventas", "Honorarios", "Otros"];
  const icons = ["food", "transport", "leisure", "home", "health", "education", "salary", "investment", "business", "professional", "shopping", "other"];
  
  const typeStr = type === TransactionType.INCOME ? "INGRESO" : "GASTO";

  const prompt = `Analiza la descripción: "${description}" (${typeStr}). 
  Devuelve JSON con category (de: ${categories.join(",")}), icon (de: ${icons.join(",")}), confidence (0-1) y subCategory.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            icon: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["category", "icon", "confidence"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      category: result.category || "Otros",
      subCategory: result.subCategory,
      icon: result.icon || "other",
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    return { category: "Otros", icon: "other", confidence: 0 };
  }
};
