/**
 * Daily Classroom WhatsApp Generator - Main Application Logic
 * Pure ES6 JavaScript - Zero Dependencies - Vercel Ready
 */

// Global App State
const DEFAULT_SUBJECTS = [
  "Maths Notebook",
  "General Awareness",
  "Art & Craft Book",
  "English Notebook",
  "Hindi Notebook",
  "EVS"
];

let subjects = [];
let classworkData = {};
let homeworkData = {};
let activeInputField = null;
let currentTheme = 'light';

// Web Speech Objects
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let activeMicBtn = null;
let isWizardRunning = false;
let wizardIndex = 0;
let wizardQueue = [];

// DOM Elements
const dateInput = document.getElementById('dateInput');
const dayInput = document.getElementById('dayInput');
const classworkContainer = document.getElementById('classworkContainer');
const homeworkContainer = document.getElementById('homeworkContainer');
const specialNotesInput = document.getElementById('specialNotesInput');
const whatsappFormattedText = document.getElementById('whatsappFormattedText');
const previewTimestamp = document.getElementById('previewTimestamp');

// Navigation & Modals
const guidedVoiceBtn = document.getElementById('guidedVoiceBtn');
const startWizardBannerBtn = document.getElementById('startWizardBannerBtn');
const voiceModal = document.getElementById('voiceModal');
const closeVoiceModalBtn = document.getElementById('closeVoiceModalBtn');
const wizardSubjectTitle = document.getElementById('wizardSubjectTitle');
const wizardFieldType = document.getElementById('wizardFieldType');
const wizardStepCount = document.getElementById('wizardStepCount');
const wizardStatusHeading = document.getElementById('wizardStatusHeading');
const wizardSpeechTranscript = document.getElementById('wizardSpeechTranscript');
const wizardMicCircle = document.getElementById('wizardMicCircle');
const wizardMicIcon = document.getElementById('wizardMicIcon');
const wizardSkipBtn = document.getElementById('wizardSkipBtn');
const wizardNextBtn = document.getElementById('wizardNextBtn');

// Manage Subjects Modal
const manageSubjectsBtn = document.getElementById('manageSubjectsBtn');
const subjectsModal = document.getElementById('subjectsModal');
const closeSubjectsModalBtn = document.getElementById('closeSubjectsModalBtn');
const manageSubjectsList = document.getElementById('manageSubjectsList');
const newSubjectInput = document.getElementById('newSubjectInput');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const restoreDefaultSubjectsBtn = document.getElementById('restoreDefaultSubjectsBtn');
const saveSubjectsDoneBtn = document.getElementById('saveSubjectsDoneBtn');

// Actions
const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
const copyTextBtn = document.getElementById('copyTextBtn');
const previewVoiceReadBtn = document.getElementById('previewVoiceReadBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const todayBtn = document.getElementById('todayBtn');
const tomorrowBtn = document.getElementById('tomorrowBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

// Hindi Keyboard
const toggleHindiKbdBtn = document.getElementById('toggleHindiKbdBtn');
const hindiKeyboardBody = document.getElementById('hindiKeyboardBody');
const hindiKbdToggleText = document.getElementById('hindiKbdToggleText');
const hindiKbdIcon = document.getElementById('hindiKbdIcon');

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadSavedSubjects();
  initializeDateAndDay();
  renderSubjectFields();
  setupSpeechRecognition();
  setupHindiKeyboard();
  setupEventListeners();
  updateWhatsAppPreview();
});

/* ==========================================================================
   Subjects & State Management
   ========================================================================== */
function loadSavedSubjects() {
  const saved = localStorage.getItem('class_engage_subjects');
  if (saved) {
    try {
      subjects = JSON.parse(saved);
    } catch (e) {
      subjects = [...DEFAULT_SUBJECTS];
    }
  } else {
    subjects = [...DEFAULT_SUBJECTS];
  }
}

function saveSubjects() {
  localStorage.setItem('class_engage_subjects', JSON.stringify(subjects));
}

function initializeDateAndDay(dateObj = new Date()) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  
  // Format for HTML5 <input type="date"> (YYYY-MM-DD)
  dateInput.value = `${yyyy}-${mm}-${dd}`;
  dayInput.value = dayNames[dateObj.getDay()];
  
  // Set preview timestamp
  const hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  previewTimestamp.innerText = `Today at ${formattedHours}:${minutes} ${ampm}`;
}

