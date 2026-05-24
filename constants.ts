
import { HabitCategory, Habit, Meal, MealLibraryItem } from './types';

export const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Hydration (3L)', category: HabitCategory.HEALTH, completed: false, linkedGoalId: undefined },
  { id: '2', name: 'Deep Meditation (10m)', category: HabitCategory.MINDFULNESS, completed: false },
  { id: '3', name: 'Deep Work Block', category: HabitCategory.PRODUCTIVITY, completed: false },
  { id: '4', name: 'Performance Reading (30m)', category: HabitCategory.GROWTH, completed: false },
  { id: '5', name: 'Charting / Trade Review', category: HabitCategory.WEALTH, completed: false },
  { id: '6', name: 'Workout / Movement', category: HabitCategory.HEALTH, completed: false },
];

export const INITIAL_MEALS: Meal[] = [
  {
    id: 'm1',
    name: 'Protein Oats + Whey',
    type: 'Breakfast',
    completed: false,
    ingredients: [
      { name: 'Rolled Oats (80g)', macros: { calories: 304, protein: 11, carbs: 54, fats: 5 } },
      { name: 'Whey Protein (30g)', macros: { calories: 120, protein: 24, carbs: 3, fats: 1 } },
      { name: 'Banana (1 medium)', macros: { calories: 105, protein: 1, carbs: 27, fats: 0 } },
      { name: 'Peanut Butter (1 tbsp)', macros: { calories: 95, protein: 4, carbs: 3, fats: 8 } },
    ]
  },
  {
    id: 'm2',
    name: 'Chicken Rice Bowl',
    type: 'Lunch',
    completed: false,
    ingredients: [
      { name: 'Chicken Breast (200g)', macros: { calories: 330, protein: 62, carbs: 0, fats: 7 } },
      { name: 'White Rice (150g cooked)', macros: { calories: 195, protein: 4, carbs: 43, fats: 0 } },
      { name: 'Mixed Veg (150g)', macros: { calories: 60, protein: 3, carbs: 12, fats: 0 } },
      { name: 'Olive Oil (1 tbsp)', macros: { calories: 120, protein: 0, carbs: 0, fats: 14 } },
    ]
  },
  {
    id: 'm3',
    name: 'Lean Beef & Sweet Potato',
    type: 'Dinner',
    completed: false,
    ingredients: [
      { name: 'Lean Beef Mince 5% (200g)', macros: { calories: 280, protein: 42, carbs: 0, fats: 12 } },
      { name: 'Sweet Potato (250g)', macros: { calories: 215, protein: 4, carbs: 50, fats: 0 } },
      { name: 'Broccoli (150g)', macros: { calories: 51, protein: 4, carbs: 10, fats: 0 } },
    ]
  },
];

