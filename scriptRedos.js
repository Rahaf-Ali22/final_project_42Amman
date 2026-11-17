
"use strict";

// ==========================================
// GHURIR BANK — ReDoS SECURITY LAB
// Username Validator
// ==========================================

// 1. HTML ELEMENTS

const $ = (id) => document.getElementById(id);

const vulnerableBtn = $("vulnerableBtn");
const fixedBtn = $("fixedBtn");

const normalBtn = $("normalBtn");
const mediumBtn = $("mediumBtn");
const heavyBtn = $("heavyBtn");
const resetBtn = $("resetBtn");

const codeDisplay = $("codeDisplay");
const executionTime = $("executionTime");
const processingStatus = $("processingStatus");
const traceSteps = $("traceSteps");
const resultBar = $("resultBar");
const inputPreview = $("inputPreview");
const codeExplanation = $("codeExplanation");
const codeModeLabel = $("codeModeLabel");

// 2. CONFIGURATION

const TIMEOUT_MS = 1500;

// Updated payloads:
// Normal: valid input
// Medium: longer invalid input to demonstrate backtracking
// Heavy: longer invalid input that may reach the safety limit

const PAYLOADS = {
  normal: {
    input: "Bank2026",
    label: "Normal Input"
  },

  medium: {
    input: "Bank2026Bank2026!",
    label: "Medium Attack"
  },

  heavy: {
    input: "Bank2026Bank2026Bank2026!",
    label: "Heavy Attack"
  }
};

// 3. APPLICATION STATE

let currentMode = "vulnerable";
let currentWorker = null;
let timer = null;
let runId = 0;

// ==========================================
// 4. DISPLAY CODE
// ==========================================

function displayCode() {
  const vulnerable = currentMode === "vulnerable";

  const regexLine = vulnerable
    ? "  const regex = /^([a-zA-Z0-9]+)+$/;"
    : "  const regex = /^[a-zA-Z0-9]+$/;";

  const lines = [
    "function validateUsername(username) {",
    "  const input = String(username);",
    "  if (input.length === 0) {",
    "    return false;",
    "  }",
    regexLine,
    "  const isValid = regex.test(input);",
    "  return isValid;",
    "}"
  ];

  codeDisplay.replaceChildren();

  lines.forEach((line, index) => {
    const row = document.createElement("span");
    row.className = "code-row";

    if (index === 5) {
      row.classList.add(
        vulnerable ? "code-vulnerable" : "code-fixed"
      );
    }

    const number = document.createElement("span");
    number.className = "line-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const content = document.createElement("span");
    content.textContent = line;

    row.append(number, content);
    codeDisplay.append(row);
  });

  codeModeLabel.textContent = vulnerable
    ? "Vulnerable code"
    : "Fixed code";

  codeModeLabel.className = vulnerable
    ? "tag tag-danger"
    : "tag tag-success";

  codeExplanation.textContent = vulnerable
    ? "Line 6: Nested quantifiers (+ inside +) allow many ways to match the same characters, potentially causing catastrophic backtracking."
    : "Line 6: Removing nested repetition prevents catastrophic backtracking while preserving the same username validation rules.";
}

// ==========================================
// 5. EXECUTION TRACE
// ==========================================

function addStep(message, status = "") {
  const pill = document.createElement("span");

  pill.className = `pill ${status}`;
  pill.textContent = message;

  traceSteps.append(pill);
}

// ==========================================
// 6. BUTTON STATES
// ==========================================

function setRunning(running) {
  [
    normalBtn,
    mediumBtn,
    heavyBtn,
    vulnerableBtn,
    fixedBtn
  ].forEach((button) => {
    button.disabled = running;
  });
}

// ==========================================
// 7. STOP WORKER
// ==========================================

function stopWorker() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }

  if (currentWorker !== null) {
    currentWorker.terminate();
    currentWorker = null;
  }
}

// ==========================================
// 8. RESET RESULTS
// ==========================================

function resetResults() {
  runId++;

  stopWorker();
  setRunning(false);

  executionTime.textContent = "— ms";
  processingStatus.textContent = "Ready";

  inputPreview.textContent = "Choose a payload above";

  traceSteps.replaceChildren();
  addStep("Waiting for input...");

  resultBar.className = "result-bar";
  resultBar.textContent = "Run a test to see the result.";
}

// ==========================================
// 9. CHANGE MODE
// ==========================================

