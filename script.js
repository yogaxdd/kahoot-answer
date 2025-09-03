const fetchBtn = document.getElementById("fetchBtn");
const exportBtn = document.getElementById("exportBtn");
const showAllBtn = document.getElementById("showAllBtn");
const quizInput = document.getElementById("quizInput");
const quizInfo = document.getElementById("quizInfo");
const questionsContainer = document.getElementById("questionsContainer");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const loadingSpinner = document.getElementById("loadingSpinner");
const quizTitle = document.getElementById("quizTitle");
const quizCreator = document.getElementById("quizCreator");
const questionCount = document.getElementById("questionCount");
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");

let allQuestions = [];
let exportedText = "";
let showAllAnswers = false;

fetchBtn.addEventListener("click", async () => {
  const input = quizInput.value.trim();
  if (!input) return;

  show(loadingSpinner);
  hide(errorMessage, quizInfo, questionsContainer, noResults);

  let quizId = input;

  if (/^\d+$/.test(input)) {
    try {
      const res = await fetch(`/api/kahoot?pin=${input}`);
      const data = await res.json();
      quizId = data.id;
    } catch {
      return showError("Gagal mengambil quiz ID dari PIN.");
    }
  }

  try {
    const res = await fetch(`/api/kahoot?id=${quizId}`);
    const data = await res.json();

    if (!data || !data.questions) throw new Error("Invalid data");

    allQuestions = data.questions;
    quizTitle.textContent = data.title || "Untitled Quiz";
    quizCreator.textContent = data.creator_username || "Unknown";
    questionCount.textContent = allQuestions.length;

    renderQuestions(allQuestions);
    buildExportText(data, allQuestions);

    show(quizInfo, questionsContainer);
    hide(errorMessage, noResults);
  } catch {
    return showError("Gagal mengambil data quiz. Pastikan ID/PIN valid.");
  } finally {
    hide(loadingSpinner);
  }
});

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const filtered = allQuestions.filter(q => {
    const qText = q.question?.toLowerCase() || "";
    const corrects = q.choices?.filter(c => c.correct).map(c => c.answer.toLowerCase()).join(" ") || "";
    return qText.includes(keyword) || corrects.includes(keyword);
  });

  if (filtered.length === 0) {
    hide(questionsContainer);
    show(noResults);
  } else {
    hide(noResults);
    show(questionsContainer);
    renderQuestions(filtered);
  }
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([exportedText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kahoot_answers.txt";
  a.click();
  URL.revokeObjectURL(url);
});

showAllBtn.addEventListener("click", () => {
  showAllAnswers = !showAllAnswers;
  showAllBtn.classList.toggle("active", showAllAnswers);
  showAllBtn.innerHTML = showAllAnswers 
    ? '<i class="fas fa-eye-slash"></i> Show Correct Only'
    : '<i class="fas fa-eye"></i> Show All Answers';
  
  if (allQuestions.length > 0) {
    const filtered = searchInput.value.toLowerCase() ? 
      allQuestions.filter(q => {
        const qText = q.question?.toLowerCase() || "";
        const corrects = q.choices?.filter(c => c.correct).map(c => c.answer.toLowerCase()).join(" ") || "";
        return qText.includes(searchInput.value.toLowerCase()) || corrects.includes(searchInput.value.toLowerCase());
      }) : allQuestions;
    renderQuestions(filtered);
  }
});

function show(...elms) {
  elms.forEach(e => e.classList.remove("hidden"));
}
function hide(...elms) {
  elms.forEach(e => e.classList.add("hidden"));
}
function showError(msg) {
  errorText.textContent = msg;
  hide(quizInfo, questionsContainer, noResults, loadingSpinner);
  show(errorMessage);
}
function renderQuestions(questions) {
  questionsContainer.innerHTML = "";
  questions.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "question-card";
    if (q.type === "content") card.classList.add("content-slide");
    let html = `
      <div class="question-header">
        <span class="question-number">Q${i + 1}</span>
        <span class="question-type">${q.type || "unknown"}</span>
      </div>
    `;
    if (q.type === "content") {
      html += `<div class="slide-title">${stripHTML(q.title)}</div>`;
      if (q.description) html += `<div class="slide-description">${stripHTML(q.description)}</div>`;
    } else {
      html += `<div class="question-text">${stripHTML(q.question)}</div>`;
      
      if (showAllAnswers && q.choices && q.choices.length > 0) {
        html += `
          <div class="answer-section">
            <div class="answer-label"><i class="fas fa-list"></i> All Answers:</div>
            <div class="all-answers">
        `;
        q.choices.forEach(choice => {
          const isCorrect = choice.correct;
          html += `
            <div class="answer-option ${isCorrect ? 'correct' : 'incorrect'}">
              ${stripHTML(choice.answer)}
            </div>
          `;
        });
        html += `
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="answer-section">
            <div class="answer-label"><i class="fas fa-check-circle"></i> Correct Answer:</div>
            <div class="answer-text">${q.choices.filter(c => c.correct).map(c => stripHTML(c.answer)).join(", ") || "No correct answer"}</div>
          </div>
        `;
      }
    }
    card.innerHTML = html;
    questionsContainer.appendChild(card);
  });
}
function buildExportText(data, questions) {
  exportedText = `KAHOOT ANSWERS\nTitle: ${data.title}\nCreator: ${data.creator_username}\nQuestions: ${questions.length}\n\n`;
  questions.forEach((q, i) => {
    if (q.type === "content") {
      exportedText += `SLIDE ${i + 1}: ${stripHTML(q.title)}\n`;
      if (q.description) exportedText += `Description: ${stripHTML(q.description)}\n`;
    } else {
      exportedText += `Q${i + 1}: ${stripHTML(q.question)}\n`;
      const answers = q.choices.filter(c => c.correct).map(c => stripHTML(c.answer));
      exportedText += `Answer: ${answers.join(", ") || "No correct answer"}\n`;
    }
    exportedText += "\n";
  });
}
function stripHTML(html) {
  return html?.replace(/<[^>]*>/g, "").replace(/\\"/g, '"') || "";
}
