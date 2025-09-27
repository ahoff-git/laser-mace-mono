type SortingDirection = 'asc' | 'desc';

type SortableItem = {
    [key: string]: any;
};

/**
 * Sorts a collection of objects, values, or numbers based on a specified property or directly.
 *
 * @param collection - The array of objects, strings, or numbers to sort.
 * @param sortingDirection - The direction to sort ('asc' for ascending, 'desc' for descending).
 * @param sortProperty - The property of each object to sort by (optional, used only for object collections).
 * @param ignoreSymbols - An array of symbols to ignore during sorting (applies to string values only).
 * @param caseInsensitive - Whether to perform case-insensitive sorting (optional, defaults to false).
 * @returns A new array sorted based on the specified property and rules, or directly for value collections.
 * @throws {Error} If ignoreSymbols is not an array of strings.
 */
export function customSort(
    collection: (SortableItem | string | number)[],
    sortingDirection: SortingDirection,
    sortProperty?: string,
    ignoreSymbols: string[] = [],
    caseInsensitive: boolean = false
): (SortableItem | string | number)[] {
    // Validate input to ensure ignoreSymbols is an array of strings
    if (!Array.isArray(ignoreSymbols) || !ignoreSymbols.every(sym => typeof sym === 'string')) {
        throw new Error("ignoreSymbols must be an array of strings");
    }

    // Convert ignoreSymbols to a Set once for faster lookup and to avoid duplication
    const ignoreSet = new Set(ignoreSymbols);

    /**
     * Cleans a string value by removing specified symbols, optionally converting to uppercase, 
     * and parsing numeric sequences into integers.
     *
     * @param value - The string to be cleaned.
     * @returns An array of mixed types (string and number) representing the cleaned value.
     * @throws {Error} If the value is not a string.
     */
    const cleanValue = (value: string): (string | number)[] => {
        if (typeof value !== 'string') {
            throw new Error("Value to clean must be a string");
        }

        const result: (string | number)[] = [];
        let tempNumber = '';

        // Optionally convert value to uppercase
        if (caseInsensitive) {
            value = value.toUpperCase();
        }

        for (let char of value) {
            if (ignoreSet.has(char)) {
                continue;
            }
            if (char >= '0' && char <= '9') {
                tempNumber += char;
            } else {
                if (tempNumber) {
                    result.push(parseInt(tempNumber, 10));
                    tempNumber = '';
                }
                result.push(char);
            }
        }
        if (tempNumber) {
            result.push(parseInt(tempNumber, 10));
        }

        return result;
    };

    /**
     * Compares two items based on the cleaned values of their specified property or directly.
     *
     * @param a - The first item to compare.
     * @param b - The second item to compare.
     * @returns A negative number if a < b, positive if a > b, or 0 if equal.
     */
    const compareValues = (a: SortableItem | string | number, b: SortableItem | string | number): number => {
        const valueA = typeof a === 'number'
            ? [a]
            : cleanValue(sortProperty ? String((a as SortableItem)[sortProperty]) : String(a));
        const valueB = typeof b === 'number'
            ? [b]
            : cleanValue(sortProperty ? String((b as SortableItem)[sortProperty]) : String(b));

        // Determine the minimum length to avoid unnecessary comparisons beyond the shorter value
        const maxLength = Math.min(valueA.length, valueB.length); // Optimization for efficiency

        for (let i = 0; i < maxLength; i++) {
            const partA = valueA[i];
            const partB = valueB[i];

            if (partA < partB) return sortingDirection === 'asc' ? -1 : 1;
            if (partA > partB) return sortingDirection === 'asc' ? 1 : -1;
        }

        // If one string is a prefix of the other, the shorter one is "smaller"
        if (valueA.length < valueB.length) return sortingDirection === 'asc' ? -1 : 1;
        if (valueA.length > valueB.length) return sortingDirection === 'asc' ? 1 : -1;

        return 0; // If all parts are equal
    };

    // Note: Array.prototype.sort modifies the original array.
    // If this behavior is undesired, consider creating a shallow copy of the array before sorting.
    return [...collection].sort(compareValues);
}