/* ==========================================================================
   Render Form Dynamic Fields
   ========================================================================== */
function renderSubjectFields() {
  classworkContainer.innerHTML = '';
  homeworkContainer.innerHTML = '';

  subjects.forEach((subj, idx) => {
    const fieldId = `subj_${idx}`;

    if (classworkData[fieldId] === undefined) {
      classworkData[fieldId] = "";
    }
    if (homeworkData[fieldId] === undefined) {
      homeworkData[fieldId] = "";
    }

    // Render Classwork Row
    const cwRow = createSubjectRow(subj, fieldId, 'cw', classworkData[fieldId]);
    classworkContainer.appendChild(cwRow);

    // Render Homework Row
    const hwRow = createSubjectRow(subj, fieldId, 'hw', homeworkData[fieldId]);
    homeworkContainer.appendChild(hwRow);
  });

  // Re-bind icon renders
  if (window.lucide) {
    lucide.createIcons();
  }
}

function createSubjectRow(subjectName, fieldId, type, initialValue) {
  const row = document.createElement('div');
  row.className = 'subject-row';

  const label = document.createElement('div');
  label.className = 'subject-label';
  label.innerHTML = `<i data-lucide="book" style="width: 16px; height: 16px;"></i> ${subjectName}:`;

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'input-with-mic';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = `${type}_${fieldId}`;
  input.placeholder = `Enter ${type === 'cw' ? 'classwork' : 'homework'} topic...`;
  input.value = initialValue || '';

  // Listeners for active tracking and live preview updates
  input.addEventListener('focus', () => { activeInputField = input; });
  input.addEventListener('input', (e) => {
    if (type === 'cw') classworkData[fieldId] = e.target.value;
    else homeworkData[fieldId] = e.target.value;
    updateWhatsAppPreview();
  });

  const micBtn = document.createElement('button');
  micBtn.className = 'mic-btn';
  micBtn.title = 'Speak topic';
  micBtn.innerHTML = `<i data-lucide="mic" style="width: 16px; height: 16px;"></i>`;
  micBtn.addEventListener('click', () => triggerIndividualMic(input, micBtn));

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(micBtn);

  row.appendChild(label);
  row.appendChild(inputWrapper);

  return row;
}

/* ==========================================================================
   WhatsApp Formatting Engine
   ========================================================================== */
