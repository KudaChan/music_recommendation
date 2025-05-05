// Centralized error handling utility
export function handleApiError(error: unknown, context: string) {
  console.error(`${context} error:`, error);
  return { 
    success: false, 
    message: `Failed to ${context}`,
    error: error instanceof Error ? error.message : String(error)
  };
}