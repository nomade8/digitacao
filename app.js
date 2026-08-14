/**
 * DigitaFácil - Plataforma Didática de Prática de Digitação no Computador
 * Lógica e Interatividade em JavaScript
 */

// Lista de textos didáticos curtos para treino com caracteres do Português do Brasil (acentos, cedilha, til)
const PRACTICE_TEXTS = [
  "Aprender a digitar com rapidez e postura correta melhora seu foco, economiza tempo e abre muitas portas no mundo digital. Praticar um pouco todos os dias faz toda a diferença.",
  "Mantenha a coluna reta, os ombros relaxados e apoie os dedos sobre as teclas guia da linha central. Digitar sem olhar para o teclado é uma habilidade valiosa para seu futuro.",
  "A tecnologia e a internet conectam pessoas e facilitam o acesso à informação e ao conhecimento. Com dedicação e treino constante, seus dedos ganham velocidade e precisão natural.",
  "Atenção, dedicação e paciência são essenciais. Praticar palavras como ação, coração, lição, café e pontuação correta enriquece sua comunicação em língua portuguesa."
];

// Estado da Aplicação
const state = {
  currentTextIndex: 0,
  targetText: "",
  startTime: null,
  timerInterval: null,
  elapsedSeconds: 0,
  isTyping: false,
  isFinished: false,
  isSubmitted: false,
  soundEnabled: true,
  audioCtx: null,
  studentName: ""
};

// Elementos do DOM
const studentNameInput = document.getElementById("studentNameInput");
const studentDisplayTag = document.getElementById("studentDisplayTag");
const textSelect = document.getElementById("textSelect");
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const restartBtn = document.getElementById("restartBtn");

const timerDisplay = document.getElementById("timerDisplay");
const wpmDisplay = document.getElementById("wpmDisplay");
const accuracyDisplay = document.getElementById("accuracyDisplay");
const errorsDisplay = document.getElementById("errorsDisplay");
const progressDisplay = document.getElementById("progressDisplay");

const referenceDisplay = document.getElementById("referenceDisplay");
const typingArea = document.getElementById("typingArea");
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");

const totalCharsEl = document.getElementById("totalChars");
const totalWordsEl = document.getElementById("totalWords");

const submitBtn = document.getElementById("submitBtn");
const btnIcon = document.getElementById("btnIcon");
const btnLabel = document.getElementById("btnLabel");

// Modal Elements
const submissionModal = document.getElementById("submissionModal");
const modalStudentName = document.getElementById("modalStudentName");
const modalDesc = document.getElementById("modalDesc");
const modalWpm = document.getElementById("modalWpm");
const modalAccuracy = document.getElementById("modalAccuracy");
const modalTime = document.getElementById("modalTime");
const modalErrors = document.getElementById("modalErrors");
const modalFeedbackText = document.getElementById("modalFeedbackText");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalNextBtn = document.getElementById("modalNextBtn");

// ==========================================================================
// Web Audio API para Efeitos Sonoros Didáticos (Sem arquivos externos)
// ==========================================================================
function getAudioContext() {
  if (!state.audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
  }
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
  return state.audioCtx;
}

function playKeySound(isError = false) {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isError) {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450 + Math.random() * 80, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch (e) {
    // Silently fallback if audio context fails
  }
}

function playSuccessChime() {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde C Maior
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.08);
      osc.stop(ctx.currentTime + index * 0.08 + 0.4);
    });
  } catch (e) {}
}

// ==========================================================================
// Inicialização do Texto
// ==========================================================================
function loadPracticeText(index) {
  state.currentTextIndex = index;
  state.targetText = PRACTICE_TEXTS[index] || PRACTICE_TEXTS[0];
  
  // Renderizar caracteres individuais no container modelo
  referenceDisplay.innerHTML = "";
  for (let i = 0; i < state.targetText.length; i++) {
    const span = document.createElement("span");
    span.classList.add("char");
    span.textContent = state.targetText[i];
    if (i === 0) span.classList.add("current");
    referenceDisplay.appendChild(span);
  }

  // Contadores de informação
  totalCharsEl.textContent = state.targetText.length;
  totalWordsEl.textContent = state.targetText.trim().split(/\s+/).length;

  resetExerciseState();
}

function resetExerciseState() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.startTime = null;
  state.elapsedSeconds = 0;
  state.isTyping = false;
  state.isFinished = false;
  state.isSubmitted = false;

  typingArea.value = "";
  typingArea.disabled = false;
  
  timerDisplay.textContent = "00:00";
  wpmDisplay.textContent = "0";
  accuracyDisplay.textContent = "100";
  errorsDisplay.textContent = "0";
  progressDisplay.textContent = "0";

  statusBadge.classList.remove("active");
  statusText.textContent = "Aguardando digitação...";

  // Reset do botão de envio
  submitBtn.classList.remove("submitted");
  btnLabel.textContent = "Enviar Exercício";
  btnIcon.setAttribute("data-lucide", "send");
  lucide.createIcons();

  // Reset highlight do modelo
  const charElements = referenceDisplay.querySelectorAll(".char");
  charElements.forEach((span, idx) => {
    span.className = "char";
    if (idx === 0) span.classList.add("current");
  });

  typingArea.focus();
}

