import fs from 'fs';
import path from 'path';

// Load service account from file if available
export function loadServiceAccount() {
  try {
    // Check if we have a service account file
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      // Load and parse the service account file
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
      return JSON.parse(serviceAccountFile);
    }
    
    // No service account file, return null
    return null;
  } catch (error) {
    console.error('Error loading service account:', error);
    return null;
  }
}