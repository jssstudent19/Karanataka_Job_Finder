export interface JobRecommendationFormData {
  city: string;
  job_position: string;
  years_of_experience: number;
  resume_file: File | null;
}

export interface GeneratedPromptData {
  prompt: string;
  skills: string[];
  processingTime?: string;
}