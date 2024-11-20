const API_KEY = "AIzaSyDPaGyHpcgysvaFCCqOXlkxfDfuEmuJqCc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
const chatIcon = document.getElementById("chat-icon");
const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const imageInput = document.getElementById("image-input");
const voiceBtn = document.getElementById("voice-btn");

let recognition;
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
}

chatIcon.addEventListener("click", () => {
  chatContainer.classList.remove("hidden");
  chatIcon.style.display = "none";
});

function appendMessage(content, sender) {
  const messageElement = document.createElement("div");
  messageElement.className = `message ${sender}`;
  
  if (content.includes("*")) {
    const points = content.split("\n").map(line => {
      if (line.trim().startsWith("*")) return `<li>${line.replace("*", "").trim()}</li>`;
      return line;
    });
    messageElement.innerHTML = `<ul>${points.join("")}</ul>`;
  } else {
    messageElement.innerHTML = content.replace(/\n/g, "<br>");
  }

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const typingElement = document.createElement("div");
  typingElement.className = "message bot typing";
  typingElement.textContent = "...";
  chatBox.appendChild(typingElement);
  chatBox.scrollTop = chatBox.scrollHeight;
  return typingElement;
}

async function fetchResponse(query) {
  const payload = { contents: [{ parts: [{ text: query }] }] };
  const typingElement = showTyping();

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(response);
    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    console.log(data);
    typingElement.remove();
    const botReply = data.candidates[0]?.content?.parts[0]?.text || "No response available.";
    appendMessage(botReply, "bot");
  } catch (error) {
    console.error(error);
    typingElement.remove();
    appendMessage("Error: Unable to fetch response.", "bot");
  }
}

sendBtn.addEventListener("click", () => {
  const query = userInput.value.trim();
  if (!query) return;
  appendMessage(query, "user");
  userInput.value = "";
  fetchResponse(query);
});

document.querySelectorAll(".quick-btn").forEach(button => {
  button.addEventListener("click", () => {
    appendMessage(button.textContent, "user");
    fetchResponse(button.textContent);
  });
});

// Handle image input
imageInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  appendMessage("Processing image...", "bot");
  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng");
    appendMessage(`Extracted text: ${text.trim()}`, "bot");
    fetchResponse(text.trim());
  } catch (error) {
    console.error("Error processing image:", error);
    appendMessage("Error: Unable to process image.", "bot");
  }
});

// Handle voice input
voiceBtn.addEventListener("click", () => {
  if (!recognition) return alert("Speech recognition not supported.");
  recognition.start();

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    appendMessage(spokenText, "user");
    fetchResponse(spokenText);
  };

  recognition.onerror = () => alert("Error capturing voice.");
});

// Handle "Enter" key press
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});
