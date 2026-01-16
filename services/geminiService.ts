
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

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

export const categorizeTransaction = async (description: string): Promise<string> => {
  const categories = ["Comida", "Transporte", "Ocio", "Hogar", "Salud", "Educación", "Sueldo", "Inversión", "Otros"];
  const prompt = `Categoriza esta descripción de gasto/ingreso: "${description}" en una de estas categorías: ${categories.join(", ")}. Devuelve solo el nombre de la categoría.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Otros";
  } catch (error) {
    return "Otros";
  }
};