export const INITIAL_MEAL_LIBRARY: MealLibraryItem[] = [
  {
    id: 'lib-1', name: 'Protein Oats + Whey', type: 'Breakfast', isFavorite: true, tags: ['high-protein', 'quick'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Rolled Oats (80g)', macros: { calories: 304, protein: 11, carbs: 54, fats: 5 } },
      { name: 'Whey Protein (30g)', macros: { calories: 120, protein: 24, carbs: 3, fats: 1 } },
      { name: 'Banana (1 medium)', macros: { calories: 105, protein: 1, carbs: 27, fats: 0 } },
      { name: 'Peanut Butter (1 tbsp)', macros: { calories: 95, protein: 4, carbs: 3, fats: 8 } },
    ]
  },
  {
    id: 'lib-2', name: 'Eggs + Toast + Avocado', type: 'Breakfast', isFavorite: true, tags: ['high-protein'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: '3 Whole Eggs', macros: { calories: 215, protein: 18, carbs: 1, fats: 15 } },
      { name: 'Wholemeal Toast (2 slices)', macros: { calories: 180, protein: 8, carbs: 32, fats: 2 } },
      { name: 'Avocado (1/2)', macros: { calories: 160, protein: 2, carbs: 9, fats: 15 } },
    ]
  },
  {
    id: 'lib-3', name: 'Greek Yogurt Bowl', type: 'Breakfast', isFavorite: false, tags: ['quick', 'high-protein'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Greek Yogurt 0% (200g)', macros: { calories: 120, protein: 20, carbs: 8, fats: 0 } },
      { name: 'Granola (40g)', macros: { calories: 180, protein: 4, carbs: 30, fats: 5 } },
      { name: 'Mixed Berries (100g)', macros: { calories: 50, protein: 1, carbs: 12, fats: 0 } },
      { name: 'Honey (1 tsp)', macros: { calories: 20, protein: 0, carbs: 6, fats: 0 } },
    ]
  },
  {
    id: 'lib-4', name: 'Chicken Rice Bowl', type: 'Lunch', isFavorite: true, tags: ['meal-prep'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Chicken Breast (200g)', macros: { calories: 330, protein: 62, carbs: 0, fats: 7 } },
      { name: 'White Rice (150g cooked)', macros: { calories: 195, protein: 4, carbs: 43, fats: 0 } },
      { name: 'Mixed Veg (150g)', macros: { calories: 60, protein: 3, carbs: 12, fats: 0 } },
      { name: 'Olive Oil (1 tbsp)', macros: { calories: 120, protein: 0, carbs: 0, fats: 14 } },
    ]
  },
  {
    id: 'lib-5', name: 'Tuna Wrap', type: 'Lunch', isFavorite: false, tags: ['quick', 'on-the-go'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Tuna in Spring Water (1 can, 120g)', macros: { calories: 130, protein: 30, carbs: 0, fats: 1 } },
      { name: 'Wholemeal Wrap', macros: { calories: 200, protein: 7, carbs: 35, fats: 4 } },
      { name: 'Light Mayo (1 tbsp)', macros: { calories: 35, protein: 0, carbs: 1, fats: 3 } },
      { name: 'Salad Mix', macros: { calories: 20, protein: 1, carbs: 4, fats: 0 } },
    ]
  },
  {
    id: 'lib-6', name: 'Salmon + Quinoa', type: 'Lunch', isFavorite: false, tags: ['omega-3'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Salmon Fillet (180g)', macros: { calories: 370, protein: 40, carbs: 0, fats: 23 } },
      { name: 'Quinoa (150g cooked)', macros: { calories: 180, protein: 7, carbs: 32, fats: 3 } },
      { name: 'Asparagus (100g)', macros: { calories: 20, protein: 2, carbs: 4, fats: 0 } },
    ]
  },
  {
    id: 'lib-7', name: 'Lean Beef & Sweet Potato', type: 'Dinner', isFavorite: true, tags: ['meal-prep'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Lean Beef Mince 5% (200g)', macros: { calories: 280, protein: 42, carbs: 0, fats: 12 } },
      { name: 'Sweet Potato (250g)', macros: { calories: 215, protein: 4, carbs: 50, fats: 0 } },
      { name: 'Broccoli (150g)', macros: { calories: 51, protein: 4, carbs: 10, fats: 0 } },
    ]
  },
  {
    id: 'lib-8', name: 'Chicken Pasta', type: 'Dinner', isFavorite: false, tags: ['carb-heavy'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Chicken Breast (180g)', macros: { calories: 297, protein: 56, carbs: 0, fats: 6 } },
      { name: 'Pasta (100g dry)', macros: { calories: 370, protein: 13, carbs: 74, fats: 2 } },
      { name: 'Tomato Sauce (150g)', macros: { calories: 50, protein: 2, carbs: 10, fats: 1 } },
      { name: 'Parmesan (20g)', macros: { calories: 80, protein: 7, carbs: 1, fats: 6 } },
    ]
  },
  {
    id: 'lib-9', name: 'Stir Fry with Tofu', type: 'Dinner', isFavorite: false, tags: ['vegetarian'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Firm Tofu (200g)', macros: { calories: 160, protein: 18, carbs: 4, fats: 9 } },
      { name: 'Brown Rice (150g cooked)', macros: { calories: 215, protein: 5, carbs: 45, fats: 2 } },
      { name: 'Stir Fry Veg (200g)', macros: { calories: 80, protein: 4, carbs: 16, fats: 1 } },
      { name: 'Sesame Oil (1 tsp)', macros: { calories: 40, protein: 0, carbs: 0, fats: 5 } },
    ]
  },
  {
    id: 'lib-10', name: 'Protein Shake', type: 'Snack', isFavorite: true, tags: ['quick', 'post-workout'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Whey Protein (30g)', macros: { calories: 120, protein: 24, carbs: 3, fats: 1 } },
      { name: 'Milk Semi-Skimmed (250ml)', macros: { calories: 125, protein: 9, carbs: 12, fats: 4 } },
    ]
  },
  {
    id: 'lib-11', name: 'Apple + Almond Butter', type: 'Snack', isFavorite: false, tags: ['quick', 'whole-food'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Apple (1 medium)', macros: { calories: 95, protein: 0, carbs: 25, fats: 0 } },
      { name: 'Almond Butter (1 tbsp)', macros: { calories: 100, protein: 3, carbs: 3, fats: 9 } },
    ]
  },
  {
    id: 'lib-12', name: 'Cottage Cheese Bowl', type: 'Snack', isFavorite: false, tags: ['high-protein', 'low-cal'], createdAt: new Date().toISOString(),
    ingredients: [
      { name: 'Cottage Cheese (200g)', macros: { calories: 200, protein: 28, carbs: 7, fats: 6 } },
      { name: 'Pineapple Chunks (100g)', macros: { calories: 50, protein: 1, carbs: 13, fats: 0 } },
    ]
  },
];
