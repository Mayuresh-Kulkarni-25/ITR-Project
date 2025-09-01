// =========================
// Firebase Initialization
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDJAMnygp6XLycrVIOKVs9cM8IT-nbI_yA",
  authDomain: "open-chatroom-2547.firebaseapp.com",
  projectId: "open-chatroom-2547",
  storageBucket: "open-chatroom-2547.firebasestorage.app",
  messagingSenderId: "68323785313",
  appId: "1:68323785313:web:39e3ec17b80fabecc8c820",
  measurementId: "G-NKRTRNWMDF"
};

let app, db;
let username = "";
let userId = "";
let roomId = "";

// =========================
// DOM Elements
// =========================
const choiceScreen = document.getElementById("choice-screen");
const joinScreen = document.getElementById("join-screen");
const chatScreen = document.getElementById("chat-screen");

const usernameInput = document.getElementById("username-input");
const roomInput = document.getElementById("room-input");

const hostButton = document.getElementById("host-button");
const joinChoiceButton = document.getElementById("join-choice-button");
const joinButton = document.getElementById("join-button");
const exitButton = document.getElementById("exit-button");
const copyRoomBtn = document.getElementById("copy-room-btn");

const userIdDisplay = document.getElementById("user-id-display");
const roomNameDisplay = document.getElementById("room-name");

const messagesContainer = document.getElementById("messages-container");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

// =========================
// Initialize Firebase
// =========================
function initializeFirebase() {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("✅ Firebase initialized");

  // Assign a random userId
  userId = Math.random().toString(36).substring(2, 8);
  userIdDisplay.textContent = `Your ID: ${userId}`;

  // Enable buttons when username entered
  usernameInput.addEventListener("input", () => {
    const name = usernameInput.value.trim();
    hostButton.disabled = !name;
    joinChoiceButton.disabled = !name;
  });
}

// =========================
// Screen Switching
// =========================
function showScreen(screenId) {
  [choiceScreen, joinScreen, chatScreen].forEach(s => {
    s.classList.add("hidden");
    s.style.display = "none";
  });
  const active = document.getElementById(screenId);
  active.classList.remove("hidden");
  active.style.display = "flex";
  console.log(`➡️ Showing screen: #${screenId}`);
}

// =========================
// Host Room
// =========================
function hostRoom() {
  username = usernameInput.value.trim();
  if (!username) return alert("Please enter a username");

  roomId = Math.random().toString(36).substring(2, 8);
  roomNameDisplay.textContent = roomId;
  console.log(`🟣 Hosting room: ${roomId}`);

  showScreen("chat-screen");
  startListeningForMessages();
}

// =========================
// Join Room
// =========================
function joinExistingRoom() {
  username = usernameInput.value.trim();
  roomId = roomInput.value.trim();

  if (!username || !roomId) {
    alert("Please enter both username and Room ID");
    return;
  }

  roomNameDisplay.textContent = roomId;
  console.log(`🟢 Joining room: ${roomId} as ${username}`);

  showScreen("chat-screen");
  startListeningForMessages();
}

// =========================
// Message Handling
// =========================
async function sendMessage(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "rooms", roomId, "messages"), {
      text,
      username,
      userId,
      timestamp: serverTimestamp()
    });
    messageInput.value = "";
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

function startListeningForMessages() {
  const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp"));

  onSnapshot(q, snapshot => {
    messagesContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const el = createMessageElement(msg);
      messagesContainer.appendChild(el);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// =========================
// Render Message (Tailwind)
// =========================
function createMessageElement(message) {
  const isMine = message.userId === userId;
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col space-y-1 " + (isMine ? "items-end" : "items-start");

  const time = message.timestamp?.toDate ? new Date(message.timestamp.toDate()) : null;

  // Info row
  const info = document.createElement("div");
  info.className = "flex items-center space-x-2 text-xs text-gray-500 " + (isMine ? "justify-end" : "justify-start");

  const userEl = document.createElement("span");
  userEl.textContent = message.username ?? "User";
  userEl.className = "font-semibold text-gray-700";

  const timeEl = document.createElement("span");
  timeEl.textContent = time ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "...";

  info.appendChild(userEl);
  info.appendChild(timeEl);

  // Bubble
  const bubble = document.createElement("div");
  bubble.textContent = message.text ?? "";
  bubble.className =
    "px-4 py-2 rounded-2xl max-w-[75%] shadow " +
    (isMine
      ? "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-br-md"
      : "bg-white border border-gray-200 text-gray-800 rounded-bl-md");

  wrap.appendChild(info);
  wrap.appendChild(bubble);
  return wrap;
}

// =========================
// Event Listeners
// =========================
window.addEventListener("load", () => {
  initializeFirebase();

  hostButton.addEventListener("click", () => {
    console.log("🟣 Host button clicked");
    hostRoom();
  });

  joinChoiceButton.addEventListener("click", () => {
    const user = usernameInput.value.trim();
    if (!user) return alert("Please enter a username first.");
    console.log("➡️ Showing Join screen");
    showScreen("join-screen");
    joinButton.disabled = false;
  });

  joinButton.addEventListener("click", () => {
    console.log("🟢 Join button clicked");
    joinExistingRoom();
  });

  messageForm.addEventListener("submit", sendMessage);

  exitButton.addEventListener("click", () => {
    console.log("🚪 Exit button clicked");
    roomId = "";
    messagesContainer.innerHTML = "";
    showScreen("choice-screen");
  });

  copyRoomBtn.addEventListener("click", () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(() => {
        console.log("📋 Room ID copied:", roomId);
        copyRoomBtn.textContent = "Copied!";
        setTimeout(() => (copyRoomBtn.textContent = "Copy"), 2000);
      });
    }
  });
});
