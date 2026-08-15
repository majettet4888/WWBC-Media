console.log("APP.JS VERSION 20260814g");

document.addEventListener("DOMContentLoaded", () => {
    const prepareButton = document.getElementById("prepareButton");
    const displayNowButton = document.getElementById("displayNowButton");
    const returnWelcomeButton =
        document.getElementById("returnWelcomeButton");

    const newServiceButton =
    document.getElementById("newServiceButton");

    const newServiceConfirmOverlay =
        document.getElementById("newServiceConfirmOverlay");
    const confirmNewServiceYes =
        document.getElementById("confirmNewServiceYes");
    const confirmNewServiceCancel =
        document.getElementById("confirmNewServiceCancel");

    const referenceInput = document.getElementById("reference");
    const translationSelect = document.getElementById("translation");
    const suggestionsBox = document.getElementById("bookSuggestions");
    const recentReferencesRow =
        document.getElementById("recentReferencesRow");
    const recentReferencesButtons =
        document.getElementById("recentReferencesButtons");

    const statusMessage = document.getElementById("statusMessage");
    const currentDisplayText =
        document.getElementById("currentDisplayText");
    const preparedScriptureText =
        document.getElementById("preparedScriptureText");
    
    const displayConnectionDot =
    document.getElementById("displayConnectionDot");

    const preparedScripturePreview =
    document.getElementById("preparedScripturePreview");

    const scrollUpButton = document.getElementById("scrollUpButton");
    const scrollDownButton = document.getElementById("scrollDownButton");
    const livePreviewBox = document.getElementById("livePreviewBox");
    const livePreviewHeader =
        document.getElementById("livePreviewHeader");
    const closePreviewButton =
        document.getElementById("closePreviewButton");
    const reopenPreviewTab =
        document.getElementById("reopenPreviewTab");
    const previewResizeHandleLeft =
        document.getElementById("previewResizeHandleLeft");
    const previewResizeHandleRight =
        document.getElementById("previewResizeHandleRight");

    const countdownHoursInput =
        document.getElementById("countdownHours");
    const countdownMinutesInput =
        document.getElementById("countdownMinutes");
    const startCountdownButton =
        document.getElementById("startCountdownButton");
    const cancelCountdownButton =
        document.getElementById("cancelCountdownButton");
    const countdownStatusRow =
        document.getElementById("countdownStatusRow");
    const countdownStatusText =
        document.getElementById("countdownStatusText");

    const browseBibleButton =
        document.getElementById("browseBibleButton");
    const browseBibleOverlay =
        document.getElementById("browseBibleOverlay");
    const browseTitle =
        document.getElementById("browseTitle");
    const browseGrid =
        document.getElementById("browseGrid");
    const browseBackButton =
        document.getElementById("browseBackButton");
    const browseCloseButton =
        document.getElementById("browseCloseButton");

    const browseRangeRow =
        document.getElementById("browseRangeRow");
    const browseRangeStart =
        document.getElementById("browseRangeStart");
    const browseRangeEnd =
        document.getElementById("browseRangeEnd");
    const browseUseRangeButton =
        document.getElementById("browseUseRangeButton");
    const browseRangeError =
        document.getElementById("browseRangeError");

   
    const bibleBooks = [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
        "Joshua", "Judges", "Ruth",
        "1 Samuel", "2 Samuel",
        "1 Kings", "2 Kings",
        "1 Chronicles", "2 Chronicles",
        "Ezra", "Nehemiah", "Esther", "Job",
        "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
        "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
        "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
        "Nahum", "Habakkuk", "Zephaniah", "Haggai",
        "Zechariah", "Malachi",
        "Matthew", "Mark", "Luke", "John", "Acts",
        "Romans",
        "1 Corinthians", "2 Corinthians",
        "Galatians", "Ephesians", "Philippians", "Colossians",
        "1 Thessalonians", "2 Thessalonians",
        "1 Timothy", "2 Timothy",
        "Titus", "Philemon", "Hebrews", "James",
        "1 Peter", "2 Peter",
        "1 John", "2 John", "3 John",
        "Jude", "Revelation"
    ];


    let selectedSuggestion = -1;
    let currentMatches = [];

    function focusReferenceInput() {
        referenceInput.focus();
        referenceInput.select();
    }

    function getSelectedTranslation() {
        return translationSelect?.value?.toUpperCase() || "KJV";
    }

    function getScripturePreview(scripture) {
    if (
        !scripture ||
        !Array.isArray(scripture.verses) ||
        scripture.verses.length === 0
    ) {
        return "No scripture prepared.";
    }

    const firstVerse = scripture.verses[0];

    const previewText =
        `${firstVerse.verse}. ${firstVerse.text}`.trim();

    const previewLimit = 160;

    if (previewText.length > previewLimit) {
        return `${previewText.slice(0, previewLimit).trim()}...`;
    }

    return previewText;
}

    function renderCountdownStatus() {
        const active =
            localStorage.getItem("countdownActive") === "true";

        const endTime =
            Number(localStorage.getItem("countdownEndTime"));

        if (!active || !endTime) {
            countdownStatusRow.style.display = "none";
            countdownStatusText.style.display = "none";
            return;
        }

        const remainingMs = endTime - Date.now();

        if (remainingMs <= 0) {
            countdownStatusRow.style.display = "none";
            countdownStatusText.style.display = "none";
            return;
        }

        countdownStatusRow.style.display = "block";
        countdownStatusText.style.display = "block";

        countdownStatusText.textContent =
            formatDuration(remainingMs);
    }

    function formatDuration(ms) {
        const totalSeconds = Math.max(
            0,
            Math.floor(ms / 1000)
        );

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
            `${minutes}:` +
            `${String(seconds).padStart(2, "0")}`
        );
    }

    function startCountdown() {
        const preparedScriptureData =
            localStorage.getItem("preparedScriptureData");

        if (!preparedScriptureData) {
            statusMessage.textContent =
                "🔴 Prepare a scripture first — the countdown needs " +
                "something to switch to when it ends.";
            return;
        }

        const hours =
            Number(countdownHoursInput.value) || 0;
        const minutes =
            Number(countdownMinutesInput.value) || 0;

        const totalMs = ((hours * 60) + minutes) * 60 * 1000;

        if (totalMs <= 0) {
            statusMessage.textContent =
                "🔴 Enter a countdown time (hours and/or minutes).";
            return;
        }

        const endTime = Date.now() + totalMs;

        localStorage.setItem(
            "countdownEndTime",
            endTime.toString()
        );

        localStorage.setItem("countdownActive", "true");

        // Countdown always runs on the Welcome screen.
        localStorage.setItem("displayMode", "welcome");
        currentDisplayText.textContent = "Welcome Screen";

        statusMessage.textContent =
            "🟢 Countdown started — " +
            formatDuration(totalMs) +
            " until service.";

        renderCountdownStatus();
        focusReferenceInput();
    }

    function cancelCountdown() {
        localStorage.removeItem("countdownEndTime");
        localStorage.setItem("countdownActive", "false");

        countdownHoursInput.value = "";
        countdownMinutesInput.value = "";

        renderCountdownStatus();
    }

    /*
     * Browse Bible: tap a book, then a chapter, then a verse.
     * No typing required. Selecting a verse auto-prepares that
     * reference — Display, Start Countdown, and Welcome all still
     * work exactly as they do after typing + Prepare manually.
     */
    const browseState = {
        step: "book",
        book: null,
        chapter: null,
        pendingReference: null
    };

    function openBrowseBible() {
        browseState.step = "book";
        browseState.book = null;
        browseState.chapter = null;
        browseState.pendingReference = null;

        renderBrowseStep();

        browseBibleOverlay.style.display = "flex";
    }

    function closeBrowseBible() {
        browseBibleOverlay.style.display = "none";
    }

    function browseGoBack() {
        if (browseState.step === "confirm") {
            browseState.step = "verse";
        } else if (browseState.step === "verse") {
            browseState.step = "chapter";
        } else if (browseState.step === "chapter") {
            browseState.step = "book";
        }

        renderBrowseStep();
    }

    async function renderBrowseStep() {
        browseGrid.innerHTML =
            "<div style='padding:20px;color:#888;'>Loading…</div>";

        browseBackButton.style.visibility =
            browseState.step === "book" ? "hidden" : "visible";

        browseRangeRow.style.display = "none";

        if (browseState.step === "book") {
            browseTitle.textContent = "Select a Book";
            renderBookGrid();
            return;
        }

        if (browseState.step === "chapter") {
            browseTitle.textContent = `${browseState.book} — Select a Chapter`;

            const chapterCount =
                await getChapterCount(browseState.book);

            renderNumberGrid(chapterCount, (chapterNumber) => {
                browseState.chapter = chapterNumber;
                browseState.step = "verse";
                renderBrowseStep();
            });

            return;
        }

        if (browseState.step === "verse") {
            browseTitle.textContent =
                `${browseState.book} ${browseState.chapter} — Select a Verse`;

            const verseCount = await getVerseCount(
                browseState.book,
                browseState.chapter
            );

            browseRangeRow.style.display = "flex";
            browseRangeError.style.display = "none";
            browseRangeError.textContent = "";
            browseRangeStart.min = "1";
            browseRangeStart.max = verseCount.toString();
            browseRangeEnd.min = "1";
            browseRangeEnd.max = verseCount.toString();
            browseRangeStart.value = "";
            browseRangeEnd.value = "";

            renderNumberGrid(verseCount, (verseNumber) => {
                selectBrowsedVerse(verseNumber);
            });

            return;
        }

        if (browseState.step === "confirm") {
            browseTitle.textContent = "Confirm Your Selection";

            browseGrid.className = "browse-scroll-container";
            browseGrid.innerHTML = "";

            const referenceHeading = document.createElement("div");
            referenceHeading.className = "browse-confirm-reference";
            referenceHeading.textContent = browseState.pendingReference;
            browseGrid.appendChild(referenceHeading);

            const previewBox = document.createElement("div");
            previewBox.className = "browse-confirm-preview";
            previewBox.textContent = "Loading preview…";
            browseGrid.appendChild(previewBox);

            const useButton = document.createElement("button");
            useButton.type = "button";
            useButton.className = "browse-confirm-use-button";
            useButton.textContent = "✅ Use This Reference";
            useButton.addEventListener("click", confirmBrowsedSelection);
            browseGrid.appendChild(useButton);

            try {
                const scripture = await getScripture(
                    browseState.pendingReference
                );

                previewBox.textContent = getScripturePreview(scripture);
            } catch (error) {
                previewBox.textContent =
                    "Unable to load a preview, but you can still use this reference.";
            }
        }
    }

    const SEED_FREQUENTLY_USED_BOOKS = [
        "Genesis", "Psalms", "Proverbs", "Isaiah",
        "Matthew", "Mark", "Luke", "John",
        "Acts", "Romans"
    ];

    const OLD_TESTAMENT_COUNT = 39;
    const FREQUENTLY_USED_LIMIT = 10;

    function extractBookName(reference) {
        const match = reference.match(
            /^(.*)\s+\d+(?::\d+(?:-\d+)?)?$/
        );

        return match ? match[1] : reference;
    }

    function getBookUsageCounts() {
        let counts;

        try {
            counts = JSON.parse(
                localStorage.getItem("bookUsageCounts") || "null"
            );
        } catch (error) {
            counts = null;
        }

        if (!counts) {
            counts = {};

            SEED_FREQUENTLY_USED_BOOKS.forEach((bookName) => {
                counts[bookName] = 1;
            });

            localStorage.setItem(
                "bookUsageCounts",
                JSON.stringify(counts)
            );
        }

        return counts;
    }

    function incrementBookUsage(reference) {
        if (!reference) return;

        const bookName = extractBookName(reference);
        const counts = getBookUsageCounts();

        counts[bookName] = (counts[bookName] || 0) + 1;

        localStorage.setItem(
            "bookUsageCounts",
            JSON.stringify(counts)
        );
    }

    function getFrequentlyUsedBooks() {
        const counts = getBookUsageCounts();

        return Object.keys(counts)
            .sort((a, b) => counts[b] - counts[a])
            .slice(0, FREQUENTLY_USED_LIMIT);
    }

    function renderBookGrid() {
        browseGrid.className = "browse-scroll-container";
        browseGrid.innerHTML = "";

        const oldTestamentBooks = books.slice(0, OLD_TESTAMENT_COUNT);
        const newTestamentBooks = books.slice(OLD_TESTAMENT_COUNT);

        appendBookSection(
            "Frequently Used",
            getFrequentlyUsedBooks(),
            "frequently-used-grid"
        );

        appendBookSection("Old Testament", oldTestamentBooks, "book-grid");
        appendBookSection("New Testament", newTestamentBooks, "book-grid");
    }

    function appendBookSection(title, bookNames, gridClass) {
        const heading = document.createElement("div");
        heading.className = "browse-section-title";
        heading.textContent = title;
        browseGrid.appendChild(heading);

        const grid = document.createElement("div");
        grid.className = gridClass;

        bookNames.forEach((bookName) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = bookName;

            button.addEventListener("click", () => {
                browseState.book = bookName;
                browseState.step = "chapter";
                renderBrowseStep();
            });

            grid.appendChild(button);
        });

        browseGrid.appendChild(grid);
    }

    function renderNumberGrid(count, onSelect) {
        browseGrid.className = "browse-grid numbers-grid";
        browseGrid.innerHTML = "";

        for (let number = 1; number <= count; number++) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = number.toString();

            button.addEventListener("click", () => onSelect(number));

            browseGrid.appendChild(button);
        }
    }

    function selectBrowsedVerse(verseNumber) {
        browseState.pendingReference =
            `${browseState.book} ${browseState.chapter}:${verseNumber}`;

        browseState.step = "confirm";
        renderBrowseStep();
    }

    function selectBrowsedRange() {
        const start = Number(browseRangeStart.value);
        const end = Number(browseRangeEnd.value);
        const maxVerse = Number(browseRangeEnd.max) || 999;

        if (!start || !end) {
            browseRangeError.textContent =
                "Enter both a start and end verse for the range.";
            browseRangeError.style.display = "block";
            return;
        }

        if (start > end) {
            browseRangeError.textContent =
                "Start verse must come before the end verse.";
            browseRangeError.style.display = "block";
            return;
        }

        if (start < 1 || end > maxVerse) {
            browseRangeError.textContent =
                `${browseState.book} ${browseState.chapter} only has ` +
                `${maxVerse} verses.`;
            browseRangeError.style.display = "block";
            return;
        }

        browseRangeError.style.display = "none";

        browseState.pendingReference = start === end
            ? `${browseState.book} ${browseState.chapter}:${start}`
            : `${browseState.book} ${browseState.chapter}:${start}-${end}`;

        browseState.step = "confirm";
        renderBrowseStep();
    }

    function confirmBrowsedSelection() {
        referenceInput.value = browseState.pendingReference;

        closeBrowseBible();

        statusMessage.textContent =
            "🟡 Reference selected — click Prepare to continue.";

        prepareButton.focus();
    }

    function updateInitialStatus() {
        const displayMode =
            localStorage.getItem("displayMode") || "welcome";

        const preparedReference =
            localStorage.getItem("preparedReference");

        const preparedTranslation =
            localStorage.getItem("preparedTranslation");

        const displayedReference =
            localStorage.getItem("displayedReference");

        const displayedTranslation =
            localStorage.getItem("displayedTranslation");

        if (displayMode === "scripture" && displayedReference) {
            currentDisplayText.textContent =
                `${displayedReference} (${displayedTranslation || "KJV"})`;
        } else if (displayMode === "hymnal") {
            const displayedHymnData =
                localStorage.getItem("displayedHymnData");

            if (displayedHymnData) {
                try {
                    const hymn = JSON.parse(displayedHymnData);
                    currentDisplayText.textContent =
                        `Hymn: ${hymn.title || hymn.number}`;
                } catch (error) {
                    currentDisplayText.textContent = "Hymn Displayed";
                }
            } else {
                currentDisplayText.textContent = "Hymn Displayed";
            }
        } else {
            currentDisplayText.textContent = "Welcome Screen";
        }

        if (preparedReference) {
            preparedScriptureText.textContent =
                `${preparedReference} (${preparedTranslation || "KJV"})`;
        } else {
            preparedScriptureText.textContent = "None";
        }
    }

    /*
     * Recently Displayed — remembers the last several scriptures
     * actually shown on the TV (reference + translation), so going
     * back to one (e.g. after a detour to another passage) is a
     * single tap instead of retyping it. Capped at 6, most recent
     * first, no duplicate entries for the same reference.
     */
    const RECENT_REFERENCES_LIMIT = 6;

    function getRecentReferences() {
        try {
            return JSON.parse(
                localStorage.getItem("recentReferences") || "[]"
            );
        } catch (error) {
            return [];
        }
    }

    function renderRecentReferences() {
        const recent = getRecentReferences();

        recentReferencesButtons.innerHTML = "";

        if (recent.length === 0) {
            recentReferencesRow.style.display = "none";
            return;
        }

        recentReferencesRow.style.display = "block";

        recent.forEach((entry) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "recent-reference-chip";
            chip.textContent = entry.reference;

            chip.addEventListener("click", () => {
                recallRecentReference(entry);
            });

            recentReferencesButtons.appendChild(chip);
        });
    }

    function recordRecentReference(reference, translation) {
        let recent = getRecentReferences();

        // Move an existing entry to the front instead of duplicating it.
        recent = recent.filter(
            (entry) => entry.reference !== reference
        );

        recent.unshift({ reference, translation });

        recent = recent.slice(0, RECENT_REFERENCES_LIMIT);

        localStorage.setItem(
            "recentReferences",
            JSON.stringify(recent)
        );

        renderRecentReferences();
    }

    /*
     * One tap: re-fetches the passage text (translations can change,
     * so this always pulls fresh rather than trusting stale cached
     * text) and puts it straight up on the TV, same as Prepare +
     * Display combined.
     */
    async function recallRecentReference(entry) {
        referenceInput.value = entry.reference;

        const translationValue = (entry.translation || "KJV")
            .toLowerCase();

        if (
            [...translationSelect.options].some(
                (option) => option.value === translationValue
            )
        ) {
            translationSelect.value = translationValue;
        }

        statusMessage.textContent = "🟡 Preparing Scripture...";

        try {
            const scripture = await getScripture(entry.reference);

            localStorage.setItem(
                "preparedScriptureData",
                JSON.stringify(scripture)
            );
            localStorage.setItem(
                "preparedReference",
                scripture.reference
            );
            localStorage.setItem(
                "preparedTranslation",
                translationSelect.value.toUpperCase()
            );

            preparedScriptureText.textContent =
                `${scripture.reference} (${translationSelect.value.toUpperCase()})`;
            preparedScripturePreview.textContent =
                getScripturePreview(scripture);
            preparedScripturePreview.style.display = "block";
            displayNowButton.disabled = false;

            displayPreparedScripture();
        } catch (error) {
            console.error(error);

            statusMessage.textContent =
                "🔴 Unable to re-display that scripture.";
        }
    }

    async function prepareScripture() {
        const reference = referenceInput.value.trim();
        const translation = getSelectedTranslation();

        if (reference === "") {
            statusMessage.textContent =
                "🔴 Please enter a Bible reference.";

            referenceInput.focus();
            return;
        }

        statusMessage.textContent = "🟡 Preparing Scripture...";
        prepareButton.disabled = true;
        displayNowButton.disabled = true;

        try {
            const scripture = await getScripture(reference);

            localStorage.setItem(
                "preparedScriptureData",
                JSON.stringify(scripture)
            );

            localStorage.setItem(
                "preparedReference",
                scripture.reference
            );

            localStorage.setItem(
                "preparedTranslation",
                translation
            );

         preparedScriptureText.textContent =
    `${scripture.reference} (${translation})`;

preparedScripturePreview.textContent =
    getScripturePreview(scripture);

    preparedScripturePreview.style.display = "block";

statusMessage.textContent = "🟢 Scripture Prepared";
displayNowButton.disabled = false;

        } catch (error) {
            console.error(error);

            const errorMessage =
                error?.message || "Unable to retrieve Scripture.";

            if (
                errorMessage.toLowerCase().includes("not found") ||
                errorMessage.toLowerCase().includes("invalid")
            ) {
                statusMessage.textContent =
                    "🔴 Scripture Not Found — check the reference.";
            } else {
                statusMessage.textContent =
                    "🔴 Unable to retrieve Scripture.";
            }
      } finally {
    prepareButton.disabled = false;
    focusReferenceInput();
}
    }

    function displayPreparedScripture() {

        // Clicking Display always bypasses the countdown immediately,
        // so stop it here too — same as the Welcome button — to avoid
        // a leftover countdown still ticking on screen after the fact.
        cancelCountdown();

        const preparedScriptureData =
            localStorage.getItem("preparedScriptureData");

        const preparedReference =
            localStorage.getItem("preparedReference");

        const preparedTranslation =
            localStorage.getItem("preparedTranslation") || "KJV";

        if (!preparedScriptureData || !preparedReference) {
            statusMessage.textContent =
                "🔴 Prepare a scripture first.";

            referenceInput.focus();
            return;
        }

        localStorage.setItem(
            "scriptureData",
            preparedScriptureData
        );

        localStorage.setItem(
            "referenceText",
            preparedReference
        );

        localStorage.setItem(
            "selectedTranslation",
            preparedTranslation
        );

        localStorage.setItem(
            "displayedReference",
            preparedReference
        );

        localStorage.setItem(
            "displayedTranslation",
            preparedTranslation
        );

        // Count this as real usage for the Frequently Used shortcuts.
        incrementBookUsage(preparedReference);

        /*
         * Tell the display page to load the prepared scripture,
         * then switch from Welcome Mode to Scripture Mode.
         */
        localStorage.setItem(
            "scriptureUpdated",
            Date.now().toString()
        );

        localStorage.setItem(
            "displayMode",
            "scripture"
        );

        currentDisplayText.textContent =
            `${preparedReference} (${preparedTranslation})`;

        showLivePreview();
        recordRecentReference(preparedReference, preparedTranslation);

statusMessage.textContent = "🟢 Scripture Displayed";

localStorage.removeItem("preparedScriptureData");
localStorage.removeItem("preparedReference");
localStorage.removeItem("preparedTranslation");

referenceInput.value = "";

preparedScriptureText.textContent = "None";
preparedScripturePreview.textContent = "";
preparedScripturePreview.style.display = "none";

displayNowButton.disabled = true;

focusReferenceInput();
}

