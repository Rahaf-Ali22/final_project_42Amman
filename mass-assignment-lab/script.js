
// ==============================
// USER DATA
// ==============================

const originalUser = {
    username: "sally",
    email: "sally@gmail.com",
    role: "user",
    isAdmin: false
};

let vulnerableUser = { ...originalUser };
let fixedUser = { ...originalUser };

let currentLanguage = "en";


// ==============================
// VULNERABLE FUNCTION
// ==============================

function vulnerableUpdate(requestBody) {

    Object.assign(vulnerableUser, requestBody);

}


// ==============================
// FIXED FUNCTION
// ==============================

function fixedUpdate(requestBody) {

    const allowedFields = ["username", "email"];

    allowedFields.forEach(field => {

        if (requestBody[field] !== undefined) {

            fixedUser[field] = requestBody[field];

        }

    });

}


// ==============================
// PAYLOADS
// ==============================

const payloads = {

    normal: {
        username: "sally",
        email: "sally@gmail.com"
    },

    attack: {
        role: "admin",
        isAdmin: true
    }

};


// ==============================
// RUN PAYLOAD
// ==============================

function runPayload(type) {

    const payload = payloads[type];

    if (!payload) return;

    vulnerableUpdate(payload);

    fixedUpdate(payload);

    document.getElementById("requestBody").textContent =
        JSON.stringify(payload, null, 2);

    updateScreen();

    updateFinalResult(type);

}


// ==============================
// UPDATE RESULTS ON SCREEN
// ==============================

function updateScreen() {

    // Vulnerable Result

    document.getElementById("vUsername").textContent =
        vulnerableUser.username;

    document.getElementById("vEmail").textContent =
        vulnerableUser.email;

    document.getElementById("vRole").textContent =
        vulnerableUser.role;

    document.getElementById("vAdmin").textContent =
        vulnerableUser.isAdmin;


    // Fixed Result

    document.getElementById("fUsername").textContent =
        fixedUser.username;

    document.getElementById("fEmail").textContent =
        fixedUser.email;

    document.getElementById("fRole").textContent =
        fixedUser.role;

    document.getElementById("fAdmin").textContent =
        fixedUser.isAdmin;

}


// ==============================
// UPDATE FINAL RESULT
// ==============================

function updateFinalResult(type) {

    const vulnerableStatus =
        document.getElementById("vulnerableStatus");

    const fixedStatus =
        document.getElementById("fixedStatus");

    const vulnerableMessage =
        document.getElementById("vulnerableMessage");

    const fixedMessage =
        document.getElementById("fixedMessage");

    const finalResult =
        document.getElementById("finalResult");


    vulnerableStatus.className = "result-status";

    fixedStatus.className = "result-status";


    if (type === "normal") {

        vulnerableStatus.textContent = "SUCCESS";

        vulnerableStatus.classList.add("status-success");

        fixedStatus.textContent = "SUCCESS";

        fixedStatus.classList.add("status-success");


        vulnerableMessage.textContent =
            currentLanguage === "en"
                ? "Normal update accepted successfully."
                : "تم قبول التعديل الطبيعي بنجاح.";


        fixedMessage.textContent =
            currentLanguage === "en"
                ? "Normal update accepted successfully."
                : "تم قبول التعديل الطبيعي بنجاح.";


        finalResult.querySelector("h3").textContent =
            currentLanguage === "en"
                ? "Both applications accepted the normal update."
                : "التطبيقان قبلا التعديل الطبيعي.";


        finalResult.querySelector("p").textContent =
            currentLanguage === "en"
                ? "The username and email were updated in both implementations."
                : "تم تحديث اسم المستخدم والبريد الإلكتروني في التطبيقين.";

    } else {

        vulnerableStatus.textContent = "VULNERABLE";

        vulnerableStatus.classList.add("status-danger");

        fixedStatus.textContent = "BLOCKED";

        fixedStatus.classList.add("status-success");


        vulnerableMessage.textContent =
            currentLanguage === "en"
                ? "The attack changed role to admin and isAdmin to true!"
                : "الهجوم غيّر role إلى admin و isAdmin إلى true!";


        fixedMessage.textContent =
            currentLanguage === "en"
                ? "The fixed application blocked both unauthorized properties."
                : "التطبيق المصحح منع الخاصيتين غير المسموح بهما.";


        finalResult.querySelector("h3").textContent =
            currentLanguage === "en"
                ? "Both sensitive properties were changed only in the vulnerable application!"
                : "تم تغيير الخاصيتين الحساستين في التطبيق المصاب فقط!";


        finalResult.querySelector("p").textContent =
            currentLanguage === "en"
                ? "The allowlist protected role and isAdmin in the fixed application."
                : "قائمة السماح حمت role و isAdmin في التطبيق المصحح.";

    }

}


