import { log, logLevels } from "./index";

/**
 * A utility module for interacting with browser localStorage with added logging support.
 * 
 * Provides methods to save, load, and list keys in localStorage. Logs actions at configurable levels.
 */
export const storage = (() => {
    return {
        /**
         * Saves a value to localStorage under the specified key.
         * 
         * @param {string} key - The key under which the value will be stored.
         * @param {any} value - The value to store. Objects will be automatically stringified to JSON.
         * 
         * @example
         * storage.save('user', { name: 'Alice', age: 30 });
         * storage.save('theme', 'dark');
         */
        save: (key: string, value: any) => {
            log(logLevels.debug, `Saving key "${key}" with value:`, ["localStorage", "save"], value);
            localStorage.setItem(key, JSON.stringify(value));
        },

        /**
         * Loads a value from localStorage.
         * 
         * - If the key does not exist, the provided `defaultValue` is returned.
         * - If the stored value is valid JSON, it is parsed and returned.
         * - If parsing fails, the raw string is returned.
         * 
         * @param {string} key - The key of the value to retrieve.
         * @param {any} [defaultValue=null] - The default value to return if the key doesn't exist.
         * @returns {any} - The parsed value if JSON, the raw string if not JSON, or the default value if the key doesn't exist.
         * 
         * @example
         * const theme = storage.load('theme', 'light'); // Returns 'dark' if saved, or 'light' if not found
         * const user = storage.load('user'); // Returns { name: 'Alice', age: 30 }
         */
        load: (key: string, defaultValue: any = null) => {
            const value = localStorage.getItem(key);
            if (value === null) {
                log(logLevels.warning, `No value found for key "${key}". Returning default value:`, ["localStorage", "load"], defaultValue);
                return defaultValue;
            }

            try {
                log(logLevels.debug, `Value found for key "${key}". Returning value:`, ["localStorage", "load"], value);
                return JSON.parse(value); // Parse JSON if possible
            } catch (err) {
                log(logLevels.error, `Failed to parse value for key "${key}":`, ["localStorage", "load"], value, err);
                return value; // Return raw string if parsing fails
            }
        },

        /**
         * Lists all keys currently stored in localStorage.
         * 
         * @returns {string[]} - An array of keys currently in localStorage.
         * 
         * @example
         * const keys = storage.listKeys();
         * console.log(keys); // ['user', 'theme']
         */
        listKeys: (): string[] => {
            const keys = Object.keys(localStorage);
            log(logLevels.debug, `Available keys in localStorage:`, ["localStorage", "listKeys"], keys);
            return keys;
        }
    };
})();