focusReferenceInput();

 function returnToWelcome() {

    // Manually returning to Welcome cancels any running countdown.
    cancelCountdown();

    localStorage.setItem("displayMode", "welcome");

    currentDisplayText.textContent = "Welcome Screen";
    statusMessage.textContent = "🟢 Welcome Screen Displayed";

    focusReferenceInput();
}

    /*
     * Live mini preview — an iframe of the actual Display page,
     * scaled down, so the operator can confirm exactly what's on
     * the TV (including watching it scroll) without turning to
     * look at it. It shows itself automatically whenever scripture
     * goes live, can be dragged anywhere out of the way, and if
     * it's closed it simply comes back the next time a scripture
     * is displayed — with a small tab to bring it back sooner if
     * needed, so it's never permanently "lost" mid-service.
     */
    function showLivePreview() {
        livePreviewBox.style.display = "block";
        reopenPreviewTab.style.display = "none";
    }

    function hideLivePreview() {
        livePreviewBox.style.display = "none";
        reopenPreviewTab.style.display = "block";
    }

    closePreviewButton.addEventListener("click", hideLivePreview);
    reopenPreviewTab.addEventListener("click", showLivePreview);

    // Dragging — grab the header, move the box, works with mouse
    // or touch (Chromebooks can have either).
    (function enablePreviewDragging() {
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        function startDrag(clientX, clientY) {
            const rect = livePreviewBox.getBoundingClientRect();

            dragging = true;
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;

            // Switch from right-anchored to left/top positioning
            // so it tracks the cursor naturally while dragging.
            livePreviewBox.style.right = "auto";
            livePreviewBox.style.left = `${rect.left}px`;
            livePreviewBox.style.top = `${rect.top}px`;
        }

        function moveDrag(clientX, clientY) {
            if (!dragging) return;

            const maxLeft = window.innerWidth - livePreviewBox.offsetWidth;
            const maxTop = window.innerHeight - livePreviewBox.offsetHeight;

            const newLeft = Math.min(
                Math.max(0, clientX - offsetX),
                Math.max(0, maxLeft)
            );
            const newTop = Math.min(
                Math.max(0, clientY - offsetY),
                Math.max(0, maxTop)
            );

            livePreviewBox.style.left = `${newLeft}px`;
            livePreviewBox.style.top = `${newTop}px`;
        }

        function endDrag() {
            dragging = false;
        }

        livePreviewHeader.addEventListener("mousedown", (e) => {
            startDrag(e.clientX, e.clientY);
        });

        window.addEventListener("mousemove", (e) => {
            moveDrag(e.clientX, e.clientY);
        });

        window.addEventListener("mouseup", endDrag);

        livePreviewHeader.addEventListener("touchstart", (e) => {
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (!dragging) return;
            const touch = e.touches[0];
            moveDrag(touch.clientX, touch.clientY);
        }, { passive: true });

        window.addEventListener("touchend", endDrag);
    })();

    // Resizing — drag either bottom corner to make the preview
    // bigger or smaller (right handle grows it to the right, left
    // handle grows it to the left — whichever side has more room on
    // screen). The iframe is re-scaled (not just cropped) so
    // enlarging it actually makes the text easier to read.
    (function enablePreviewResizing() {
        const MIN_WIDTH = 260;
        const MAX_WIDTH = 900;
        const NATIVE_WIDTH = 1000; // matches .live-preview-frame width
        const NATIVE_HEIGHT = 562; // matches .live-preview-frame height (16:9)

        let resizing = false;
        let anchor = "left"; // which edge stays fixed while resizing
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startLeft = 0;

        function applyScale(width) {
            livePreviewBox.style.setProperty(
                "--preview-scale",
                width / NATIVE_WIDTH
            );
        }

        function pinToLeftPositioning() {
            // Whether the box is still right-anchored (never moved)
            // or already left-anchored (previously dragged), lock in
            // its current on-screen position as explicit left/top
            // first — so growing width from here always behaves
            // predictably instead of depending on which anchor it
            // happened to have.
            const rect = livePreviewBox.getBoundingClientRect();
            livePreviewBox.style.right = "auto";
            livePreviewBox.style.left = `${rect.left}px`;
            livePreviewBox.style.top = `${rect.top}px`;
            return rect;
        }

        function startResize(clientX, clientY, side) {
            resizing = true;
            anchor = side;
            startX = clientX;
            startY = clientY;

            const rect = pinToLeftPositioning();
            startWidth = rect.width;
            startLeft = rect.left;
        }

        function moveResize(clientX, clientY) {
            if (!resizing) return;

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            // A true diagonal drag, like any normal corner-resize
            // handle: moving the cursor down (away from the box)
            // grows it just as much as moving it sideways does —
            // not just horizontal movement. Vertical movement is
            // converted to an equivalent width change using the
            // box's fixed aspect ratio, then combined with the
            // horizontal movement.
            const verticalAsWidth =
                deltaY * (NATIVE_WIDTH / NATIVE_HEIGHT);

            let widthDelta;
            let newLeft;

            if (anchor === "right") {
                // Left edge pinned — dragging right or down grows it.
                widthDelta = deltaX + verticalAsWidth;
                newLeft = startLeft;
            } else {
                // Right edge pinned — dragging left or down grows it.
                widthDelta = -deltaX + verticalAsWidth;
                newLeft = startLeft - deltaX;
            }

            const newWidth = startWidth + widthDelta;

            const clampedWidth = Math.min(
                Math.max(newWidth, MIN_WIDTH),
                MAX_WIDTH
            );

            // If we hit the min/max clamp, keep the pinned edge
            // truly fixed by adjusting left only for the left-handle
            // case (right-handle case never needs to move left).
            if (anchor === "left") {
                const overshoot = newWidth - clampedWidth;
                newLeft = newLeft + overshoot;
            }

            livePreviewBox.style.width = `${clampedWidth}px`;
            livePreviewBox.style.left = `${newLeft}px`;
            applyScale(clampedWidth);
        }

        function endResize() {
            resizing = false;
        }

        previewResizeHandleRight.addEventListener("mousedown", (e) => {
            startResize(e.clientX, e.clientY, "right");
            e.preventDefault();
        });

        previewResizeHandleLeft.addEventListener("mousedown", (e) => {
            startResize(e.clientX, e.clientY, "left");
            e.preventDefault();
        });

        window.addEventListener("mousemove", (e) => {
            moveResize(e.clientX, e.clientY);
        });

        window.addEventListener("mouseup", endResize);

        previewResizeHandleRight.addEventListener("touchstart", (e) => {
            const touch = e.touches[0];
            startResize(touch.clientX, touch.clientY, "right");
        }, { passive: true });

        previewResizeHandleLeft.addEventListener("touchstart", (e) => {
            const touch = e.touches[0];
            startResize(touch.clientX, touch.clientY, "left");
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (!resizing) return;
            const touch = e.touches[0];
            moveResize(touch.clientX, touch.clientY);
        }, { passive: true });

        window.addEventListener("touchend", endResize);

        // Set the initial scale to match the starting CSS width.
        applyScale(livePreviewBox.offsetWidth || 340);
    })();

    /*
     * Remote scroll — the preview iframe is the single source of
     * truth for scroll position. The Up/Down buttons scroll it
     * directly (which the operator sees happen instantly), and
     * scrolling the preview itself (wheel, trackpad, or dragging
     * its scrollbar) works too — either way, the resulting position
     * is broadcast to the real TV so both always match.
     */
    const livePreviewFrame =
        document.getElementById("livePreviewFrame");

    function broadcastScrollAnchor(container) {
        // Sync by WHICH VERSE is at the top of the screen, not by a
        // raw pixel or percentage position. A percentage still broke
        // because the preview and the real TV wrap the same text
        // into a different number of lines (different available
        // width), so an identical percentage landed on a different
        // verse in each. Verse numbers are the one thing that's
        // guaranteed identical in both places, so anchoring to the
        // actual verse — plus how far scrolled into it — is fully
        // immune to any width or font differences between them.
        const verses = container.querySelectorAll(".verse");

        if (verses.length === 0) {
            localStorage.setItem(
                "scrollPosition",
                JSON.stringify({
                    verseNumber: null,
                    fractionIntoVerse: 0,
                    ts: Date.now()
                })
            );
            return;
        }

        const containerTop = container.getBoundingClientRect().top;

        let anchorVerse = verses[0];

        for (const verseEl of verses) {
            const verseTop =
                verseEl.getBoundingClientRect().top - containerTop;

            // Verses are in order top-to-bottom, so the last one
            // whose top has scrolled up to (or past) the visible
            // top edge is the one currently being read.
            if (verseTop <= 4) {
                anchorVerse = verseEl;
            } else {
                break;
            }
        }

        const anchorRect = anchorVerse.getBoundingClientRect();
        const anchorHeight = anchorRect.height || 1;
        const offsetIntoVerse = containerTop - anchorRect.top;
        const fractionIntoVerse = Math.max(
            0,
            Math.min(1, offsetIntoVerse / anchorHeight)
        );

        const verseNumberEl =
            anchorVerse.querySelector(".verse-number");
        const verseNumber = verseNumberEl
            ? verseNumberEl.textContent.trim()
            : null;

        localStorage.setItem(
            "scrollPosition",
            JSON.stringify({
                verseNumber,
                fractionIntoVerse,
                ts: Date.now()
            })
        );
    }

    function getPreviewScriptureContainer() {
        try {
            return livePreviewFrame.contentDocument.getElementById(
                "scriptureContainer"
            );
        } catch (error) {
            // Iframe not ready yet — buttons/scroll will simply no-op
            // until it finishes loading.
            return null;
        }
    }

    function scrollPreviewBy(amount, smooth = true) {
        const container = getPreviewScriptureContainer();
        if (!container) return;

        // No manual broadcast here on purpose — the native "scroll"
        // listener attached below (attachPreviewScrollSync) already
        // fires continuously as this animates and broadcasts the
        // true, up-to-the-moment position every time. Broadcasting
        // separately here as well caused a race where this could
        // send a stale, mid-animation position that then overwrote
        // the correct one — that's what was causing the preview and
        // the TV to drift out of sync.
        container.scrollBy({
            top: amount,
            behavior: smooth ? "smooth" : "auto"
        });
    }

    /*
     * Press-and-hold continuous scroll — a quick tap does one normal
     * step; holding the button down keeps scrolling smoothly (not
     * too fast) until released, so long passages don't need
     * repeated clicking. Release is tracked on the whole window
     * (not just the button) so a slight cursor drift off the button
     * while your mouse is still held down doesn't cut it short.
     */
    function setupHoldToScroll(button, direction) {
        const TAP_STEP = 250;
        const HOLD_STEP = 35;
        const HOLD_INTERVAL_MS = 90;
        const HOLD_START_DELAY_MS = 350;

        let holdTimeout = null;
        let holdInterval = null;
        let isHolding = false;
        let isPressed = false;

        function startHold() {
            isPressed = true;
            isHolding = false;

            holdTimeout = setTimeout(() => {
                isHolding = true;
                holdInterval = setInterval(() => {
                    scrollPreviewBy(direction * HOLD_STEP, false);
                }, HOLD_INTERVAL_MS);
            }, HOLD_START_DELAY_MS);
        }

        function endHold() {
            if (!isPressed) return;
            isPressed = false;

            clearTimeout(holdTimeout);
            clearInterval(holdInterval);
            holdTimeout = null;
            holdInterval = null;

            if (!isHolding) {
                // It was a quick tap, not a hold — do the normal
                // single smooth step instead.
                scrollPreviewBy(direction * TAP_STEP, true);
            }

            isHolding = false;
        }

        button.addEventListener("mousedown", startHold);

        // Deliberately window-level, not button-level — a real
        // mouse held down rarely stays perfectly still, and ending
        // the hold on mouseleave made it stop the moment the cursor
        // twitched off the button, even though the button was still
        // pressed.
        window.addEventListener("mouseup", endHold);

        button.addEventListener("touchstart", (e) => {
            e.preventDefault();
            startHold();
        }, { passive: false });
        button.addEventListener("touchend", endHold);
        button.addEventListener("touchcancel", endHold);
    }

    setupHoldToScroll(scrollUpButton, -1);
    setupHoldToScroll(scrollDownButton, 1);

    // Wire up a listener so scrolling the preview directly (wheel,
    // trackpad, dragging its scrollbar) also drives the TV — not
    // just the buttons. The iframe can finish loading before this
    // script even runs, so a one-time "load" event isn't reliable;
    // instead, keep trying briefly until the container shows up,
    // and only attach once.
    let previewScrollSyncAttached = false;

    function attachPreviewScrollSync() {
        if (previewScrollSyncAttached) return true;

        const container = getPreviewScriptureContainer();
        if (!container) return false;

        container.addEventListener("scroll", () => {
            broadcastScrollAnchor(container);
        });

        previewScrollSyncAttached = true;
        return true;
    }

    if (!attachPreviewScrollSync()) {
        livePreviewFrame.addEventListener("load", attachPreviewScrollSync);

        const attachRetryInterval = setInterval(() => {
            if (attachPreviewScrollSync()) {
                clearInterval(attachRetryInterval);
            }
        }, 150);

        setTimeout(() => clearInterval(attachRetryInterval), 5000);
    }

    prepareButton.addEventListener(
        "click",
        prepareScripture
    );

    displayNowButton.addEventListener(
        "click",
        displayPreparedScripture
    );

    returnWelcomeButton.addEventListener(
        "click",
        returnToWelcome
    );

    browseBibleButton.addEventListener(
        "click",
        openBrowseBible
    );

    browseBackButton.addEventListener(
        "click",
        browseGoBack
    );

    browseCloseButton.addEventListener(
        "click",
        closeBrowseBible
    );

    browseUseRangeButton.addEventListener(
        "click",
        selectBrowsedRange
    );

    startCountdownButton.addEventListener(
        "click",
        startCountdown
    );

    cancelCountdownButton.addEventListener(
        "click",
        cancelCountdown
    );

    newServiceButton.addEventListener(
    "click",
    () => {
        newServiceConfirmOverlay.style.display = "flex";
    }
);

    confirmNewServiceCancel.addEventListener(
        "click",
        () => {
            newServiceConfirmOverlay.style.display = "none";
        }
    );

    confirmNewServiceYes.addEventListener(
        "click",
        () => {
            newServiceConfirmOverlay.style.display = "none";
            newService();
        }
    );

    function newService() {

    localStorage.removeItem("preparedScriptureData");
    localStorage.removeItem("preparedReference");
    localStorage.removeItem("preparedTranslation");

    localStorage.removeItem("displayedReference");
    localStorage.removeItem("displayedTranslation");

    localStorage.removeItem("scriptureData");
    localStorage.removeItem("referenceText");
    localStorage.removeItem("selectedTranslation");

    localStorage.removeItem("recentReferences");
    renderRecentReferences();

    localStorage.setItem("displayMode", "welcome");
    localStorage.setItem("serviceStarted", "false");

    localStorage.removeItem("countdownEndTime");
    localStorage.setItem("countdownActive", "false");

    countdownHoursInput.value = "";
    countdownMinutesInput.value = "";

    localStorage.setItem(
        "scriptureUpdated",
        Date.now().toString()
    );

    currentDisplayText.textContent = "Welcome Screen";

    preparedScriptureText.textContent = "None";
    preparedScripturePreview.textContent = "";
    preparedScripturePreview.style.display = "none";

    renderCountdownStatus();

    statusMessage.textContent = "🟢 Ready";

    displayNowButton.disabled = true;

    referenceInput.value = "";

    focusReferenceInput();
}

    /*
     * Pressing Enter prepares the scripture.
     * It does not change what appears on the TVs.
     */
    referenceInput.addEventListener("keydown", (event) => {
        if (
            event.key === "Enter" &&
            suggestionsBox.style.display !== "block"
        ) {
            event.preventDefault();
            prepareButton.click();
        }
    });

    referenceInput.addEventListener("input", () => {
        localStorage.removeItem("preparedScriptureData");
localStorage.removeItem("preparedReference");
localStorage.removeItem("preparedTranslation");

preparedScriptureText.textContent = "None";
preparedScripturePreview.textContent = "";
preparedScripturePreview.style.display = "none";
displayNowButton.disabled = true;

const value =
    referenceInput.value.trim().toLowerCase();

if (value === "") {
    statusMessage.textContent = "🟢 Ready";
} else {
    statusMessage.textContent = "🟡 Waiting to Prepare";
}

        suggestionsBox.innerHTML = "";
        selectedSuggestion = -1;

        if (value.length < 2) {
            suggestionsBox.style.display = "none";
            return;
        }

        currentMatches = bibleBooks.filter((book) =>
            book.toLowerCase().startsWith(value)
        );

        if (currentMatches.length === 0) {
            suggestionsBox.style.display = "none";
            return;
        }

        currentMatches.forEach((book, index) => {
            const item = document.createElement("div");

            item.className = "suggestion-item";
            item.textContent = book;

            if (index === 0) {
                item.style.backgroundColor = "#e9f2ff";
                selectedSuggestion = 0;
            }

            item.addEventListener("click", () => {
                referenceInput.value = `${book} `;

                suggestionsBox.style.display = "none";
                referenceInput.focus();
            });

            suggestionsBox.appendChild(item);
        });

        suggestionsBox.style.display = "block";
    });

    referenceInput.addEventListener("keydown", (event) => {
        const items =
            suggestionsBox.querySelectorAll(".suggestion-item");

        if (
            suggestionsBox.style.display !== "block" ||
            items.length === 0
        ) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            selectedSuggestion++;

            if (selectedSuggestion >= items.length) {
                selectedSuggestion = 0;
            }

        } else if (event.key === "ArrowUp") {
            event.preventDefault();

            selectedSuggestion--;

            if (selectedSuggestion < 0) {
                selectedSuggestion = items.length - 1;
            }

        } else if (event.key === "Enter") {
            event.preventDefault();

            if (selectedSuggestion >= 0) {
                items[selectedSuggestion].click();
            }

            return;

        } else if (event.key === "Escape") {
            suggestionsBox.style.display = "none";
            return;
        }

        items.forEach((item, index) => {
            item.style.backgroundColor =
                index === selectedSuggestion
                    ? "#e9f2ff"
                    : "";
        });
    });

