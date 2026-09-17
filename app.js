/**
 * Daily Classroom WhatsApp Generator - Main Application Logic
 * Pure ES6 JavaScript - Zero Dependencies - Vercel Ready
 */

// Global App State
const DEFAULT_SUBJECTS = [
  "Maths Notebook",
  "Maths Textbook",
  "General Awareness",
  "Art & Craft Book",
  "English Notebook",
  "English Textbook",
  "Hindi Notebook",
  "Hindi Textbook",
  "Rhymes",
  "Reader Book",
  "Poem",
  "Oral"
];

let subjects = [];
let classworkData = {};
let homeworkData = {};
let activeInputField = null;
let existingInputValue = '';
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
const celebrationsInput = document.getElementById('celebrationsInput');
const dictationsExamsInput = document.getElementById('dictationsExamsInput');
const whatsappPreviewContainer = document.getElementById('whatsappPreviewContainer');
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
const yesterdayBtn = document.getElementById('yesterdayBtn');
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

  const inputActions = document.createElement('div');
  inputActions.className = 'input-actions-inside';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-field-btn';
  clearBtn.title = `Clear ${subjectName} ${type === 'cw' ? 'classwork' : 'homework'}`;
  clearBtn.innerHTML = `<i data-lucide="x" style="width: 14px; height: 14px;"></i>`;
  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    input.value = '';
    if (type === 'cw') classworkData[fieldId] = '';
    else homeworkData[fieldId] = '';
    updateWhatsAppPreview();
    showToast(`Cleared ${subjectName}`);
  });

  const micBtn = document.createElement('button');
  micBtn.className = 'mic-btn';
  micBtn.title = 'Speak topic';
  micBtn.innerHTML = `<i data-lucide="mic" style="width: 14px; height: 14px;"></i>`;
  micBtn.addEventListener('click', (e) => {
    e.preventDefault();
    triggerIndividualMic(input, micBtn);
  });

  inputActions.appendChild(clearBtn);
  inputActions.appendChild(micBtn);

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(inputActions);

  row.appendChild(label);
  row.appendChild(inputWrapper);

  return row;
}

