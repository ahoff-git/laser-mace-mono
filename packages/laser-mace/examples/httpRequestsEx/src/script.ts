import { sendRequest } from "laser-mace"
/* You'll need to run the following: 
    pnpm dev

*/


// Get form and elements
const form = document.getElementById("requestForm") as HTMLFormElement; 
const urlInput = document.getElementById("url") as HTMLInputElement;
const payloadInput = document.getElementById("payload") as HTMLTextAreaElement;
const responseDiv = document.getElementById("response") as HTMLDivElement;

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = urlInput.value;
    const payloadText = payloadInput.value;

    try {
        const payload = JSON.parse(payloadText); // Parse the payload
        responseDiv.textContent = "Sending request...";

        const timeoutMs = 10000; // Allow slow endpoints more time
        const result = await sendRequest<any>(url, payload, timeoutMs);

        if (result) {
            responseDiv.textContent = `Response:\n${JSON.stringify(result, null, 2)}`;
        } else {
            responseDiv.textContent = "Request failed or no response.";
        }
    } catch (error) {
        // Type guard for Error object
        if (error instanceof Error) {
            responseDiv.textContent = `Error: ${error.message}`;
        } else {
            responseDiv.textContent = "An unknown error occurred.";
        }
    }
});

