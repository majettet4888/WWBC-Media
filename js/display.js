console.log("DISPLAY.JS VERSION 1");

let redLetterVerses = {};

const welcomeScreen = document.getElementById("welcomeScreen");
const scriptureScreen = document.getElementById("scriptureScreen");
const hymnalScreen = document.getElementById("hymnalScreen");
const welcomeDate = document.getElementById("welcomeDate");
const countdown = document.getElementById("countdown");

async function loadRedLetterData() {
    try {
        const response = await fetch("data/red_letter_verses.json");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        redLetterVerses = data.verses || {};
    } catch (error) {
        console.error("Unable to load red-letter data.", error);
        redLetterVerses = {};
    }
}

function showWelcomeScreen() {
    document.body.classList.remove("scripture-mode");
    document.body.classList.remove("hymnal-mode");
    document.body.classList.add("welcome-mode");

    welcomeScreen.style.display = "flex";
    scriptureScreen.style.display = "none";
    hymnalScreen.style.display = "none";
}

function showScriptureScreen() {
    document.body.classList.remove("welcome-mode");
    document.body.classList.remove("hymnal-mode");
    document.body.classList.add("scripture-mode");

    welcomeScreen.style.display = "none";
    scriptureScreen.style.display = "block";
    hymnalScreen.style.display = "none";

    loadScripture();
}

function showHymnalScreen() {
    document.body.classList.remove("welcome-mode");
    document.body.classList.remove("scripture-mode");
    document.body.classList.add("hymnal-mode");

    welcomeScreen.style.display = "none";
    scriptureScreen.style.display = "none";
    hymnalScreen.style.display = "block";

    loadHymn();
}

function loadHymn() {
    const storedHymn = localStorage.getItem("displayedHymnData");

    const titleContainer =
        document.getElementById("hymnalTitleText");
    const wordsContainer =
        document.getElementById("hymnalWordsText");

    if (!storedHymn) {
        titleContainer.textContent = "";
        wordsContainer.textContent = "No hymn selected.";
        return;
    }

    try {
        const hymn = JSON.parse(storedHymn);

        titleContainer.textContent =
            `#${hymn.number} — ${hymn.title}`;
        wordsContainer.textContent = hymn.words;
    } catch (error) {
        console.error("Unable to read hymn data.", error);

        titleContainer.textContent = "";
        wordsContainer.textContent = "Unable to load hymn.";
    }
}

function loadCurrentDisplayMode() {

    const savedMode =
        localStorage.getItem("displayMode") || "welcome";

    console.log("Loading mode:", savedMode);

    if (savedMode === "scripture") {
        showScriptureScreen();
    } else {
        showWelcomeScreen();
    }
}

function loadScripture() {
    const storedScripture =
        localStorage.getItem("scriptureData");

    const verseContainer =
        document.getElementById("verseText");

    const referenceContainer =
        document.getElementById("referenceText");

    if (!storedScripture) {
        referenceContainer.textContent = "";
        verseContainer.textContent = "No scripture selected.";
        return;
    }

    let scripture;

    try {
        scripture = JSON.parse(storedScripture);
    } catch (error) {
        console.error("Unable to read scripture data.", error);

        referenceContainer.textContent = "";
        verseContainer.textContent = "Unable to load scripture.";
        return;
    }

    if (!scripture || !Array.isArray(scripture.verses)) {
        referenceContainer.textContent = "";
        verseContainer.textContent = "No scripture selected.";
        return;
    }

    referenceContainer.textContent = scripture.reference;

    let html = "";

    scripture.verses.forEach((verse) => {
        const formattedText = formatVerseText(
            verse.text,
            scripture.reference.split(":")[0],
            verse.verse
        );

        html += `
            <p class="verse">
                <sup class="verse-number">${verse.verse}</sup>
                ${formattedText}
            </p>
        `;
    });

    // Font size stays constant regardless of passage length —
    // no more auto-shrinking for longer scriptures.
    verseContainer.className = "";

    verseContainer.innerHTML = html;

    const scriptureContainer =
        document.getElementById("scriptureContainer");

    if (scriptureContainer) {
        scriptureContainer.scrollTop = 0;
    }
}

function formatVerseText(text, reference, verseNumber) {
    const redWords =
        redLetterVerses[`${reference}:${verseNumber}`];

    if (!redWords) {
        return text;
    }

    if (redWords === "full") {
        return `<span class="words-of-christ">${text}</span>`;
    }

    const escaped = redWords.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const pattern = new RegExp(escaped, "i");

    return text.replace(
        pattern,
        '<span class="words-of-christ">$&</span>'
    );
}

function updateWelcomeDate() {
    const today = new Date();

    welcomeDate.textContent = today.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}

const countdownLabel = document.getElementById("countdownLabel");