displayNowButton.disabled = true;

// Clear previous session
localStorage.removeItem("preparedScriptureData");
localStorage.removeItem("preparedReference");
localStorage.removeItem("preparedTranslation");

localStorage.removeItem("displayedReference");
localStorage.removeItem("displayedTranslation");

// NEW
localStorage.removeItem("scriptureData");
localStorage.removeItem("referenceText");
localStorage.removeItem("selectedTranslation");

localStorage.setItem("displayMode", "welcome");
localStorage.setItem("serviceStarted", "false");

console.log("Startup cleanup finished");

function updateDisplayConnectionStatus() {
    const externalDisplayConnected =
        window.screen.isExtended === true;

    displayConnectionDot.classList.toggle(
        "connected",
        externalDisplayConnected
    );

    displayConnectionDot.classList.toggle(
        "disconnected",
        !externalDisplayConnected
    );

    displayConnectionDot.title = externalDisplayConnected
        ? "External display detected"
        : "No external display detected";
}

updateDisplayConnectionStatus();

window.addEventListener(
    "resize",
    updateDisplayConnectionStatus
);

updateInitialStatus();
renderCountdownStatus();

/*
 * The countdown itself runs on the Display page (display.js),
 * since that's the tab that's guaranteed to stay open on the
 * TVs. When it finishes, it writes the new displayMode/
 * preparedScripture state to localStorage. This listener keeps
 * the control page's status panel in sync with whatever the
 * Display page (or another open control tab) just did.
 */
