
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CategorizationResult, TransactionType } from "../types";

// Usamos Flash para ambas tareas por su velocidad y alta disponibilidad
const ANALYST_MODEL = 'gemini-3-flash-preview';

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
  "Mascotas",
  "Regalos y Donaciones",
  "Vehículos y Mantenimiento",
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
  "Mascotas": "pets",
  "Regalos y Donaciones": "gifts",
  "Vehículos y Mantenimiento": "maintenance",
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
  "Regalos y Premios": "gifts",
  "Otros Ingresos": "other",
  "Otros Gastos": "other"
};

// DICCIONARIO LOCAL PARA RESPUESTA INSTANTÁNEA
const LOCAL_RULES = [
  // Gastos
  { keys: ["uber", "didi", "taxi", "cabify", "indriver"], cat: "Transporte", sub: "Viaje App" },
  { keys: ["gasolina", "combustible", "shell", "repsol", "pemex", "gas", "estacionamiento", "parking"], cat: "Transporte", sub: "Vehículo" },
  { keys: ["restaurante", "comida", "almuerzo", "cena", "desayuno", "pizza", "hamburguesa", "sushi", "cafe", "starbucks"], cat: "Comida y Bebida", sub: "Restaurante" },
  { keys: ["super", "walmart", "oxxo", "carulla", "mercadona", "exito", "jumbo", "tienda", "mandado"], cat: "Comida y Bebida", sub: "Supermercado" },
  { keys: ["renta", "alquiler", "hipoteca", "luz", "agua", "internet", "wifi", "claro", "movistar", "tigo"], cat: "Vivienda y Hogar", sub: "Servicios" },
  { keys: ["netflix", "spotify", "hbo", "disney", "prime", "youtube", "cine", "boletos", "entrada"], cat: "Ocio y Entretenimiento", sub: "Suscripción" },
  { keys: ["farmacia", "doctor", "hospital", "medicina", "paracetamol", "clinica", "dentista", "gym", "gimnasio"], cat: "Salud y Bienestar", sub: "Salud" },
  { keys: ["zara", "h&m", "amazon", "mercadolibre", "ropa", "tenis", "zapatos", "compras"], cat: "Compras y Ropa", sub: "Shopping" },
  { keys: ["croquetas", "veterinario", "perro", "gato", "mascota"], cat: "Mascotas", sub: "Cuidado" },
  
  // Ingresos
  { keys: ["nomina", "sueldo", "salario", "pago", "empresa", "quincena"], cat: "Sueldo y Salario", sub: "Trabajo" },
  { keys: ["venta", "negocio", "mercadopago", "cliente"], cat: "Ventas y Negocios", sub: "Ingreso Propio" },
  { keys: ["honorarios", "freelance", "proyecto"], cat: "Honorarios Profesionales", sub: "Servicio" },
  { keys: ["dividendo", "rendimiento", "interes", "cripto", "binance"], cat: "Inversiones y Dividendos", sub: "Inversión" }
];

const findBestCategoryMatch = (input: string, allowed: string[]): string | null => {
  if (!input) return null;
  const normalizedInput = input.toLowerCase().trim();
  const exactMatch = allowed.find(cat => cat.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;
  return allowed.find(cat => 
    normalizedInput.includes(cat.toLowerCase()) || 
    cat.toLowerCase().includes(normalizedInput)
  ) || null;
};

export const categorizeTransaction = async (description: string, type: TransactionType): Promise<CategorizationResult> => {
  const isIncome = type === TransactionType.INCOME;
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const desc = description.toLowerCase();

  for (const rule of LOCAL_RULES) {
    if (rule.keys.some(k => desc.includes(k))) {
      const matched = findBestCategoryMatch(rule.cat, categories);
      if (matched) {
        return {
          category: matched,
          subCategory: rule.sub,
          icon: ICON_MAP[matched] || "other",
          confidence: 1.0,
        };
      }
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) return localFallback(description, isIncome);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: ANALYST_MODEL,
      contents: `Clasifica: "${description}"`,
      config: {
        systemInstruction: `Responde exclusivamente con un objeto JSON. La categoría DEBE ser una de: [${categories.join(", ")}].`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["category", "confidence"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    const matched = findBestCategoryMatch(result.category, categories);
    
    if (matched) {
      return {
        category: matched,
        subCategory: result.subCategory || "",
        icon: ICON_MAP[matched] || "other",
        confidence: result.confidence || 0.9,
      };
    }
  } catch (e) {
    console.error("Error en categorización IA:", e);
  }

  return localFallback(description, isIncome);
};

function localFallback(description: string, isIncome: boolean): CategorizationResult {
  let category = isIncome ? "Otros Ingresos" : "Otros Gastos";
  return {
    category,
    subCategory: "",
    icon: ICON_MAP[category] || "other",
    confidence: 0.1
  };
}

async function runAiRequest(modelName: string, prompt: string, systemInstruction: string, config: any = {}): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  
  const contents = config.imageData 
    ? { parts: [{ inlineData: config.imageData }, { text: prompt }] } 
    : prompt;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction,
      temperature: config.useThinking ? 0.5 : 0.1,
      // Flash también soporta Thinking pero requiere un presupuesto menor para ser ágil
      ...(config.useThinking && { thinkingConfig: { thinkingBudget: 4000 } }),
      ...(config.isJson && { responseMimeType: "application/json", responseSchema: config.schema })
    }
  });

  if (!response.text) throw new Error("EMPTY_AI_RESPONSE");
  return response.text;
}

export const analyzeReceipt = async (base64Data: string, mimeType: string): Promise<any> => {
  const responseText = await runAiRequest(ANALYST_MODEL, "Extrae la info.", `Analiza este ticket. Responde en JSON con amount (numero), merchant (nombre tienda), date (YYYY-MM-DD), category (elige la mejor de [${EXPENSE_CATEGORIES.join(", ")}]).`, { 
    isJson: true, 
    schema: { 
      type: Type.OBJECT, 
      properties: { 
        amount: { type: Type.NUMBER }, 
        merchant: { type: Type.STRING }, 
        date: { type: Type.STRING }, 
        category: { type: Type.STRING } 
      }, 
      required: ["amount", "merchant", "category"] 
    }, 
    imageData: { data: base64Data, mimeType } 
  });
  
  const result = JSON.parse(responseText);
  const matchedCategory = findBestCategoryMatch(result.category, EXPENSE_CATEGORIES) || "Otros Gastos";
  return { 
    amount: result.amount || 0, 
    description: result.merchant || "Compra", 
    date: result.date || new Date().toISOString().split('T')[0], 
    category: matchedCategory, 
    icon: ICON_MAP[matchedCategory] || "shopping" 
  };
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length < 5) return "Necesito más datos para darte un análisis certero.";
  
  const dataSummary = transactions
    .slice(0, 50)
    .map(t => `${t.date.split('T')[0]} | ${t.type === TransactionType.INCOME ? 'INGRESO' : 'GASTO'}: $${t.amount} | ${t.category} (${t.description})`)
    .join('\n');

  return await runAiRequest(
    ANALYST_MODEL, 
    `Aquí tienes mis últimos movimientos:\n${dataSummary}\n\nPor favor, analiza mis hábitos y dame 3 consejos concretos para ahorrar o mejorar mi salud financiera este mes.`, 
    "Eres un experto consultor financiero personal. Hablas de forma clara, motivadora y analítica. Tus consejos deben basarse estrictamente en los datos proporcionados.", 
    { useThinking: true }
  );
};