function updateWhatsAppPreview() {
  const rawDate = dateInput.value.trim();
  let dateFormatted = rawDate;
  
  // Format YYYY-MM-DD to DD/MM/YYYY for WhatsApp output
  if (rawDate && rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const dayVal = dayInput.value.trim();
  const specialNotesVal = specialNotesInput.value.trim();

  let message = `*Today's Engaging Session in the classroom:*\n${dateFormatted}\n${dayVal}\n \n`;

  // Filter Classwork items with content
  const activeClasswork = [];
  subjects.forEach((subj, idx) => {
    const val = (classworkData[`subj_${idx}`] || '').trim();
    if (val) {
      activeClasswork.push(`* ${subj}: ${val}`);
    }
  });

  if (activeClasswork.length > 0) {
    message += `*Classwork:*\n${activeClasswork.join('\n')}\n\n`;
  }

  // Filter Homework items with content
  const activeHomework = [];
  subjects.forEach((subj, idx) => {
    const val = (homeworkData[`subj_${idx}`] || '').trim();
    if (val) {
      activeHomework.push(`* ${subj}: ${val}`);
    }
  });

  if (activeHomework.length > 0) {
    message += `*Homework:*\n${activeHomework.join('\n')}\n\n`;
  }

  // Add Special Notes / Dictations / Celebrations if present
  if (specialNotesVal) {
    message += `*${specialNotesVal}*`;
  }

  whatsappFormattedText.innerText = message.trim();
}

/* ==========================================================================
   Voice Dictation & Speech Recognition
   ========================================================================== */
function setupSpeechRecognition() {
  if (!SpeechRecognition) {
    console.warn("Speech Recognition API not supported in this browser.");
    showToast("Voice dictation is supported best in Google Chrome or Microsoft Edge.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-IN'; // English Speech-to-Text (Indian / Global English)

  recognition.onstart = () => {
    if (activeMicBtn) activeMicBtn.classList.add('listening');
    if (isWizardRunning) {
      wizardMicCircle.classList.add('listening');
      wizardStatusHeading.innerText = "Listening to your voice...";
    }
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    
    transcript = transcript.trim();

    if (isWizardRunning) {
      wizardSpeechTranscript.innerText = `"${transcript}"`;
    } else if (activeInputField) {
      activeInputField.value = transcript;
      // Dispatch input event to update state
      activeInputField.dispatchEvent(new Event('input'));
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    stopMic();
    if (isWizardRunning) {
      wizardStatusHeading.innerText = "Didn't catch that. Click mic or Skip.";
    }
  };

  recognition.onend = () => {
    stopMic();

    if (isWizardRunning) {
      const recognizedText = wizardSpeechTranscript.innerText.replace(/"/g, '').trim();
      processWizardSpeechResult(recognizedText);
    }
  };
}

function triggerIndividualMic(inputElement, micBtn) {
  if (!recognition) {
    showToast("Speech Recognition not supported in this browser.");
    return;
  }

  if (activeMicBtn === micBtn) {
    recognition.stop();
    return;
  }

  stopMic();
  activeInputField = inputElement;
  activeMicBtn = micBtn;

  try {
    recognition.start();
    showToast("Listening... Speak now!");
  } catch (e) {
    console.error(e);
  }
}

function stopMic() {
  if (activeMicBtn) {
    activeMicBtn.classList.remove('listening');
    activeMicBtn = null;
  }
  if (isWizardRunning) {
    wizardMicCircle.classList.remove('listening');
  }
}

/* Check if teacher said "Kuch nahi", "Skip", or "Nothing" */
function isKuchNahiPhrase(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  const skipPhrases = [
    'kuch nahi', 'kuch nhi', 'kuchh nahi', 'kuch naya nahi',
    'nothing', 'skip', 'na', 'no', 'none', 'kuch nahi hai',
    'kuchh nhi', 'kuch nai'
  ];
  return skipPhrases.some(phrase => lower.includes(phrase));
}

/* ==========================================================================
   Guided Voice Assistant Wizard Logic
   ========================================================================== */
function startGuidedVoiceWizard() {
  if (!SpeechRecognition) {
    showToast("Speech Recognition required for Guided Voice Mode.");
    return;
  }

  wizardQueue = [];
  subjects.forEach((subj, idx) => {
    const fieldId = `subj_${idx}`;
    wizardQueue.push({ subj, fieldId, type: 'cw', label: `${subj} Classwork` });
  });
  subjects.forEach((subj, idx) => {
    const fieldId = `subj_${idx}`;
    wizardQueue.push({ subj, fieldId, type: 'hw', label: `${subj} Homework` });
  });

  wizardIndex = 0;
  isWizardRunning = true;
  voiceModal.classList.remove('hidden');
  runWizardStep();
}

function runWizardStep() {
  if (wizardIndex >= wizardQueue.length) {
    finishWizard();
    return;
  }

  const step = wizardQueue[wizardIndex];
  wizardStepCount.innerText = `Step ${wizardIndex + 1} of ${wizardQueue.length}`;
  wizardSubjectTitle.innerText = step.subj;
  wizardFieldType.innerText = step.type === 'cw' ? 'Classwork Topic' : 'Homework Topic';
  wizardStatusHeading.innerText = 'Prompting Subject...';
  wizardSpeechTranscript.innerText = 'Listening for your update...';

  // Use Speech Synthesis to read out question prompt
  speakPrompt(`What is for ${step.subj} ${step.type === 'cw' ? 'Classwork' : 'Homework'}?`, () => {
    wizardStatusHeading.innerText = 'Listening... Speak now!';
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  });
}

function processWizardSpeechResult(text) {
  if (!isWizardRunning) return;

  const currentStep = wizardQueue[wizardIndex];
  const inputEl = document.getElementById(`${currentStep.type}_${currentStep.fieldId}`);

  if (isKuchNahiPhrase(text)) {
    if (inputEl) {
      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
    }
    showToast(`Skipped ${currentStep.subj} (${currentStep.type.toUpperCase()})`);
  } else {
    if (inputEl) {
      inputEl.value = text;
      inputEl.dispatchEvent(new Event('input'));
    }
    showToast(`Saved for ${currentStep.subj}`);
  }

  wizardIndex++;
  setTimeout(() => {
    if (isWizardRunning) runWizardStep();
  }, 700);
}

function finishWizard() {
  isWizardRunning = false;
  voiceModal.classList.add('hidden');
  showToast("🎉 Guided Voice Updates Complete!");
  speakPrompt("Voice session complete. Your WhatsApp message is ready!");
}

function speakPrompt(text, callback) {
  if (!('speechSynthesis' in window)) {
    if (callback) callback();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 1.0;

  utterance.onend = () => {
    if (callback) callback();
  };
  utterance.onerror = () => {
    if (callback) callback();
  };

  window.speechSynthesis.speak(utterance);
}

/* ==========================================================================
   Hindi Virtual Keyboard Insertion
   ========================================================================== */
function setupHindiKeyboard() {
  document.querySelectorAll('.hindi-key').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const insertText = btn.getAttribute('data-insert');
      insertTextAtCursor(insertText);
    });
  });
}

function insertTextAtCursor(text) {
  if (!activeInputField) {
    // Default to special notes input if none focused
    activeInputField = specialNotesInput;
  }

  const el = activeInputField;
  const start = el.selectionStart || 0;
  const end = el.selectionEnd || 0;
  const val = el.value;

  // Insert space if appending
  const spaceBefore = (start > 0 && val[start - 1] !== ' ') ? ' ' : '';
  const newContent = val.substring(0, start) + spaceBefore + text + val.substring(end);
  
  el.value = newContent;
  el.selectionStart = el.selectionEnd = start + spaceBefore.length + text.length;
  el.focus();

  // Trigger input event
  el.dispatchEvent(new Event('input'));
  showToast(`Inserted: ${text}`);
}

/* ==========================================================================
   UI Event Listeners & Modals
   ========================================================================== */
function setupEventListeners() {
  // Input changes & Calendar Date Selection Event
  dateInput.addEventListener('change', () => {
    if (dateInput.value) {
      const selectedDate = new Date(dateInput.value + 'T00:00:00');
      if (!isNaN(selectedDate.getTime())) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayInput.value = dayNames[selectedDate.getDay()];
      }
    }
    updateWhatsAppPreview();
  });
  dateInput.addEventListener('input', updateWhatsAppPreview);
  dayInput.addEventListener('input', updateWhatsAppPreview);
  specialNotesInput.addEventListener('input', updateWhatsAppPreview);
  specialNotesInput.addEventListener('focus', () => { activeInputField = specialNotesInput; });

  // Special Notes Mic Button
  const specialMicBtn = document.querySelector('.text-area-mic');
  if (specialMicBtn) {
    specialMicBtn.addEventListener('click', () => triggerIndividualMic(specialNotesInput, specialMicBtn));
  }

  // Quick Preset Chips
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-insert');
      specialNotesInput.value = preset;
      specialNotesInput.dispatchEvent(new Event('input'));
      showToast("Added preset note!");
    });
  });

  // Date Quick Chips
  todayBtn.addEventListener('click', () => {
    initializeDateAndDay(new Date());
    updateWhatsAppPreview();
    todayBtn.classList.add('active');
    tomorrowBtn.classList.remove('active');
  });

  tomorrowBtn.addEventListener('click', () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    initializeDateAndDay(tom);
    updateWhatsAppPreview();
    tomorrowBtn.classList.add('active');
    todayBtn.classList.remove('active');
  });

  resetFormBtn.addEventListener('click', () => {
    if (confirm("Reset today's classwork and homework entries?")) {
      subjects.forEach((_, idx) => {
        classworkData[`subj_${idx}`] = '';
        homeworkData[`subj_${idx}`] = '';
      });
      specialNotesInput.value = '';
      renderSubjectFields();
      updateWhatsAppPreview();
      showToast("Form cleared!");
    }
  });

  // Guided Voice Modal Triggers
  guidedVoiceBtn.addEventListener('click', startGuidedVoiceWizard);
  startWizardBannerBtn.addEventListener('click', startGuidedVoiceWizard);
  closeVoiceModalBtn.addEventListener('click', () => {
    isWizardRunning = false;
    if (recognition) recognition.stop();
    window.speechSynthesis.cancel();
    voiceModal.classList.add('hidden');
  });

  wizardSkipBtn.addEventListener('click', () => {
    if (recognition) recognition.stop();
    processWizardSpeechResult('kuch nahi');
  });

  wizardNextBtn.addEventListener('click', () => {
    if (recognition) recognition.stop();
  });

  // Hindi Keyboard Accordion Toggle
  toggleHindiKbdBtn.addEventListener('click', () => {
    hindiKeyboardBody.classList.toggle('collapsed');
    const isCollapsed = hindiKeyboardBody.classList.contains('collapsed');
    hindiKbdToggleText.innerText = isCollapsed ? 'Show Keyboard' : 'Hide Keyboard';
    hindiKbdIcon.setAttribute('data-lucide', isCollapsed ? 'chevron-down' : 'chevron-up');
    if (window.lucide) lucide.createIcons();
  });

  // WhatsApp Share Action
  shareWhatsappBtn.addEventListener('click', () => {
    const text = whatsappFormattedText.innerText;
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    
    // Attempt Web Share API first on mobile devices
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({
        title: "Daily Classroom Update",
        text: text
      }).catch(() => {
        window.open(whatsappUrl, '_blank');
      });
    } else {
      window.open(whatsappUrl, '_blank');
    }
  });

  // Copy Text Action
  copyTextBtn.addEventListener('click', () => {
    const text = whatsappFormattedText.innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Formatted message copied to clipboard!");
    }).catch(err => {
      showToast("Copy failed, please copy manually.");
    });
  });

  // Read Aloud Preview Text
  previewVoiceReadBtn.addEventListener('click', () => {
    const text = whatsappFormattedText.innerText.replace(/\*/g, '');
    speakPrompt(text);
  });

  // Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeIcon.setAttribute('data-lucide', currentTheme === 'light' ? 'moon' : 'sun');
    if (window.lucide) lucide.createIcons();
  });

  // Manage Subjects Modal Logic
  manageSubjectsBtn.addEventListener('click', openSubjectsModal);
  closeSubjectsModalBtn.addEventListener('click', () => subjectsModal.classList.add('hidden'));
  saveSubjectsDoneBtn.addEventListener('click', () => subjectsModal.classList.add('hidden'));

  addSubjectBtn.addEventListener('click', () => {
    const val = newSubjectInput.value.trim();
    if (val) {
      subjects.push(val);
      saveSubjects();
      newSubjectInput.value = '';
      renderManageSubjectsList();
      renderSubjectFields();
      updateWhatsAppPreview();
      showToast(`Added subject: ${val}`);
    }
  });

  restoreDefaultSubjectsBtn.addEventListener('click', () => {
    if (confirm("Restore default subjects list?")) {
      subjects = [...DEFAULT_SUBJECTS];
      saveSubjects();
      renderManageSubjectsList();
      renderSubjectFields();
      updateWhatsAppPreview();
      showToast("Restored default subjects.");
    }
  });
}

/* Manage Subjects Rendering */
function openSubjectsModal() {
  renderManageSubjectsList();
  subjectsModal.classList.remove('hidden');
}

function renderManageSubjectsList() {
  manageSubjectsList.innerHTML = '';
  subjects.forEach((subj, idx) => {
    const item = document.createElement('div');
    item.className = 'subject-manage-item';
    item.innerHTML = `
      <span>${subj}</span>
      <button class="btn-link text-danger" onclick="deleteSubject(${idx})">
        <i data-lucide="trash-2" style="width: 16px;"></i> Delete
      </button>
    `;
    manageSubjectsList.appendChild(item);
  });
  if (window.lucide) lucide.createIcons();
}

window.deleteSubject = function(idx) {
  if (subjects.length <= 1) {
    showToast("Must have at least one subject.");
    return;
  }
  const removed = subjects.splice(idx, 1);
  saveSubjects();
  renderManageSubjectsList();
  renderSubjectFields();
  updateWhatsAppPreview();
  showToast(`Deleted ${removed[0]}`);
};

/* Toast Notification Utility */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i data-lucide="check-circle-2" style="width: 18px;"></i> ${message}`;
  
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}
