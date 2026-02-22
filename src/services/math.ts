
// In a full production app, this would call a FastAPI backend with SymPy
// Here we provide a utility to format math questions for the AI
export const mathEngine = {
  cleanQuestion(raw: string): string {
    return raw.trim().replace(/\s+/g, ' ');
  },
  
  // Potential integration with mathjs if needed for local calculation
  // For this implementation, we rely on Gemini's advanced reasoning
  // but we isolate the "Engine" logic here for future scalability.
};
