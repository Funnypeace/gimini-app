
export interface StorySegment {
  sceneDescription: string;
  choices: string[];
  imagePrompt: string;
  imageUrl?: string;
  isGameOver: boolean;
}

// Expected JSON structure from Gemini for story generation
export interface GeminiStoryResponse {
  sceneDescription: string;
  choices: string[]; // Array of strings for player choices
  imagePrompt: string; // Prompt for image generation
}
