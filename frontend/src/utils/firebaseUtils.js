/**
 * Sanitizes a string for use as a Firebase Realtime Database key.
 * Removes or replaces characters: . $ # [ ] /
 */
export const sanitizeKey = (key) => {
    if (!key) return "General";
    return key.replace(/[\/\.#\$\[\]]/g, "_");
};