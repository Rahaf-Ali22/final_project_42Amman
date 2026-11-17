"use strict";
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
const TIMEOUT_MS = 1500;
const PAYLOADS = {
  normal: { input: "RahafAli", label: "Normal Input" },
  medium: { input: "RahafAliRahaf!", label: "Medium Attack" },
  heavy: { input: "RahafAliRahafAliRahafAli!", label: "Heavy Attack" }
};
let currentMode = "vulnerable";
let currentWorker = null;
let timer = null;
let runId = 0;

function displayCode() {
  const regexLine = currentMode === "vulnerable"
    ? "  const regex = /^([a-zA-Z]+)*$/;"
    : "  const regex = /^[a-zA-Z]+$/;";
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
    if (index === 5) row.classList.add(currentMode === "vulnerable" ? "code-vulnerable" : "code-fixed");
    const number = document.createElement("span");
    number.className = "line-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const content = document.createElement("span");
    content.textContent = line;
    row.append(number, content);
    codeDisplay.append(row);
  });
  const vulnerable = currentMode === "vulnerable";
  codeModeLabel.textContent = vulnerable ? "Vulnerable code" : "Fixed code";
  codeModeLabel.className = vulnerable ? "tag tag-danger" : "tag tag-success";
  codeExplanation.textContent = vulnerable
    ? "Line 6: Nested quantifiers (+ inside *) can cause catastrophic backtracking when a long input fails near its end."
    : "Line 6: A single + removes nested repetition, so invalid input is rejected efficiently.";
}

function addStep(message, status = "") {
  const pill = document.createElement("span");
  pill.className = `pill ${status}`;
  pill.textContent = message;
  traceSteps.append(pill);
}
function setRunning(running) {
  [normalBtn, mediumBtn, heavyBtn, vulnerableBtn, fixedBtn].forEach(button => button.disabled = running);
}
function stopWorker() {
  if (timer !== null) { clearTimeout(timer); timer = null; }
  if (currentWorker !== null) { currentWorker.terminate(); currentWorker = null; }
}
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
function changeMode(mode) {
  currentMode = mode;
  vulnerableBtn.classList.toggle("active-vulnerable", mode === "vulnerable");
  fixedBtn.classList.toggle("active-fixed", mode === "fixed");
  vulnerableBtn.setAttribute("aria-pressed", String(mode === "vulnerable"));
  fixedBtn.setAttribute("aria-pressed", String(mode === "fixed"));
  resetResults();
  displayCode();
}
function createWorker() {
  const source = `
    self.onmessage = function (event) {
      const { input, mode } = event.data;
      const regex = mode === "vulnerable" ? /^([a-zA-Z]+)*$/ : /^[a-zA-Z]+$/;
      const start = performance.now();
      const valid = input.length > 0 && regex.test(input);
      self.postMessage({ valid, elapsed: performance.now() - start });
    };
  `;
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  try { return new Worker(url); }
  finally { URL.revokeObjectURL(url); }
}
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
  if (key !== "normal") addStep("Invalid ! suffix", "wait");
  resultBar.textContent = "Processing input...";
  let worker;
  try { worker = createWorker(); }
  catch (error) {
    setRunning(false);
    processingStatus.textContent = "Error";
    addStep("Worker could not start", "bad");
    resultBar.className = "result-bar danger";
    resultBar.textContent = "Worker unavailable. Open the lab using a local development server.";
    return;
  }
  currentWorker = worker;
  timer = setTimeout(() => {
    if (thisRun !== runId) return;
    stopWorker();
    setRunning(false);
    executionTime.textContent = `≥ ${TIMEOUT_MS} ms`;
    processingStatus.textContent = "Timed Out";
    addStep("Safety limit reached", "bad");
    resultBar.className = "result-bar danger";
    resultBar.textContent = mode === "vulnerable"
      ? "ReDoS effect: the vulnerable validator exceeded the safety limit."
      : "Validation exceeded the safety limit; test could not complete.";
  }, TIMEOUT_MS);
  worker.onmessage = ({ data }) => {
    if (thisRun !== runId) return;
    stopWorker();
    setRunning(false);
    executionTime.textContent = `${data.elapsed.toFixed(3)} ms`;
    processingStatus.textContent = "Completed";
    addStep("Regex finished", "ok");
    addStep(data.valid ? "Username accepted" : "Username rejected", data.valid ? "ok" : "bad");
    if (data.valid) {
      resultBar.className = "result-bar success";
      resultBar.textContent = "Valid username accepted.";
    } else if (mode === "fixed") {
      resultBar.className = "result-bar success";
      resultBar.textContent = `Attack input rejected efficiently in ${data.elapsed.toFixed(3)} ms.`;
    } else {
      resultBar.className = "result-bar danger";
      resultBar.textContent = `Invalid username rejected after ${data.elapsed.toFixed(3)} ms. Compare with Fixed mode.`;
    }
  };
  worker.onerror = () => {
    if (thisRun !== runId) return;
    stopWorker();
    setRunning(false);
    processingStatus.textContent = "Error";
    addStep("Worker error", "bad");
    resultBar.className = "result-bar danger";
    resultBar.textContent = "The test failed. Check your browser console.";
  };
  worker.postMessage({ input: payload.input, mode });
}
vulnerableBtn.addEventListener("click", () => changeMode("vulnerable"));
fixedBtn.addEventListener("click", () => changeMode("fixed"));
normalBtn.addEventListener("click", () => runTest("normal"));
mediumBtn.addEventListener("click", () => runTest("medium"));
heavyBtn.addEventListener("click", () => runTest("heavy"));
resetBtn.addEventListener("click", resetResults);
changeMode("vulnerable");