// ==========================================================================
// Cronômetro e Atualização das Estatísticas
// ==========================================================================
function startTimer() {
  if (state.timerInterval) return;
  state.startTime = Date.now() - (state.elapsedSeconds * 1000);
  
  state.timerInterval = setInterval(() => {
    state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const mins = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, "0");
    const secs = String(state.elapsedSeconds % 60).padStart(2, "0");
    timerDisplay.textContent = `${mins}:${secs}`;
    calculateStats();
  }, 500);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function calculateStats() {
  const typed = typingArea.value;
  const target = state.targetText;
  
  let correctCount = 0;
  let errorsCount = 0;

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) {
      correctCount++;
    } else {
      errorsCount++;
    }
  }

  // Precisão em %
  const accuracy = typed.length > 0 ? Math.max(0, Math.round((correctCount / typed.length) * 100)) : 100;
  accuracyDisplay.textContent = accuracy;
  errorsDisplay.textContent = errorsCount;

  // Palavras Por Minuto (PPM / WPM)
  // Padrão internacional: 5 caracteres equivalem a 1 palavra
  const minutes = Math.max(state.elapsedSeconds / 60, 1 / 60);
  const wordsTyped = correctCount / 5;
  const wpm = Math.round(wordsTyped / minutes);
  wpmDisplay.textContent = wpm;

  // Progresso em %
  const progress = Math.min(100, Math.round((typed.length / target.length) * 100));
  progressDisplay.textContent = progress;

  return { wpm, accuracy, errorsCount, progress, correctCount };
}

// ==========================================================================
// Atualização Visual Sincronizada com o Cursor/Ponteiro
// ==========================================================================
function updateDisplayHighlight(isTypingEvent = false, inputType = "") {
  const typed = typingArea.value;
  const target = state.targetText;
  const cursorPos = typeof typingArea.selectionStart === "number" ? typingArea.selectionStart : typed.length;

  const charSpans = referenceDisplay.querySelectorAll(".char");
  if (!charSpans || charSpans.length === 0) return;

  let lastInsertedCorrect = true;

  charSpans.forEach((span, idx) => {
    span.className = "char";

    // Avaliação do status de cada caractere digitado
    if (idx < typed.length) {
      if (typed[idx] === target[idx]) {
        span.classList.add("correct");
      } else {
        span.classList.add("wrong");
      }
    }

    // O indicador de foco (.current) segue fielmente a posição do cursor do aluno
    if (idx === cursorPos) {
      span.classList.add("current");
    }
  });

  // Se o cursor estiver no fim ou além do texto
  if (cursorPos >= target.length && charSpans.length > 0) {
    charSpans[charSpans.length - 1].classList.add("current");
  }

  // Efeito sonoro didático baseado no caractere inserido
  if (isTypingEvent && inputType !== "deleteContentBackward" && inputType !== "deleteContentForward") {
    const insertedIdx = cursorPos > 0 ? cursorPos - 1 : 0;
    if (insertedIdx < target.length && insertedIdx < typed.length) {
      lastInsertedCorrect = (typed[insertedIdx] === target[insertedIdx]);
    }
    playKeySound(!lastInsertedCorrect);
  }

  calculateStats();

  // Controle de conclusão e retomada (caso o aluno apague caracteres para corrigir)
  if (typed.length >= target.length) {
    if (!state.isFinished) {
      state.isFinished = true;
      stopTimer();
      statusText.textContent = "Texto concluído! Clique em Enviar.";
    }
  } else {
    if (state.isFinished) {
      state.isFinished = false;
      if (state.isTyping && !state.timerInterval) {
        startTimer();
        statusText.textContent = "Digitando em andamento...";
      }
    }
  }
}

// ==========================================================================
// Eventos de Digitação e Navegação do Cursor
// ==========================================================================
typingArea.addEventListener("input", (e) => {
  const typed = typingArea.value;

  // Iniciar cronômetro na primeira digitação
  if (!state.isTyping && typed.length > 0) {
    state.isTyping = true;
    startTimer();
    statusBadge.classList.add("active");
    statusText.textContent = "Digitando em andamento...";
  }

  updateDisplayHighlight(true, e.inputType);
});

// Acompanhar movimentação do ponteiro (clique, setas do teclado, seleção, foco)
["keyup", "keydown", "click", "select", "focus"].forEach((evt) => {
  typingArea.addEventListener(evt, () => {
    // Atualização com micro-delay para capturar a posição exata da seleção após o evento
    requestAnimationFrame(() => {
      updateDisplayHighlight(false);
    });
  });
});

