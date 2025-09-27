import { log, logLevels } from "./logging";

/**
 * Sends a POST request to a specified URL with the given payload.
 * 
 * @template T - The expected response type.
 * @param {string} url - The endpoint to which the request is sent.
 * @param {Record<string, unknown>} payload - The data to be sent in the request body.
 * @param {number} [timeoutMs=5000] - Duration before the request is aborted, in milliseconds.
 * @returns {Promise<T | undefined>} A promise resolving to the response of the request, or `undefined` if an error occurs.
 * 
 * @example
 * // Example usage:
 * const response = await sendRequest<MyResponseType>(
 *     "https://api.example.com/data",
 *     { key: "value" },
 *     10000,
 * );
 * if (response) {
 *     console.log("Success:", response);
 * }
 */
export async function sendRequest<T>(
    url: string,
    payload: Record<string, unknown> | undefined,
    timeoutMs = 5000,
): Promise<T | undefined> {
    // Log the initiation of the request
    log(logLevels.debug, "Initiating request", ["network", "sendRequest"], { url, payload });

    const noPayload = !payload || Object.keys(payload).length === 0;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        log(logLevels.debug, "Sending payload to URL", ["network", "sendRequest"], { url });

        let response;
        if (noPayload) {
            response = await fetch(url);
        }
        else {
            response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
        }

        if (!response.ok) {
            log(logLevels.error, "Request failed", ["network", "sendRequest"], { status: response.status });
            throw new Error(`Request failed with status ${response.status}`);
        }

        // Check the Content-Type header
        const contentType = response.headers.get("content-type");

        let data, dataType;
        if (contentType?.includes("application/json")) {
            data = await response.json();
            dataType = "json";
        } else if (contentType?.includes("text/")) {
            data = await response.text();
            dataType = "text";
        } else {
            // Default to returning the raw response
            data = await response.blob();
            dataType = "blob";
        }

        log(logLevels.debug, `Request succeeded as "${dataType}"`, ["network", "debug", "sendRequest"], { data });

        return data;
    } catch (error) {
        log(logLevels.error, "Error during request", ["network", "error", "sendRequest"], error);
        return undefined;
    } finally {
        clearTimeout(timeout);
    }
}
