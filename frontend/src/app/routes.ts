export const appRoutes = {
  store: '/store',
  kitchen: '/kitchen',
  profile: '/me',
  designSystem: '/design-system',
  login: '/login',
  register: '/register',
  recipe: (recipeId: string) => `/recipes/${recipeId}`,
  cook: (recipeId: string) => `/cook/${recipeId}`,
  cookingFinished: (historyId: string) => `/cooking-finished/${historyId}`,
} as const;
