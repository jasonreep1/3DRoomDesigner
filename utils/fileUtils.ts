/**
 * Converts a File object to a base64 encoded string.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the base64 string (without the data URL prefix).
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // result is a data URL: "data:image/jpeg;base64,LzlqLzRBQ...".
      // We only want the part after the comma.
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts a data URL string to a base64 encoded string.
 * @param dataUrl The data URL string (e.g., "data:image/png;base64,...").
 * @returns The base64 string (without the data URL prefix).
 */
export const dataUrlToBase64 = (dataUrl: string): string => {
  const base64String = dataUrl.split(',')[1];
  if (!base64String) {
    throw new Error("Invalid data URL provided.");
  }
  return base64String;
};

/**
 * Sanitizes a string to be used as a valid filename.
 * Replaces invalid characters with underscores and limits length.
 * @param filename The string to sanitize.
 * @returns A safe filename string.
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'untitled';
  // Replace characters that are invalid in filenames across different OSes
  const sanitized = filename.replace(/[<>:"/\\|?* \t\n\r\0]/g, '_');
  // Limit the length to avoid issues with max filename length
  return sanitized.substring(0, 50);
};
