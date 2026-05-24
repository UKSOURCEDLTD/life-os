
import { GoogleGenAI, Type } from "@google/genai";
import { DayLog, Macros, Ingredient, Exercise } from "../types";

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    const key = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!key) throw new Error('Gemini API key not configured');
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

export const analyzeHabits = async (logs: Record<string, DayLog>) => {
  const recentLogs = Object.values(logs).slice(-7);
  const dataSummary = recentLogs.map(log => ({
    date: log.date,
    habitsCompleted: log.habits.filter(h => h.completed).length,
    mood: log.mood,
    journalSnippet: log.journal.substring(0, 50)
  }));

  const prompt = `Analyze this habit and meal data. Provide a simple and direct summary of progress and trends.
  Data: ${JSON.stringify(dataSummary)}`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "No analysis available.";
  } catch (error) {
    return "Could not analyze data.";
  }
};

export const parseExerciseActivity = async (input: string): Promise<Omit<Exercise, 'id'> | null> => {
  const prompt = `Parse this exercise description and estimate duration and calories burned: "${input}". 
  Return ONLY a JSON object with keys: name, durationMinutes, caloriesBurned. 
  Example: { "name": "Weightlifting", "durationMinutes": 45, "caloriesBurned": 300 }.
  Return null if it's not an exercise.`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            caloriesBurned: { type: Type.NUMBER },
          },
          required: ["name", "durationMinutes", "caloriesBurned"]
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.error("Exercise Parsing Error:", error);
    return null;
  }
};

export const getIngredientSuggestions = async (input: string): Promise<Ingredient[]> => {
  if (!input || input.length < 2) return [];

  const prompt = `Based on the partial string "${input}", suggest 5 specific food items or meals. 
  For each, estimate Calories, Protein (g), Carbs (g), and Fats (g) for a standard serving size.
  Return ONLY a JSON array of objects. Each object should have keys: name, calories, protein, carbs, fats.`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
            },
            required: ["name", "calories", "protein", "carbs", "fats"]
          }
        }
      }
    });

    if (response.text) {
      const results = JSON.parse(response.text.trim());
      return results.map((r: any) => ({
        name: r.name,
        macros: {
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fats: r.fats
        }
      }));
    }
    return [];
  } catch (error) {
    console.error("Suggestion Error:", error);
    return [];
  }
};

export const analyzeMealNutrition = async (ingredients: string[]): Promise<Ingredient[]> => {
  const prompt = `Analyze the nutritional value of these items: ${ingredients.join(', ')}. 
  For each individual item, provide estimated Calories, Protein (g), Carbs (g), and Fats (g).
  Return ONLY a JSON array of objects. Each object should have keys: name, calories, protein, carbs, fats. No extra text.`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
            },
            required: ["name", "calories", "protein", "carbs", "fats"]
          }
        }
      }
    });
    
    if (response.text) {
      const results = JSON.parse(response.text.trim());
      return results.map((r: any) => ({
        name: r.name,
        macros: {
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fats: r.fats
        }
      }));
    }
    return [];
  } catch (error) {
    console.error("Nutrition Analysis Error:", error);
    return [];
  }
};

export const getAIAssistance = async (query: string, currentContext: DayLog) => {
  const prompt = `User question: "${query}". 
  Status: Habits (${currentContext.habits.filter(h => h.completed).length}/${currentContext.habits.length}), Nutrition (${currentContext.meals.filter(m => m.completed).length}/${currentContext.meals.length}).
  Provide helpful and direct advice.`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "I'm not sure how to help with that.";
  } catch (error) {
    return "Assistant error.";
  }
};
