console.log("DISPLAY.JS VERSION 1");

// This page is also loaded in a small mirrored iframe on the Media
// Control page (the live preview). Flag that here once, so CSS can
// style a few things differently there (e.g. a larger, easier to
// grab scrollbar) without affecting the real TV.
const pageParams = new URLSearchParams(window.location.search);
const isFramed = window.self !== window.top;

/*
 * TEST MODE — open display.html?test on any computer to see exactly
 * what the TV shows, without a TV and without going fullscreen.
 * The real page renders at true TV size (1920x1080) inside a frame
 * and is shrunk to fit whatever size the window is, so line
 * wrapping and scrolling match the TV precisely even in a small,
 * side-by-side window. Handy for checking preview/TV sync at home.
 */
const isTestHarness = pageParams.has("test") && !isFramed;

// The mirrored copy inside the Control page's live preview is
// framed too — but so is the TV copy inside the test harness. The
// harness marks its frame with ?tv so it behaves as the real TV
// (follows scroll broadcasts) rather than as the preview.
const isPreview = isFramed && !pageParams.has("tv");

if (isTestHarness) {
    setupTestHarness();
} else if (isPreview) {
    document.body.classList.add("preview-mode");
}

function setupTestHarness() {
    const TV_WIDTH = 1920;
    const TV_HEIGHT = 1080;

    document.title = "WWBC Display — TEST MODE";
    document.body.className = "";
    document.body.style.cssText =
        "margin:0; background:#111; overflow:hidden;";
    document.body.innerHTML = "";

    const label = document.createElement("div");
    label.textContent =
        "TEST MODE — showing the TV at true 1920×1080, scaled to fit. " +
        "Remove ?test from the address for the real display.";
    label.style.cssText =
        "position:fixed; top:0; left:0; right:0; z-index:10; " +
        "padding:6px 12px; font:bold 13px Arial, sans-serif; " +
        "color:#111; background:#d4af37; text-align:center;";
    document.body.appendChild(label);

    const frame = document.createElement("iframe");
    frame.title = "TV";
    // Keep the same ?v= cache tag this page was loaded with.
    const v = pageParams.get("v");
    frame.src = "display.html?tv=1" + (v ? `&v=${encodeURIComponent(v)}` : "");
    frame.style.cssText =
        `border:none; width:${TV_WIDTH}px; height:${TV_HEIGHT}px; ` +
        "position:absolute; transform-origin:top left; " +
        "box-shadow:0 0 40px rgba(0,0,0,0.8);";
    document.body.appendChild(frame);

    function fit() {
        const labelHeight = label.offsetHeight;
        const availW = window.innerWidth;
        const availH = window.innerHeight - labelHeight;
        const scale = Math.min(availW / TV_WIDTH, availH / TV_HEIGHT);

        frame.style.transform = `scale(${scale})`;
        frame.style.left =
            `${Math.max(0, (availW - TV_WIDTH * scale) / 2)}px`;
        frame.style.top =
            `${labelHeight + Math.max(0, (availH - TV_HEIGHT * scale) / 2)}px`;
    }

    fit();
    window.addEventListener("resize", fit);
}

if (!isTestHarness) {
    runDisplay();
}

function runDisplay() {

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
    scriptureScreen.style.display = "flex";
    hymnalScreen.style.display = "none";

    loadScripture();
}

