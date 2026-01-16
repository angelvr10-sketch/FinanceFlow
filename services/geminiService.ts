
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult } from "../types";

// Acceso seguro a la API KEY
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Aún no tienes transacciones para analizar. ¡Comienza agregando tus gastos e ingresos!";

  const prompt = `Analiza estas transacciones financieras y dame consejos breves (máximo 3 puntos) sobre cómo mejorar mis finanzas. Sé directo y motivador.
  Transacciones: ${JSON.stringify(transactions)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asesor financiero experto, amigable y directo. Hablas español de España/Latinoamérica.",
      }
    });
    return response.text || "No pude generar consejos en este momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Lo siento, hubo un problema al conectar con tu asesor financiero AI.";
  }
};

export const categorizeTransaction = async (description: string): Promise<CategorizationResult> => {
  const categories = ["Comida", "Transporte", "Ocio", "Hogar", "Salud", "Educación", "Sueldo", "Inversión", "Otros"];
  const icons = ["food", "transport", "leisure", "home", "health", "education", "salary", "investment", "shopping", "other"];
  
  const prompt = `Analiza la descripción: "${description}". 
  1. Clasifícala en una categoría: ${categories.join(", ")}. 
  2. Sugiere una sub-categoría. 
  3. Elige el icono más representativo SOLO de esta lista: ${icons.join(", ")}.
  4. Indica el puntaje de confianza (0-1).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "La categoría principal.",
            },
            subCategory: {
              type: Type.STRING,
              description: "Sub-categoría específica.",
            },
            icon: {
              type: Type.STRING,
              description: "El ID del icono elegido de la lista permitida.",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Nivel de confianza de 0 a 1.",
            },
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
    console.error("Error categorizing:", error);
    return { category: "Otros", icon: "other", confidence: 0 };
  }
};
