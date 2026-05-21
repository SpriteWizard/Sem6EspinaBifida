/**
 * Generates a signature string from testops IDs, suites and parameters
 * @param testopsIds - Array of testops IDs or null
 * @param suites - Array of suite names
 * @param parameters - Map of parameter names to values
 * @returns Formatted signature string
 */
export declare const generateSignature: (testopsIds: number[] | null, suites: string[], parameters: Record<string, string>) => string;
