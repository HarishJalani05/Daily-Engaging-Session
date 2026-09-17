# 📚 Class Engage - Daily Classroom WhatsApp Update Generator

A lightweight, high-aesthetic web application designed to help school teachers automate daily classroom engaging session updates and send neatly formatted updates directly to WhatsApp groups in seconds.

---

## 🌟 Key Features

- 📅 **Native Calendar Picker & Auto Day Updation**: Select any session date using an interactive browser calendar. The day of the week (*Monday*, *Friday*, etc.) is automatically calculated.
- ⚡ **Quick Date Chips**: One-touch presets for **Yesterday**, **Today**, and **Tomorrow**.
- 🎙️ **English Speech-to-Text Dictation**: Individual microphone icons beside every subject input for fast voice dictation.
- 🧠 **Smart Range Formatter (`1 se 70` / `1 to 70` ➔ `1-70`)**:
  - Automatically transforms spoken range phrases like *"Numbers 1 se 70"* or *"1 to 70"* into clean classroom notes (`Numbers 1-70`).
  - Fixes speech recognition fused numbers (e.g., converts `1270` to `1-70`).
- ⏩ **"Kuch Nahi" Auto-Skip Filter**: Saying *"Kuch nahi"*, *"Nothing"*, *"Skip"*, or *"Nahi"* leaves the field blank and automatically excludes that subject from the WhatsApp message.
- ⌨️ **Hindi Akshar Virtual Keyboard (`हिंदी अक्षर`)**: On-screen touch toolbar with Vowels (*Swar*: `अ-अः`), Consonants (*Vyanjan*: `क-ज्ञ`), and shortcuts (`अ-अः`) to type Hindi letters without changing OS system keyboards.
- 🗑️ **Interactive Preview Line Deletion**: Red delete `(X)` buttons rendered beside each subject line inside the green WhatsApp Live Preview box to delete accidental entries instantly.
- 📱 **1-Click WhatsApp Sharing**: Generates exact WhatsApp Markdown formatting (`*Today's Engaging Session...*`) and opens WhatsApp directly on mobile or desktop.
- 🚀 **Zero-Build Vercel Ready**: Built using pure HTML5, Vanilla CSS3, and ES6 JavaScript for fast, zero-dependency hosting.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, Glassmorphic UI, Dark/Light Themes), ES6 JavaScript.
- **APIs**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`), LocalStorage API, Web Share API.
- **Typography & Icons**: Google Fonts (*Outfit* & *Inter*), Lucide SVG Icons.
- **Hosting**: Vercel Static Hosting / GitHub Pages.

---

## 🚀 Local Quickstart

### Method A: Direct Open
Simply double-click `index.html` to open the application in Google Chrome or Microsoft Edge.

### Method B: Local Server (Python)
```bash
# Clone the repository
git clone https://github.com/HarishJalani05/Daily-Engaging-Session.git

# Navigate to project directory
cd Daily-Engaging-Session

# Start local server
python -m http.server 8080
```
Open `http://localhost:8080` in your web browser.

---

## 📤 How to Deploy Updates to GitHub & Vercel

Run this 1-liner command in your terminal to commit and push changes:

```powershell
git add .; git commit -m "Update classroom features"; git push origin main
```

Vercel will automatically detect the push to GitHub and deploy the updated site in seconds!

---

## 📄 License
MIT License - Free to use and customize for teachers and educational institutions.
