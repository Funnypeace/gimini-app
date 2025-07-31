export interface StorySegment {
  sceneDescription: string;
  choices: string[];
  isGameOver: boolean;
  imageUrl?: string;
}

// Expected JSON structure from Groq for story generation
export interface GroqStoryResponse {
  sceneDescription: string;
  choices: string[]; // Array of strings for player choices
  isGameOver: boolean;
}