function showHymnalScreen() {
    document.body.classList.remove("welcome-mode");
    document.body.classList.remove("scripture-mode");
    document.body.classList.add("hymnal-mode");

    welcomeScreen.style.display = "none";
    scriptureScreen.style.display = "none";
    hymnalScreen.style.display = "flex";

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
    } else if (savedMode === "hymnal") {
        showHymnalScreen();
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

/*
 * Keeps this display's scroll position in sync with the Control
 * page's live preview — whichever one the operator interacts with
 * (the Up/Down buttons, or scrolling the preview itself directly)
 * broadcasts the preview's position, and this display matches it.
 *
 * The preview is now rendered at this screen's exact resolution
 * (1920x1080) with an identical text column width, so both lay the
 * passage out identically — same line breaks, same total scroll
 * height. When that's confirmed (the sender's scrollHeight equals
 * ours), the exact pixel scrollTop is copied over: a perfect,
 * line-for-line match.
 *
 * If the layouts ever DO differ (e.g. a different font installed
 * on the TV device wraps a line differently), the verse-anchor
 * method is used instead: "which verse is at the top, and how far
 * into it" — the verse number is identical in both places, so
 * that lands on the right text regardless of layout differences.
 */
function applyRemoteScroll(data) {
    const scriptureContainer =
        document.getElementById("scriptureContainer");

    if (!scriptureContainer) return;

    const hasPixelData =
        typeof data.scrollTop === "number" &&
        typeof data.scrollHeight === "number";

    const layoutsMatch =
        hasPixelData &&
        Math.abs(scriptureContainer.scrollHeight - data.scrollHeight) <= 2;

    if (layoutsMatch) {
        scrollContainerTo(scriptureContainer, data.scrollTop);
        return;
    }

    handleRemoteScrollAnchor(data.verseNumber, data.fractionIntoVerse);
}

/*
 * Small moves (the Up/Down buttons, or the operator dragging the
 * preview) glide smoothly so the TV doesn't visibly "step" between
 * the throttled updates it receives; a big jump (a fresh passage,
 * or catching up after a reload) goes straight there.
 */
function scrollContainerTo(container, top) {
    const distance = Math.abs(container.scrollTop - top);

    container.scrollTo({
        top,
        behavior: distance > 0 && distance < 400 ? "smooth" : "auto"
    });
}

function handleRemoteScrollAnchor(verseNumber, fractionIntoVerse) {
    const scriptureContainer =
        document.getElementById("scriptureContainer");

    if (!scriptureContainer) return;

    if (verseNumber === null || verseNumber === undefined) {
        scriptureContainer.scrollTop = 0;
        return;
    }

    const verses = scriptureContainer.querySelectorAll(".verse");
    let targetVerse = null;

    for (const verseEl of verses) {
        const numberEl = verseEl.querySelector(".verse-number");
        if (
            numberEl &&
            numberEl.textContent.trim() === String(verseNumber)
        ) {
            targetVerse = verseEl;
            break;
        }
    }

    if (!targetVerse) return;

    const containerRect =
        scriptureContainer.getBoundingClientRect();
    const verseRect = targetVerse.getBoundingClientRect();

    const verseTopRelativeToContainer =
        scriptureContainer.scrollTop +
        (verseRect.top - containerRect.top);

    const offsetWithinVerse =
        (fractionIntoVerse || 0) * (verseRect.height || 0);

    scrollContainerTo(
        scriptureContainer,
        verseTopRelativeToContainer + offsetWithinVerse
    );
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

    updateWelcomeDate();
    updateCountdown();

    await loadRedLetterData();

    if (isFramed) {
        // The preview must mirror whatever is ALREADY live — if the
        // Control page is refreshed mid-service, the TV is still
        // showing scripture, so the preview should come up on that
        // same scripture at the same scroll position, not on Welcome.
        // (The test-mode TV frame does the same, for convenience.)
        loadCurrentDisplayMode();
        restoreScrollFromStorage();
    } else {
        // The real TV always starts on the Welcome screen.
        showWelcomeScreen();
    }

    setInterval(updateCountdown, 1000);

    setupFullscreenPrompt();
}

function restoreScrollFromStorage() {
    const stored = localStorage.getItem("scrollPosition");
    if (!stored) return;

    try {
        const data = JSON.parse(stored);

        // Wait one frame so the freshly-rendered scripture has a
        // real layout to measure against before scrolling it.
        requestAnimationFrame(() => {
            const container =
                document.getElementById("scriptureContainer");
            if (!container) return;

            // Instant, not smooth — this is a restore, not a move.
            applyRemoteScrollInstant(container, data);
        });
    } catch (error) {
        // Nothing usable saved — just stay at the top.
    }
}

function applyRemoteScrollInstant(container, data) {
    const hasPixelData =
        typeof data.scrollTop === "number" &&
        typeof data.scrollHeight === "number";

    if (
        hasPixelData &&
        Math.abs(container.scrollHeight - data.scrollHeight) <= 2
    ) {
        container.scrollTop = data.scrollTop;
        return;
    }

    handleRemoteScrollAnchor(data.verseNumber, data.fractionIntoVerse);
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
    // This page is also loaded in a small mirrored iframe on the
    // Media Control page (the live preview) — that copy should
    // never show or act on the fullscreen prompt, since it's not
    // the real TV and can't (and shouldn't) go fullscreen itself.
    const isInPreviewIframe = window.self !== window.top;

    if (isInPreviewIframe) {
        const fullscreenPrompt =
            document.getElementById("fullscreenPrompt");
        fullscreenPrompt.style.display = "none";
        return;
    }

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

    if (
        event.key === "scrollPosition" &&
        event.newValue !== null &&
        !isPreview
    ) {
        // Only the real TV follows these. The preview is where the
        // position CAME from — it's a separate document, so it
        // receives its own broadcasts too, and previously it would
        // re-snap itself to the rounded-off anchor position mid-
        // scroll, fighting its own smooth motion and then sending
        // that corrected position out again. That loop was a big
        // part of the preview and TV never quite agreeing.
        try {
            applyRemoteScroll(JSON.parse(event.newValue));
        } catch (error) {
            console.error("Unable to read scroll position.", error);
        }
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

} // end runDisplay
