
const vulnerableCode = [
    "const acc = await getAccount(id)",
    "if (acc.balance >= amount) {",
    "    await sendCash(amount)",
    "    acc.balance -= amount",
    "    await save(acc)",
    "}"
];

const fixedCode = [
    "async function withdraw(id, amount) {",
    "    return await atomicTransaction(async () => {",
    "        const acc = await getAccount(id)",
    "        if (acc.balance < amount) return false",
    "        acc.balance -= amount",
    "        await save(acc)",
    "        await sendCash(amount)",
    "        return true",
    "    })",
    "}"
];

let mode = "vulnerable";

let balance = 100;
let cashPaid = 0;

const balanceElement = document.getElementById("balance");
const cashElement = document.getElementById("cashPaid");
const codeViewer = document.getElementById("codeViewer");
const requestLog = document.getElementById("requestLog");
const resultMessage = document.getElementById("resultMessage");


// Display code and highlight the important line

function updateCode() {

    const lines = mode === "vulnerable"
        ? vulnerableCode
        : fixedCode;

    codeViewer.innerHTML = "";

    lines.forEach((line, index) => {

        const span = document.createElement("span");

        span.className = "code-line";

        if (mode === "vulnerable" && index === 2) {
            span.classList.add("vulnerable");
        }

        if (mode === "fixed" && index === 4) {
            span.classList.add("fixed");
        }

        span.textContent = line;

        codeViewer.appendChild(span);

    });

    document.getElementById("vulnerableTab")
        .classList.toggle("active", mode === "vulnerable");

    document.getElementById("fixedTab")
        .classList.toggle("active", mode === "fixed");

}


// Update account statistics

function updateStats() {

    balanceElement.textContent =
        "$" + balance;

    cashElement.textContent =
        "$" + cashPaid;

}


// Create request card

function addRequest(name, steps) {

    const card = document.createElement("div");

    card.className = "request-card";

    const title = document.createElement("div");

    title.className = "request-title";
    title.textContent = name;

    const stepContainer = document.createElement("div");

    stepContainer.className = "request-steps";

    steps.forEach(step => {

        const item = document.createElement("span");

        item.className = step.type;
        item.textContent = step.text;

        stepContainer.appendChild(item);

    });

    card.appendChild(title);
    card.appendChild(stepContainer);

    requestLog.appendChild(card);

}


// Show result

function showResult(message, type) {

    resultMessage.textContent = message;
    resultMessage.className = "result " + type;

}


// Reset before each test

function resetValues() {

    balance = 100;
    cashPaid = 0;

    updateStats();

    requestLog.innerHTML = "";

    showResult("Running a new test...", "");

}


// Vulnerable simulation

function runVulnerable(numberOfRequests) {

    // Step 1: All requests read the original balance first

    const requests = [];

    for (let i = 0; i < numberOfRequests; i++) {

        requests.push({
            name: `Request ${String.fromCharCode(65 + i)}`,
            readBalance: balance,
            approved: balance >= 100
        });

    }


    // Step 2: Complete requests using their earlier approval

    requests.forEach(request => {

        if (request.approved) {

            // Cash is paid even though another request
            // may already have changed the balance.

            cashPaid += 100;

            balance -= 100;

            addRequest(request.name, [
                { text: "read balance " + request.readBalance, type: "ok" },
                { text: "check ok", type: "ok" },
                { text: "paid $100", type: "ok" }
            ]);

        } else {

            addRequest(request.name, [
                { text: "read balance " + request.readBalance, type: "ok" },
                { text: "insufficient balance", type: "fail" }
            ]);

        }

    });

    updateStats();

    if (cashPaid > 100) {

        showResult(
            `Exploit worked: $${cashPaid} paid out from a $100 account.`,
            "danger"
        );

    } else {

        showResult(
            "Withdrawal completed. No double withdrawal occurred.",
            ""
        );

    }

}


// Fixed simulation

function runFixed(numberOfRequests) {

    // Requests are handled as one atomic transaction each.
    // Each request checks the latest balance.

    for (let i = 0; i < numberOfRequests; i++) {

        const name = `Request ${String.fromCharCode(65 + i)}`;

        const currentBalance = balance;

        if (currentBalance >= 100) {

            balance -= 100;

            cashPaid += 100;

            addRequest(name, [
                { text: "read balance " + currentBalance, type: "ok" },
                { text: "check ok", type: "ok" },
                { text: "paid $100", type: "ok" }
            ]);

        } else {

            addRequest(name, [
                { text: "read balance " + currentBalance, type: "wait" },
                { text: "check failed", type: "fail" },
                { text: "rejected", type: "fail" }
            ]);

        }

    }

    updateStats();

    showResult(
        `Protected: only $${cashPaid} was paid out. The account balance cannot go below $0.`,
        "success"
    );

}


// Run withdrawal tests

function runTest(numberOfRequests) {

    resetValues();

    if (mode === "vulnerable") {
        runVulnerable(numberOfRequests);
    } else {
        runFixed(numberOfRequests);
    }

}


// Buttons

document.getElementById("doubleBtn")
    .addEventListener("click", () => runTest(2));

document.getElementById("singleBtn")
    .addEventListener("click", () => runTest(1));


// Version switching

document.getElementById("vulnerableTab")
    .addEventListener("click", () => {

        mode = "vulnerable";

        resetValues();
        updateCode();

    });

document.getElementById("fixedTab")
    .addEventListener("click", () => {

        mode = "fixed";

        resetValues();
        updateCode();

    });


// Reset button

document.getElementById("resetBtn")
    .addEventListener("click", () => {

        resetValues();

    });


// Initialize

updateCode();
updateStats();

