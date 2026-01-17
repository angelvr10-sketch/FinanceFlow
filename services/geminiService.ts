
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

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

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const categories = ["Comida", "Transporte", "Ocio", "Hogar", "Salud", "Educación", "Sueldo", "Inversión", "Ventas", "Honorarios", "Otros"];
  const icons = ["food", "transport", "leisure", "home", "health", "education", "salary", "investment", "business", "professional", "shopping", "other"];
  
  const typeStr = type === TransactionType.INCOME ? "INGRESO" : "GASTO";

  const prompt = `Analiza la descripción de esta transacción de tipo ${typeStr}: "${description}". 
  
  REGLAS DE CATEGORIZACIÓN:
  1. Si menciona "gasolina", "combustible", "uber" o "taxi" -> Categoría: "Transporte", Icono: "transport".
  2. Si menciona "casa", "luz", "agua", "hogar", "alquiler" -> Categoría: "Hogar", Icono: "home".
  3. Si menciona "costillas", "restaurante", "pizza", "comida", "supermercado" -> Categoría: "Comida", Icono: "food".
  4. Si menciona "venta", "producto", "mercancía", "tinta" -> Categoría: "Ventas", Icono: "business".
  5. Si menciona "soporte", "técnico", "asesoría", "servicio profesional", "honorarios" -> Categoría: "Honorarios", Icono: "professional".
  6. Si es un ingreso de nómina o trabajo estable -> Categoría: "Sueldo", Icono: "salary".
  
  Devuelve el resultado en JSON usando las categorías permitidas: ${categories.join(", ")} 
  y los iconos permitidos: ${icons.join(", ")}.`;

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
              description: "Sub-categoría específica sugerida.",
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