function getFormattedWhatsAppString() {
  const rawDate = dateInput.value.trim();
  let dateFormatted = rawDate;

  if (rawDate && rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const dayVal = dayInput.value.trim();
  const celebrationsVal = celebrationsInput ? celebrationsInput.value.trim() : '';
  const dictationsExamsVal = dictationsExamsInput ? dictationsExamsInput.value.trim() : '';

  let message = `*Today's Engaging Session in the classroom:*\n${dateFormatted}\n${dayVal}\n \n`;

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

  if (celebrationsVal) {
    message += `*${celebrationsVal}*`;
  }

  if (dictationsExamsVal) {
    if (celebrationsVal) {
      message += `\n\n*${dictationsExamsVal}*`; // One line gap between celebrations and dictation/exams
    } else {
      message += `*${dictationsExamsVal}*`;
    }
  }

  return message.trim();
}

function updateWhatsAppPreview() {
  const container = document.getElementById('whatsappPreviewContainer');
  if (!container) return;

  container.innerHTML = '';

  const rawDate = dateInput.value.trim();
  let dateFormatted = rawDate;
  if (rawDate && rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  const dayVal = dayInput.value.trim();
  const celebrationsVal = celebrationsInput ? celebrationsInput.value.trim() : '';
  const dictationsExamsVal = dictationsExamsInput ? dictationsExamsInput.value.trim() : '';

  // Title Line
  const titleDiv = document.createElement('div');
  titleDiv.className = 'preview-title-line';
  titleDiv.innerText = "*Today's Engaging Session in the classroom:*";
  container.appendChild(titleDiv);

  // Date & Day Line
  const dateDiv = document.createElement('div');
  dateDiv.className = 'preview-date-line';
  dateDiv.innerText = `${dateFormatted}\n${dayVal}`;
  container.appendChild(dateDiv);

  // Classwork Section
  const hasClasswork = subjects.some((_, idx) => (classworkData[`subj_${idx}`] || '').trim());
  if (hasClasswork) {
    const cwHeader = document.createElement('div');
    cwHeader.className = 'preview-section-title';
    cwHeader.innerText = '*Classwork:*';
    container.appendChild(cwHeader);

    subjects.forEach((subj, idx) => {
      const fieldId = `subj_${idx}`;
      const val = (classworkData[fieldId] || '').trim();
      if (val) {
        const line = document.createElement('div');
        line.className = 'preview-subject-line';

        const textSpan = document.createElement('span');
        textSpan.className = 'preview-subject-text';
        textSpan.innerText = `* ${subj}: ${val}`;

        const delBtn = document.createElement('button');
        delBtn.className = 'preview-line-delete-btn';
        delBtn.title = `Delete ${subj} Classwork from preview`;
        delBtn.innerHTML = `<i data-lucide="x" style="width: 13px; height: 13px;"></i>`;
        delBtn.addEventListener('click', () => {
          classworkData[fieldId] = '';
          const inputEl = document.getElementById(`cw_${fieldId}`);
          if (inputEl) inputEl.value = '';
          updateWhatsAppPreview();
          showToast(`Deleted ${subj} Classwork`);
        });

        line.appendChild(textSpan);
        line.appendChild(delBtn);
        container.appendChild(line);
      }
    });
  }

  // Homework Section
  const hasHomework = subjects.some((_, idx) => (homeworkData[`subj_${idx}`] || '').trim());
  if (hasHomework) {
    const hwHeader = document.createElement('div');
    hwHeader.className = 'preview-section-title';
    hwHeader.innerText = '*Homework:*';
    container.appendChild(hwHeader);

    subjects.forEach((subj, idx) => {
      const fieldId = `subj_${idx}`;
      const val = (homeworkData[fieldId] || '').trim();
      if (val) {
        const line = document.createElement('div');
        line.className = 'preview-subject-line';

        const textSpan = document.createElement('span');
        textSpan.className = 'preview-subject-text';
        textSpan.innerText = `* ${subj}: ${val}`;

        const delBtn = document.createElement('button');
        delBtn.className = 'preview-line-delete-btn';
        delBtn.title = `Delete ${subj} Homework from preview`;
        delBtn.innerHTML = `<i data-lucide="x" style="width: 13px; height: 13px;"></i>`;
        delBtn.addEventListener('click', () => {
          homeworkData[fieldId] = '';
          const inputEl = document.getElementById(`hw_${fieldId}`);
          if (inputEl) inputEl.value = '';
          updateWhatsAppPreview();
          showToast(`Deleted ${subj} Homework`);
        });

        line.appendChild(textSpan);
        line.appendChild(delBtn);
        container.appendChild(line);
      }
    });
  }

  // Special Celebrations & Events Section
  if (celebrationsVal) {
    const notesDiv = document.createElement('div');
    notesDiv.className = 'preview-subject-line';
    notesDiv.style.marginTop = '0.5rem';

    const textSpan = document.createElement('span');
    textSpan.className = 'preview-subject-text';
    textSpan.innerText = `*${celebrationsVal}*`;

    const delBtn = document.createElement('button');
    delBtn.className = 'preview-line-delete-btn';
    delBtn.title = 'Delete celebration from preview';
    delBtn.innerHTML = `<i data-lucide="x" style="width: 13px; height: 13px;"></i>`;
    delBtn.addEventListener('click', () => {
      celebrationsInput.value = '';
      updateWhatsAppPreview();
      showToast('Deleted celebration');
    });

    notesDiv.appendChild(textSpan);
    notesDiv.appendChild(delBtn);
    container.appendChild(notesDiv);
  }

  // Dictation Notices & Upcoming Exams Section (with gap if celebrations present)
  if (dictationsExamsVal) {
    const notesDiv = document.createElement('div');
    notesDiv.className = 'preview-subject-line';
    notesDiv.style.marginTop = celebrationsVal ? '1rem' : '0.5rem';

    const textSpan = document.createElement('span');
    textSpan.className = 'preview-subject-text';
    textSpan.innerText = `*${dictationsExamsVal}*`;

    const delBtn = document.createElement('button');
    delBtn.className = 'preview-line-delete-btn';
    delBtn.title = 'Delete dictation/exam notice from preview';
    delBtn.innerHTML = `<i data-lucide="x" style="width: 13px; height: 13px;"></i>`;
    delBtn.addEventListener('click', () => {
      dictationsExamsInput.value = '';
      updateWhatsAppPreview();
      showToast('Deleted dictation/exam notice');
    });

    notesDiv.appendChild(textSpan);
    notesDiv.appendChild(delBtn);
    container.appendChild(notesDiv);
  }

  if (window.lucide) {
    lucide.createIcons();
  }
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
      const newFormattedText = formatDictatedText(transcript);
      if (existingInputValue) {
        let appendText = newFormattedText;
        // Don't force uppercase if appending after existing text
        if (appendText.length > 0 && /^[A-Z]/.test(appendText) && !/^\d/.test(appendText)) {
          appendText = appendText.charAt(0).toLowerCase() + appendText.slice(1);
        }
        activeInputField.value = `${existingInputValue} ${appendText}`;
      } else {
        activeInputField.value = newFormattedText;
      }
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
  existingInputValue = inputElement ? inputElement.value.trim() : '';

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

/* Format dictated speech into clean classroom range notes (e.g. '1 se 70', '1 to 70', '1270' -> 'Numbers 1-70') */
function formatDictatedText(text) {
  if (!text) return text;

  let formatted = text.trim();

  // 1. Convert "se", "say", "to", "2" between two numbers into a dash (-)
  // e.g. "1 se 70", "1 to 70", "1 say 70" -> "1-70"
  formatted = formatted.replace(/(\d+)\s*(?:to|se|say|2)\s*(\d+)/gi, '$1-$2');

  // 2. Handle Speech API misinterpreting "1 to XX" as "12XX" (e.g. 1270 -> 1-70, 1250 -> 1-50, 12100 -> 1-100)
  formatted = formatted.replace(/\b12(\d{1,3})\b/g, (match, p1) => {
    const val = parseInt(p1, 10);
    if (val >= 5 && val <= 100) {
      return `1-${val}`;
    }
    return match;
  });

  // 3. Handle cases where speech engine turns "1 to 70" into "1 270" or "1 2 70"
  formatted = formatted.replace(/\b(\d+)\s+2?(\d{2,3})\b/g, (match, p1, p2) => {
    const num = parseInt(p2, 10);
    if (num >= 10 && num <= 100 && parseInt(p1, 10) < num) {
      return `${p1}-${num}`;
    }
    return match;
  });

  // 4. Format spoken variations of 'akshar' / 'aksar' / 'akshara' / Devanagari 'अक्षर' to English spelling 'Akshar'
  formatted = formatted.replace(/\b(?:akshar|aksar|akshara|अक्षर)\b/gi, 'Akshar');
  formatted = formatted.replace(/\b(?:akshars|aksars|aksharas)\b/gi, 'Akshars');
  formatted = formatted.replace(/\b(?:vyanjan|vyanjana)\b/gi, 'Vyanjan');
  formatted = formatted.replace(/\b(?:swar|swara)\b/gi, 'Swar');

  // 5. Capitalize first letter of string
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return formatted;
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
      const formatted = formatDictatedText(text);
      const prevVal = inputEl.value.trim();
      if (prevVal) {
        let appendText = formatted;
        if (appendText.length > 0 && /^[A-Z]/.test(appendText) && !/^\d/.test(appendText)) {
          appendText = appendText.charAt(0).toLowerCase() + appendText.slice(1);
        }
        inputEl.value = `${prevVal} ${appendText}`;
      } else {
        inputEl.value = formatted;
      }
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
      e.stopPropagation();
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

  // Insert space if appending word, but not for punctuation marks
  const isPunctuation = /^[-&,.।:;()?!/"'+*]$/.test(text);
  const spaceBefore = (!isPunctuation && start > 0 && val[start - 1] !== ' ') ? ' ' : '';
  const newContent = val.substring(0, start) + spaceBefore + text + val.substring(end);

  // Preserve current scroll position before focus
  const currentScrollY = window.scrollY;

  el.value = newContent;
  el.selectionStart = el.selectionEnd = start + spaceBefore.length + text.length;

  // Focus without triggering smooth or jump scroll
  if (typeof el.focus === 'function') {
    try {
      el.focus({ preventScroll: true });
    } catch (err) {
      el.focus();
    }
  }

  // Restore scroll position to prevent browser scroll jump
  window.scrollTo(0, currentScrollY);

  // Trigger input event
  el.dispatchEvent(new Event('input'));
  showToast(`Inserted: ${text}`);
}

/* ==========================================================================
   UI Event Listeners & Modals
   ========================================================================== */
function setupEventListeners() {
  const dateInputEl = document.getElementById('dateInput');
  const dayInputEl = document.getElementById('dayInput');
  const celebrationsInputEl = document.getElementById('celebrationsInput');
  const dictationsExamsInputEl = document.getElementById('dictationsExamsInput');

  if (dateInputEl) {
    dateInputEl.addEventListener('change', () => {
      if (dateInputEl.value) {
        const selectedDate = new Date(dateInputEl.value + 'T00:00:00');
        if (!isNaN(selectedDate.getTime())) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          if (dayInputEl) dayInputEl.value = dayNames[selectedDate.getDay()];
        }
      }
      updateWhatsAppPreview();
    });
    dateInputEl.addEventListener('input', updateWhatsAppPreview);
  }

  if (dayInputEl) {
    dayInputEl.addEventListener('input', updateWhatsAppPreview);
  }

  if (celebrationsInputEl) {
    celebrationsInputEl.addEventListener('input', updateWhatsAppPreview);
    celebrationsInputEl.addEventListener('focus', () => { activeInputField = celebrationsInputEl; });
  }

  if (dictationsExamsInputEl) {
    dictationsExamsInputEl.addEventListener('input', updateWhatsAppPreview);
    dictationsExamsInputEl.addEventListener('focus', () => { activeInputField = dictationsExamsInputEl; });
  }

  // Clear buttons
  const clearCelebrationsBtnEl = document.getElementById('clearCelebrationsBtn');
  if (clearCelebrationsBtnEl) {
    clearCelebrationsBtnEl.addEventListener('click', () => {
      if (celebrationsInputEl) celebrationsInputEl.value = '';
      updateWhatsAppPreview();
      showToast('Cleared celebration entry');
    });
  }

  const clearDictationsExamsBtnEl = document.getElementById('clearDictationsExamsBtn');
  if (clearDictationsExamsBtnEl) {
    clearDictationsExamsBtnEl.addEventListener('click', () => {
      if (dictationsExamsInputEl) dictationsExamsInputEl.value = '';
      updateWhatsAppPreview();
      showToast('Cleared dictation/exam notice');
    });
  }

  // Mic buttons
  document.querySelectorAll('.text-area-mic').forEach(micBtn => {
    micBtn.addEventListener('click', () => {
      const targetId = micBtn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        triggerIndividualMic(targetInput, micBtn);
      }
    });
  });

  // Preset Chips
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-insert');
      const targetId = btn.getAttribute('data-target') || 'celebrationsInput';
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        targetInput.value = preset;
        targetInput.dispatchEvent(new Event('input'));
        showToast("Added preset note!");
      }
    });
  });

  // Date Quick Chips
  const setQuickDate = (dateObj, activeBtn) => {
    initializeDateAndDay(dateObj);
    updateWhatsAppPreview();
    const yesterdayBtnEl = document.getElementById('yesterdayBtn');
    const todayBtnEl = document.getElementById('todayBtn');
    const tomorrowBtnEl = document.getElementById('tomorrowBtn');
    [yesterdayBtnEl, todayBtnEl, tomorrowBtnEl].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
  };

  const yesterdayBtnEl = document.getElementById('yesterdayBtn');
  if (yesterdayBtnEl) {
    yesterdayBtnEl.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      setQuickDate(d, yesterdayBtnEl);
      showToast("Set date to Yesterday");
    });
  }

  const todayBtnEl = document.getElementById('todayBtn');
  if (todayBtnEl) {
    todayBtnEl.addEventListener('click', () => {
      setQuickDate(new Date(), todayBtnEl);
      showToast("Set date to Today");
    });
  }

  const tomorrowBtnEl = document.getElementById('tomorrowBtn');
  if (tomorrowBtnEl) {
    tomorrowBtnEl.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setQuickDate(d, tomorrowBtnEl);
      showToast("Set date to Tomorrow");
    });
  }

  const resetFormBtnEl = document.getElementById('resetFormBtn');
  if (resetFormBtnEl) {
    resetFormBtnEl.addEventListener('click', () => {
      if (confirm("Reset today's classwork, homework, and announcement entries?")) {
        subjects.forEach((_, idx) => {
          classworkData[`subj_${idx}`] = '';
          homeworkData[`subj_${idx}`] = '';
        });
        if (celebrationsInputEl) celebrationsInputEl.value = '';
        if (dictationsExamsInputEl) dictationsExamsInputEl.value = '';
        renderSubjectFields();
        updateWhatsAppPreview();
        showToast("Form cleared!");
      }
    });
  }

  // Guided Voice Modal Triggers
  const guidedVoiceBtnEl = document.getElementById('guidedVoiceBtn');
  if (guidedVoiceBtnEl) guidedVoiceBtnEl.addEventListener('click', startGuidedVoiceWizard);

  const startWizardBannerBtnEl = document.getElementById('startWizardBannerBtn');
  if (startWizardBannerBtnEl) startWizardBannerBtnEl.addEventListener('click', startGuidedVoiceWizard);

  const closeVoiceModalBtnEl = document.getElementById('closeVoiceModalBtn');
  if (closeVoiceModalBtnEl) {
    closeVoiceModalBtnEl.addEventListener('click', () => {
      isWizardRunning = false;
      if (recognition) recognition.stop();
      window.speechSynthesis.cancel();
      const voiceModalEl = document.getElementById('voiceModal');
      if (voiceModalEl) voiceModalEl.classList.add('hidden');
    });
  }

  const wizardSkipBtnEl = document.getElementById('wizardSkipBtn');
  if (wizardSkipBtnEl) {
    wizardSkipBtnEl.addEventListener('click', () => {
      if (recognition) recognition.stop();
      processWizardSpeechResult('kuch nahi');
    });
  }

  const wizardNextBtnEl = document.getElementById('wizardNextBtn');
  if (wizardNextBtnEl) {
    wizardNextBtnEl.addEventListener('click', () => {
      if (recognition) recognition.stop();
    });
  }

  // Hindi Keyboard Accordion Toggle
  const toggleHindiKbdBtnEl = document.getElementById('toggleHindiKbdBtn');
  if (toggleHindiKbdBtnEl) {
    toggleHindiKbdBtnEl.addEventListener('click', () => {
      const hindiKeyboardBodyEl = document.getElementById('hindiKeyboardBody');
      const hindiKbdToggleTextEl = document.getElementById('hindiKbdToggleText');
      const hindiKbdIconEl = document.getElementById('hindiKbdIcon');

      if (hindiKeyboardBodyEl) hindiKeyboardBodyEl.classList.toggle('collapsed');
      const isCollapsed = hindiKeyboardBodyEl ? hindiKeyboardBodyEl.classList.contains('collapsed') : false;
      if (hindiKbdToggleTextEl) hindiKbdToggleTextEl.innerText = isCollapsed ? 'Show Keyboard' : 'Hide Keyboard';
      if (hindiKbdIconEl) hindiKbdIconEl.setAttribute('data-lucide', isCollapsed ? 'chevron-down' : 'chevron-up');
      if (window.lucide) lucide.createIcons();
    });
  }

  // WhatsApp Share Action
  const shareWhatsappBtnEl = document.getElementById('shareWhatsappBtn');
  if (shareWhatsappBtnEl) {
    shareWhatsappBtnEl.addEventListener('click', () => {
      const text = getFormattedWhatsAppString();
      const encoded = encodeURIComponent(text);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

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
  }

  // Copy Text Action
  const copyTextBtnEl = document.getElementById('copyTextBtn');
  if (copyTextBtnEl) {
    copyTextBtnEl.addEventListener('click', () => {
      const text = getFormattedWhatsAppString();
      navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Formatted message copied to clipboard!");
      }).catch(err => {
        showToast("Copy failed, please copy manually.");
      });
    });
  }

  // Read Aloud Preview Text
  const previewVoiceReadBtnEl = document.getElementById('previewVoiceReadBtn');
  if (previewVoiceReadBtnEl) {
    previewVoiceReadBtnEl.addEventListener('click', () => {
      const text = getFormattedWhatsAppString().replace(/\*/g, '');
      speakPrompt(text);
    });
  }
}

// Clear / Delete Preview Action
const clearPreviewAction = () => {
  subjects.forEach((_, idx) => {
    classworkData[`subj_${idx}`] = '';
    homeworkData[`subj_${idx}`] = '';
  });
  specialNotesInput.value = '';
  renderSubjectFields();
  updateWhatsAppPreview();
  showToast("🗑️ Cleared text entries!");
};

const clearPreviewBtn = document.getElementById('clearPreviewBtn');
if (clearPreviewBtn) clearPreviewBtn.addEventListener('click', clearPreviewAction);

const clearPreviewHeaderBtn = document.getElementById('clearPreviewHeaderBtn');
if (clearPreviewHeaderBtn) clearPreviewHeaderBtn.addEventListener('click', clearPreviewAction);

// Read Aloud Preview Text
if (previewVoiceReadBtn) {
  previewVoiceReadBtn.addEventListener('click', () => {
    const text = getFormattedWhatsAppString().replace(/\*/g, '');
    speakPrompt(text);
  });
}

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

window.deleteSubject = function (idx) {
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
