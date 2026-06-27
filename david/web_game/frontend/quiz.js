/* ---------------- QUIZ ---------------- */

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

function openQuiz() {
    console.log("Quiz clicked");
    const quizPanel = document.getElementById("quizPanel");
    if (!quizPanel) {
        console.error("quizPanel element not found in index.html");
        return;
    }
    quizPanel.classList.toggle("hidden");
    document.getElementById("learningView").classList.add("hidden");
    document.getElementById("quizView").classList.add("hidden");
}
function closeQuiz() {
    const quizPanel = document.getElementById("quizPanel");
    if (!quizPanel) {
        return;
    }
    quizPanel.classList.add("hidden");
}
async function openLearning() {
    document.getElementById("learningView").classList.remove("hidden");
    document.getElementById("quizView").classList.add("hidden");
    await loadStories();
}
async function openQuizGame() {
    const startResponse = await fetch("/quiz/start", {
        method: "POST"
    });

    const startData = await startResponse.json();

    window.renderState(startData.state);

    if (!startData.allowed) {
        document.getElementById("quizView").classList.remove("hidden");
        document.getElementById("learningView").classList.add("hidden");

        document.getElementById("quizQuestionBox").innerHTML = `
            <p>${startData.reason}</p>
            <p>Új mókát csak a következő körben indíthatsz.</p>
        `;

        return;
    }

    document.getElementById("quizView").classList.remove("hidden");
    document.getElementById("learningView").classList.add("hidden");

    await startQuiz();
}

async function loadStories() {
    const storiesList = document.getElementById("storiesList");
    storiesList.innerHTML = "A történetek még nőnek...";
    const response = await fetch("/quiz/stories");
    const stories = await response.json();
    storiesList.innerHTML = "";
    stories.forEach((story) => {
        const card = document.createElement("div");
        card.className = "story-card";
        card.innerHTML = `
            <p><strong>${story.story_title}</strong></p>
            <details>
                <summary>Elolvasom</summary>
                <div class="story-text">${story.story_text}</div>
            </details>
        `;
        storiesList.appendChild(card);
    });
}
async function startQuiz() {
    const quizQuestionBox = document.getElementById("quizQuestionBox");
    quizQuestionBox.innerHTML = "A kérdések még nőnek...";
    const response = await fetch("/quiz/questions?limit=5");
    quizQuestions = await response.json();
    currentQuestionIndex = 0;
    score = 0;
    showCurrentQuestion();
}
function showCurrentQuestion() {
    const quizQuestionBox = document.getElementById("quizQuestionBox");
    if (currentQuestionIndex >= quizQuestions.length) {
        quizQuestionBox.innerHTML = `
            <h4>A tudás elültetve!</h4>
            <p>Your score: ${score} / ${quizQuestions.length}</p>
            <button type="button" onclick="startQuiz()">Play again</button>
        `;
        return;
    }
    const q = quizQuestions[currentQuestionIndex];
    quizQuestionBox.innerHTML = `
        <p><strong>Question ${currentQuestionIndex + 1} / ${quizQuestions.length}</strong></p>
        <p>${q.question}</p>

        <button type="button" class="quiz-option" data-option="A">A: ${q.options.A}</button>
        <button type="button" class="quiz-option" data-option="B">B: ${q.options.B}</button>
        <button type="button" class="quiz-option" data-option="C">C: ${q.options.C}</button>
        <button type="button" class="quiz-option" data-option="D">D: ${q.options.D}</button>

        <div id="answerFeedback"></div>
    `;
    document.querySelectorAll(".quiz-option").forEach((button) => {
        button.addEventListener("click", () => {
            checkAnswer(button.dataset.option);
        });
    });
}
function checkAnswer(selectedOption) {
    const q = quizQuestions[currentQuestionIndex];
    const feedback = document.getElementById("answerFeedback");
    document.querySelectorAll(".quiz-option").forEach((button) => {
        button.disabled = true;
        if (button.dataset.option === q.correct_option) {
            button.classList.add("correct");
        }
        if (
            button.dataset.option === selectedOption &&
            selectedOption !== q.correct_option
        ) {
            button.classList.add("wrong");
        }
    });
    if (selectedOption === q.correct_option) {
    score += 1;

    fetch("/quiz/correct", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
            if (data.state) {
                window.renderState(data.state);
            }
        });

    feedback.innerHTML = `
        <p>Magam se mondhattam volna jobban!</p>
        <p>${q.explanation}</p>
        <button id="nextQuestionBtn">Következő kérdés</button>
    `;
} else {
        feedback.innerHTML = `
            <p><strong>Tévedsz.</strong></p>
            <p>Helyes válasz: ${q.correct_answer}</p>
            <p>${q.explanation}</p>
            <button type="button" id="nextQuestionBtn">Következő kérdés</button>
        `;
    }
    document.getElementById("nextQuestionBtn").addEventListener("click", () => {
        currentQuestionIndex += 1;
        showCurrentQuestion();
    });
}