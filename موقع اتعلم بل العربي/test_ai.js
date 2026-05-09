
const API_KEY = "AIzaSyCVUTjW0oaA_-NM7sLz98bkzkCTMdSFEVg";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

async function test() {
    try {
        const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Hello, testing.' }] }]
            }),
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