// ==============================
// RESET SIMULATION
// ==============================

function resetSimulation() {

    vulnerableUser = { ...originalUser };

    fixedUser = { ...originalUser };


    document.getElementById("requestBody").textContent =
        JSON.stringify(payloads.normal, null, 2);


    document.getElementById("vulnerableStatus").textContent =
        "WAITING";

    document.getElementById("fixedStatus").textContent =
        "WAITING";


    document.getElementById("vulnerableStatus").className =
        "result-status neutral";

    document.getElementById("fixedStatus").className =
        "result-status neutral";


    document.getElementById("vulnerableMessage").textContent =
        currentLanguage === "en"
            ? "Waiting for a request..."
            : "بانتظار إرسال طلب...";


    document.getElementById("fixedMessage").textContent =
        currentLanguage === "en"
            ? "Waiting for a request..."
            : "بانتظار إرسال طلب...";


    document.getElementById("finalResult").querySelector("h3").textContent =
        currentLanguage === "en"
            ? "Run a request to see what happens"
            : "أرسلي طلباً لتشاهدي النتيجة";


    document.getElementById("finalResult").querySelector("p").textContent =
        currentLanguage === "en"
            ? "The vulnerable and fixed applications process the same request differently."
            : "التطبيق المصاب والمصحح يعالجان نفس الطلب بطرق مختلفة.";


    updateScreen();

}


// ==============================
// PAYLOAD BUTTONS
// ==============================

document.querySelectorAll(".payload-button[data-payload]").forEach(button => {

    button.addEventListener("click", function () {

        runPayload(this.dataset.payload);

    });

});


document.getElementById("resetButton").addEventListener("click", resetSimulation);


// ==============================
// SWITCH FUNCTION
// ==============================

function setupSwitch(switchId) {

    const switchContainer = document.getElementById(switchId);

    const switchButtons =
        switchContainer.querySelectorAll(".switch-button");


    switchButtons.forEach(button => {

        button.addEventListener("click", function () {

            const targetId = button.dataset.target;


            // Hide all cards in this switch group

            switchButtons.forEach(otherButton => {

                const card = document.getElementById(
                    otherButton.dataset.target
                );

                card.hidden = true;

                otherButton.classList.remove("active");

                otherButton.setAttribute("aria-pressed", "false");

            });


            // Show selected card

            document.getElementById(targetId).hidden = false;

            button.classList.add("active");

            button.setAttribute("aria-pressed", "true");

        });

    });

}


// ==============================
// ACTIVATE BOTH SWITCHES
// ==============================

setupSwitch("codeSwitch");

setupSwitch("resultSwitch");


// ==============================
// LANGUAGE SWITCH
// ==============================

document.getElementById("languageButton").addEventListener("click", function () {

    currentLanguage = currentLanguage === "en" ? "ar" : "en";

    document.documentElement.lang = currentLanguage;

    document.documentElement.dir =
        currentLanguage === "ar" ? "rtl" : "ltr";


    this.textContent =
        currentLanguage === "en" ? "العربية" : "English";


    document.querySelectorAll("[data-en][data-ar]").forEach(element => {

        element.textContent = element.dataset[currentLanguage];

    });


    resetSimulation();

});


// ==============================
// INITIAL PAGE STATE
// ==============================

updateScreen();

resetSimulation();
