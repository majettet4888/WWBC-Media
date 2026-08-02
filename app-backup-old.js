document.addEventListener("DOMContentLoaded", () => {

    const hymnNumberInput = document.getElementById("hymnNumber");
    const lookupHymnButton = document.getElementById("lookupHymnButton");

    const newHymnPanel = document.getElementById("newHymnPanel");
    const hymnTitleInput = document.getElementById("hymnTitle");
    const hymnWordsInput = document.getElementById("hymnWords");
    const saveHymnButton = document.getElementById("saveHymnButton");

    const hymnPreviewPanel =
        document.getElementById("hymnPreviewPanel");
    const hymnPreviewTitle =
        document.getElementById("hymnPreviewTitle");
    const hymnPreviewWords =
        document.getElementById("hymnPreviewWords");

    const prepareHymnButton =
        document.getElementById("prepareHymnButton");
    const displayHymnButton =
        document.getElementById("displayHymnButton");
    const returnWelcomeHymnButton =
        document.getElementById("returnWelcomeHymnButton");
    const editHymnButton =
        document.getElementById("editHymnButton");

    const hymnStatusMessage =
        document.getElementById("hymnStatusMessage");
    const hymnCurrentDisplayText =
        document.getElementById("hymnCurrentDisplayText");
    const preparedHymnText =
        document.getElementById("preparedHymnText");

    let currentHymnNumber = null;

    function getHymnalLibrary() {
        try {
            return JSON.parse(
                localStorage.getItem("hymnalLibrary") || "{}"
            );
        } catch (error) {
            return {};
        }
    }

    function saveHymnalLibrary(library) {
        localStorage.setItem(
            "hymnalLibrary",
            JSON.stringify(library)
        );
    }

    function lookupHymn() {
        const number = hymnNumberInput.value.trim();

        if (!number) {
            hymnStatusMessage.textContent =
                "🔴 Enter a hymn number first.";
            return;
        }

        currentHymnNumber = number;

        const library = getHymnalLibrary();
        const existingHymn = library[number];

        if (existingHymn) {
            showHymnPreview(number, existingHymn);
            hymnStatusMessage.textContent =
                "🟢 Hymn found in your library.";
        } else {
            newHymnPanel.style.display = "block";
            hymnPreviewPanel.style.display = "none";

            hymnTitleInput.value = "";
            hymnWordsInput.value = "";

            hymnStatusMessage.textContent =
                "🟡 New hymn — type it in once to save it.";

            hymnTitleInput.focus();
        }
    }

    function saveHymn() {
        const title = hymnTitleInput.value.trim();
        const words = hymnWordsInput.value.trim();

        if (!title || !words) {
            hymnStatusMessage.textContent =
                "🔴 Enter both a title and the words before saving.";
            return;
        }

        const library = getHymnalLibrary();

        library[currentHymnNumber] = { title, words };

        saveHymnalLibrary(library);

        showHymnPreview(currentHymnNumber, { title, words });

        hymnStatusMessage.textContent =
            "🟢 Hymn saved to your library.";
    }

    function showHymnPreview(number, hymn) {
        newHymnPanel.style.display = "none";
        hymnPreviewPanel.style.display = "block";

        hymnPreviewTitle.textContent =
            `#${number} — ${hymn.title}`;

        hymnPreviewWords.textContent = hymn.words;
    }

    function editHymn() {
        const library = getHymnalLibrary();
        const hymn = library[currentHymnNumber];

        if (!hymn) return;

        newHymnPanel.style.display = "block";
        hymnPreviewPanel.style.display = "none";

        hymnTitleInput.value = hymn.title;
        hymnWordsInput.value = hymn.words;

        hymnStatusMessage.textContent =
            "🟡 Editing hymn — save to update your library.";
    }

    function prepareHymn() {
        const library = getHymnalLibrary();
        const hymn = library[currentHymnNumber];

        if (!hymn) {
            hymnStatusMessage.textContent =
                "🔴 Look up or save a hymn first.";
            return;
        }

        const preparedHymnData = {
            number: currentHymnNumber,
            title: hymn.title,
            words: hymn.words
        };

        localStorage.setItem(
            "preparedHymnData",
            JSON.stringify(preparedHymnData)
        );

        preparedHymnText.textContent =
            `#${currentHymnNumber} — ${hymn.title}`;

        hymnStatusMessage.textContent = "🟢 Hymn Prepared";
    }

    function displayHymn() {
        const preparedHymnData =
            localStorage.getItem("preparedHymnData");

        if (!preparedHymnData) {
            hymnStatusMessage.textContent =
                "🔴 Prepare a hymn first.";
            return;
        }

        localStorage.setItem("displayedHymnData", preparedHymnData);
        localStorage.setItem("displayMode", "hymnal");
        localStorage.setItem(
            "hymnalUpdated",
            Date.now().toString()
        );

        const hymn = JSON.parse(preparedHymnData);

        hymnCurrentDisplayText.textContent =
            `#${hymn.number} — ${hymn.title}`;

        hymnStatusMessage.textContent = "🟢 Hymn Displayed";
    }

    function returnWelcome() {
        localStorage.setItem("displayMode", "welcome");

        hymnCurrentDisplayText.textContent = "Welcome Screen";
        hymnStatusMessage.textContent =
            "🟢 Welcome Screen Displayed";
    }

    lookupHymnButton.addEventListener("click", lookupHymn);

    hymnNumberInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            lookupHymn();
        }
    });

    saveHymnButton.addEventListener("click", saveHymn);
    editHymnButton.addEventListener("click", editHymn);
    prepareHymnButton.addEventListener("click", prepareHymn);
    displayHymnButton.addEventListener("click", displayHymn);
    returnWelcomeHymnButton.addEventListener(
        "click",
        returnWelcome
    );

    hymnNumberInput.focus();
});