function changeMode(mode) {
  currentMode = mode;

  vulnerableBtn.classList.toggle(
    "active-vulnerable",
    mode === "vulnerable"
  );

  fixedBtn.classList.toggle(
    "active-fixed",
    mode === "fixed"
  );

  vulnerableBtn.setAttribute(
    "aria-pressed",
    String(mode === "vulnerable")
  );

  fixedBtn.setAttribute(
    "aria-pressed",
    String(mode === "fixed")
  );

  resetResults();
  displayCode();
}

// ==========================================
// 10. CREATE WEB WORKER
// ==========================================

function createWorker() {
  const source = `
    self.onmessage = function (event) {
      const { input, mode } = event.data;

      const regex = mode === "vulnerable"
        ? /^([a-zA-Z0-9]+)+$/
        : /^[a-zA-Z0-9]+$/;

      const start = performance.now();

      const valid =
        input.length > 0 && regex.test(input);

      const elapsed = performance.now() - start;

      self.postMessage({
        valid,
        elapsed
      });
    };
  `;

  const blob = new Blob(
    [source],
    { type: "text/javascript" }
  );

  const url = URL.createObjectURL(blob);

  try {
    return new Worker(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ==========================================
// 11. RUN TEST
// ==========================================

function runTest(key) {
  resetResults();

  const thisRun = runId;
  const mode = currentMode;
  const payload = PAYLOADS[key];

  inputPreview.textContent = payload.input;

  setRunning(true);
  processingStatus.textContent = "Running";

  traceSteps.replaceChildren();

  addStep(`${payload.label} selected`, "ok");
  addStep("Validation started", "wait");

  if (key !== "normal") {
    addStep("Invalid ! suffix detected in input", "wait");
  }

  resultBar.className = "result-bar";
  resultBar.textContent = "Processing input...";

  let worker;

  try {
    worker = createWorker();
  } catch (error) {
    setRunning(false);

    processingStatus.textContent = "Error";

    addStep("Worker could not start", "bad");

    resultBar.className = "result-bar danger";
    resultBar.textContent =
      "Worker unavailable. Open the lab using a local development server.";

    return;
  }

  currentWorker = worker;

  // Safety timeout
  timer = setTimeout(() => {
    if (thisRun !== runId) return;

    stopWorker();
    setRunning(false);

    executionTime.textContent = `≥ ${TIMEOUT_MS} ms`;
    processingStatus.textContent = "Timed Out";

    addStep("Safety limit reached", "bad");

    resultBar.className = "result-bar danger";

    resultBar.textContent = mode === "vulnerable"
      ? "ReDoS effect: the vulnerable validator did not finish before the safety limit."
      : "Validation did not finish before the safety limit.";

  }, TIMEOUT_MS);

  // Worker completed
  worker.onmessage = ({ data }) => {
    if (thisRun !== runId) return;

    stopWorker();
    setRunning(false);

    // Display more decimal places for small execution times
    const formattedTime = data.elapsed.toFixed(6);

    executionTime.textContent =
      `${formattedTime} ms`;

    processingStatus.textContent = "Completed";

    addStep("Regex finished", "ok");

    addStep(
      data.valid ? "Username accepted" : "Username rejected",
      data.valid ? "ok" : "bad"
    );

    if (data.valid) {
      resultBar.className = "result-bar success";
      resultBar.textContent =
        "Valid username accepted.";

    } else if (mode === "fixed" && key !== "normal") {
      resultBar.className = "result-bar success";
      resultBar.textContent =
        `Attack input rejected efficiently in ${formattedTime} ms.`;

    } else {
      resultBar.className = "result-bar danger";
      resultBar.textContent =
        `Invalid username rejected after ${formattedTime} ms. Compare with Fixed mode.`;
    }
  };

  // Worker error
  worker.onerror = () => {
    if (thisRun !== runId) return;

    stopWorker();
    setRunning(false);

    processingStatus.textContent = "Error";

    addStep("Worker error", "bad");

    resultBar.className = "result-bar danger";
    resultBar.textContent =
      "The test failed. Check your browser console.";
  };

  worker.postMessage({
    input: payload.input,
    mode
  });
}

// ==========================================
// 12. BUTTON EVENTS
// ==========================================

vulnerableBtn.addEventListener(
  "click",
  () => changeMode("vulnerable")
);

fixedBtn.addEventListener(
  "click",
  () => changeMode("fixed")
);

normalBtn.addEventListener(
  "click",
  () => runTest("normal")
);

mediumBtn.addEventListener(
  "click",
  () => runTest("medium")
);

heavyBtn.addEventListener(
  "click",
  () => runTest("heavy")
);

resetBtn.addEventListener(
  "click",
  resetResults
);

// ==========================================
// 13. INITIALIZE
// ==========================================

changeMode("vulnerable");