window.addEventListener("storage", (event) => {
    if (
        event.key === "countdownActive" ||
        event.key === "countdownEndTime"
    ) {
        renderCountdownStatus();

        // The countdown just ended or was canceled from the Display
        // window (e.g. it reached 0:00 and switched to scripture) —
        // clear the leftover hour/minute values here too, so they
        // don't sit there looking like a countdown is still set.
        if (
            (event.key === "countdownActive" &&
                event.newValue === "false") ||
            (event.key === "countdownEndTime" &&
                event.newValue === null)
        ) {
            countdownHoursInput.value = "";
            countdownMinutesInput.value = "";
        }
    }

    if (
        event.key === "displayMode" ||
        event.key === "displayedReference" ||
        event.key === "displayedTranslation"
    ) {
        updateInitialStatus();

        if (
            event.key === "displayMode" &&
            event.newValue === "scripture"
        ) {
            showLivePreview();

            const displayedReference =
                localStorage.getItem("displayedReference");
            const displayedTranslation =
                localStorage.getItem("displayedTranslation");

            if (displayedReference) {
                recordRecentReference(
                    displayedReference,
                    displayedTranslation || "KJV"
                );
            }
        }
    }

    if (
        event.key === "preparedReference" ||
        event.key === "preparedTranslation"
    ) {
        const preparedReference =
            localStorage.getItem("preparedReference");

        const preparedTranslation =
            localStorage.getItem("preparedTranslation");

        if (preparedReference) {
            preparedScriptureText.textContent =
                `${preparedReference} (${preparedTranslation || "KJV"})`;
        } else {
            preparedScriptureText.textContent = "None";
        }
    }
});

setInterval(renderCountdownStatus, 1000);

renderRecentReferences();

preparedScriptureText.textContent = "None";
preparedScripturePreview.textContent = "";
preparedScripturePreview.style.display = "none";
displayNowButton.disabled = true;

window.addEventListener("focus", () => {
    setTimeout(() => {
        referenceInput.focus();
    }, 100);
});

setTimeout(() => {
    referenceInput.focus();
}, 200);
});