// Prevenir colar texto para incentivar a digitação real do aluno
typingArea.addEventListener("paste", (e) => {
  e.preventDefault();
  alert("Por favor, digite o texto manualmente para praticar sua digitação!");
});

// ==========================================================================
// Gerenciamento do Nome do Aluno
// ==========================================================================
function updateStudentName(name) {
  const cleanName = (name || "").trim();
  state.studentName = cleanName;
  
  if (cleanName) {
    studentDisplayTag.textContent = cleanName;
    studentDisplayTag.title = `Aluno: ${cleanName}`;
    modalStudentName.textContent = cleanName;
    localStorage.setItem("digitafacil_student_name", cleanName);
  } else {
    studentDisplayTag.textContent = "Aluno";
    studentDisplayTag.title = "Aluno não identificado";
    modalStudentName.textContent = "Aluno";
    localStorage.removeItem("digitafacil_student_name");
  }
}

if (studentNameInput) {
  studentNameInput.addEventListener("input", (e) => {
    updateStudentName(e.target.value);
  });
}

// ==========================================================================
// Ação do Botão de Enviar (Mudança de Cor e Feedback Didático)
// ==========================================================================
function handleSubmit() {
  const typed = typingArea.value.trim();
  
  if (typed.length === 0) {
    alert("Digite pelo menos uma parte do texto antes de enviar!");
    typingArea.focus();
    return;
  }

  stopTimer();
  const stats = calculateStats();
  state.isSubmitted = true;

  // Mudança de Cor e Efeito Visual no Botão (Requisito didático)
  submitBtn.classList.add("submitted");
  btnLabel.textContent = "Enviado com Sucesso! ✓";
  btnIcon.setAttribute("data-lucide", "check-circle-2");
  lucide.createIcons();

  statusText.textContent = "Exercício Finalizado e Enviado.";
  playSuccessChime();

  // Popula os dados no modal de feedback didático
  const mins = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, "0");
  const secs = String(state.elapsedSeconds % 60).padStart(2, "0");

  modalWpm.textContent = `${stats.wpm} PPM`;
  modalAccuracy.textContent = `${stats.accuracy}%`;
  modalTime.textContent = `${mins}:${secs}`;
  modalErrors.textContent = `${stats.errorsCount}`;

  // Personalização da mensagem do aluno
  const displayName = state.studentName ? state.studentName : "Aluno";
  modalStudentName.textContent = displayName;
  modalDesc.textContent = state.studentName 
    ? `Parabéns, ${state.studentName}! Sua digitação foi analisada e registrada com sucesso.`
    : "Parabéns! Sua digitação foi analisada e registrada com sucesso.";

  // Mensagem pedagógica personalizada
  if (stats.accuracy >= 95 && stats.wpm >= 30) {
    modalFeedbackText.textContent = `Excelente, ${displayName}! Sua precisão e velocidade estão muito acima da média. Parabéns!`;
  } else if (stats.accuracy >= 85) {
    modalFeedbackText.textContent = `Muito bom, ${displayName}! Continue praticando para aumentar ainda mais sua agilidade sem perder a precisão.`;
  } else {
    modalFeedbackText.textContent = `Bom esforço, ${displayName}! Lembre-se: foque primeiro em acertar as teclas, a velocidade vem naturalmente com o treino.`;
  }

  // Exibe o modal com delay suave
  setTimeout(() => {
    submissionModal.classList.add("active");
  }, 400);
}

submitBtn.addEventListener("click", handleSubmit);

// ==========================================================================
// Controles e Modais
// ==========================================================================
textSelect.addEventListener("change", (e) => {
  loadPracticeText(parseInt(e.target.value, 10));
});

restartBtn.addEventListener("click", () => {
  loadPracticeText(state.currentTextIndex);
});

modalCloseBtn.addEventListener("click", () => {
  submissionModal.classList.remove("active");
});

modalNextBtn.addEventListener("click", () => {
  submissionModal.classList.remove("active");
  const nextIdx = (state.currentTextIndex + 1) % PRACTICE_TEXTS.length;
  textSelect.value = nextIdx;
  loadPracticeText(nextIdx);
});

// Fechar modal ao clicar fora da caixa
submissionModal.addEventListener("click", (e) => {
  if (e.target === submissionModal) {
    submissionModal.classList.remove("active");
  }
});

// Alternar Som
soundToggle.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  if (state.soundEnabled) {
    soundToggle.classList.add("active");
    soundIcon.setAttribute("data-lucide", "volume-2");
  } else {
    soundToggle.classList.remove("active");
    soundIcon.setAttribute("data-lucide", "volume-x");
  }
  lucide.createIcons();
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Carregar nome do aluno salvo anteriormente
  const savedStudentName = localStorage.getItem("digitafacil_student_name") || "";
  if (studentNameInput) {
    studentNameInput.value = savedStudentName;
  }
  updateStudentName(savedStudentName);

  lucide.createIcons();
  soundToggle.classList.add("active");
  loadPracticeText(0);
});