function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return (
            `${hours}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );
    }

    return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
    );
}

function extractBookName(reference) {
    const match = reference.match(
        /^(.*)\s+\d+(?::\d+(?:-\d+)?)?$/
    );

    return match ? match[1] : reference;
}

function incrementBookUsage(reference) {
    if (!reference) return;

    const bookName = extractBookName(reference);

    let counts;

    try {
        counts = JSON.parse(
            localStorage.getItem("bookUsageCounts") || "{}"
        );
    } catch (error) {
        counts = {};
    }

    counts[bookName] = (counts[bookName] || 0) + 1;

    localStorage.setItem("bookUsageCounts", JSON.stringify(counts));
}

/*
 * Switches straight to whatever scripture is currently prepared,
 * writing the same localStorage keys the control page writes when
 * "Display" is clicked, so the control page's status panel (in
 * another tab) stays in sync automatically.
 */
function autoDisplayPreparedScripture() {
    const preparedScriptureData =
        localStorage.getItem("preparedScriptureData");

    const preparedReference =
        localStorage.getItem("preparedReference");

    const preparedTranslation =
        localStorage.getItem("preparedTranslation") || "KJV";

    if (!preparedScriptureData || !preparedReference) {
        // Nothing was prepared — just stop the countdown quietly.
        return;
    }

    localStorage.setItem("scriptureData", preparedScriptureData);
    localStorage.setItem("referenceText", preparedReference);
    localStorage.setItem("selectedTranslation", preparedTranslation);
    localStorage.setItem("displayedReference", preparedReference);
    localStorage.setItem("displayedTranslation", preparedTranslation);

    // Count this as real usage for the Frequently Used shortcuts.
    incrementBookUsage(preparedReference);

    localStorage.removeItem("preparedScriptureData");
    localStorage.removeItem("preparedReference");
    localStorage.removeItem("preparedTranslation");

    localStorage.setItem("displayMode", "scripture");
    localStorage.setItem("scriptureUpdated", Date.now().toString());

    showScriptureScreen();
}

function updateCountdown() {
    const active =
        localStorage.getItem("countdownActive") === "true";

    const endTime =
        Number(localStorage.getItem("countdownEndTime"));

    if (!active || !endTime) {
        countdownLabel.classList.add("countdown-slot-hidden");
        countdown.classList.add("countdown-slot-hidden");
        return;
    }

    const remainingMs = endTime - Date.now();

    if (remainingMs <= 0) {
        countdown.textContent = "00:00";

        localStorage.setItem("countdownActive", "false");
        localStorage.removeItem("countdownEndTime");

        autoDisplayPreparedScripture();
        return;
    }

    countdownLabel.classList.remove("countdown-slot-hidden");
    countdown.classList.remove("countdown-slot-hidden");

    countdown.textContent = formatDuration(remainingMs);
}

    
async function initializeDisplay() {

    // Always start the display on the Welcome screen.
    showWelcomeScreen();

    updateWelcomeDate();
    updateCountdown();

    await loadRedLetterData();

    setInterval(updateCountdown, 1000);

    setupFullscreenPrompt();
}

/*
 * Browsers will never let a page force itself into fullscreen
 * without a click — that's a hard security rule. So instead, show
 * one big, unmissable button whenever the page isn't already
 * fullscreen (e.g. after a restart, or if this window was
 * accidentally closed and reopened). One tap is all recovery
 * ever takes.
 */
function setupFullscreenPrompt() {
    const fullscreenPrompt =
        document.getElementById("fullscreenPrompt");
    const enterFullscreenButton =
        document.getElementById("enterFullscreenButton");

    function updatePromptVisibility() {
        fullscreenPrompt.style.display =
            document.fullscreenElement ? "none" : "flex";
    }

    enterFullscreenButton.addEventListener("click", () => {
        document.documentElement
            .requestFullscreen()
            .catch(() => {
                // If it fails, the button just stays visible to try again.
            });

        // Try to set up automatic screen-change handling now, while
        // we have a genuine user click to work with (this is what
        // lets a future screen connection grant permission).
        trySetupAutoScreenMove();
    });

    document.addEventListener(
        "fullscreenchange",
        updatePromptVisibility
    );

    updatePromptVisibility();

    // Also try silently on every load, in case permission was
    // already granted during a previous visit — no click needed then.
    trySetupAutoScreenMove();
}

let autoScreenMoveReady = false;

/*
 * Experimental: lets the Display page automatically move itself onto
 * a newly-connected external screen (like a TV plugged in after the
 * Chromebook is already awake) with no click needed — but only once
 * the browser has granted the needed permissions, which normally
 * requires having clicked "Tap to Enter Fullscreen" at least once
 * before. If this isn't supported or permission isn't granted, it
 * fails silently and the manual button remains the reliable fallback.
 */
async function trySetupAutoScreenMove() {
    if (autoScreenMoveReady) return;
    if (!("getScreenDetails" in window)) return;

    try {
        const screenDetails = await window.getScreenDetails();
        autoScreenMoveReady = true;

        screenDetails.addEventListener("screenschange", async () => {
            if (!document.fullscreenElement) return;

            const externalScreen = screenDetails.screens.find(
                (screen) => !screen.isInternal
            );

            if (externalScreen) {
                try {
                    await document.documentElement.requestFullscreen({
                        screen: externalScreen
                    });
                } catch (error) {
                    // Automatic move wasn't allowed this time — the
                    // manual button is still there as a fallback.
                }
            }
        });
    } catch (error) {
        // Permission not granted yet, or not supported on this
        // browser/device — silently rely on the manual button only.
    }
}

window.addEventListener("storage", async (event) => {
    console.log("Storage event:", event.key, event.newValue);

    if (event.key === "scriptureUpdated") {
        console.log("Loading scripture...");
        await loadRedLetterData();
        loadScripture();
    }

    if (
        event.key === "countdownActive" ||
        event.key === "countdownEndTime"
    ) {
        updateCountdown();
    }

    if (event.key === "hymnalUpdated") {
        loadHymn();
    }

    if (event.key === "displayMode") {
        console.log("Display mode changed:", event.newValue);

        if (event.newValue === "scripture") {
            showScriptureScreen();
        } else if (event.newValue === "hymnal") {
            showHymnalScreen();
        } else if (event.newValue === "welcome") {
            showWelcomeScreen();
        }
    }
});

initializeDisplay();