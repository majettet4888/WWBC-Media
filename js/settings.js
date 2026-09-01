/*
 * Settings page — Welcome Screen occasions.
 *
 * Everything is saved as ONE object in localStorage ("welcomeSettings").
 * The Display page (TV + any preview) reads it on load and whenever
 * "welcomeSettingsUpdated" changes, so Save applies instantly.
 *
 *   {
 *     occasion:        "normal" | "foundersDay" | "pastorAppreciation" | "thanksgiving" | "christmas",
 *     heading:         main line, e.g. "Welcome"
 *     subheading:      second line, e.g. "Sunday Worship Service"
 *     themeMain:       optional theme, e.g. "Praise Him Anyhow"
 *     themeSub:        optional tagline
 *     preset:          which occasion's ARTWORK to use ("" = none)
 *     backgroundImage: custom photo as a data URL ("" = none)
 *     textStyle:       "light" (white text) | "dark" (dark text)
 *   }
 *
 * Each occasion has a starting point (wording, artwork file, text
 * color). The artwork lives in the site's images folder under a fixed
 * name — add a file with that name on GitHub and the occasion picks it
 * up automatically; until then it falls back to the church photo.
 */

document.addEventListener("DOMContentLoaded", () => {

    const FIRST_FOUNDERS_DAY_YEAR = 2004; // Year 23 was 2026

    function ordinalYear() {
        return new Date().getFullYear() - FIRST_FOUNDERS_DAY_YEAR + 1;
    }

    const OCCASIONS = {
        normal: {
            label: "Normal Sunday",
            heading: "Welcome",
            subheading: "Sunday Worship Service",
            themeMain: "",
            themeSub: "",
            artwork: "",
            textStyle: "light"
        },
        foundersDay: {
            label: "Founders' Day",
            heading: "Welcome",
            get subheading() {
                return `Celebrating Annual Founders' Day – Year ${ordinalYear()}`;
            },
            themeMain: "Praise Him Anyhow",
            themeSub: "(Ain't Nobody God but God!)",
            artwork: "images/founders-day-bg.jpg",
            textStyle: "dark"
        },
        pastorAppreciation: {
            label: "Pastor Appreciation",
            heading: "Welcome",
            subheading: "Pastor Appreciation Day",
            themeMain: "",
            themeSub: "",
            artwork: "images/pastor-appreciation-bg.jpg", // plain white until real artwork replaces it
            textStyle: "dark"
        },
        thanksgiving: {
            label: "Thanksgiving",
            heading: "Welcome",
            subheading: "Thanksgiving Service",
            themeMain: "",
            themeSub: "",
            artwork: "images/thanksgiving-bg.jpg",
            textStyle: "dark"
        },
        christmas: {
            label: "Christmas",
            heading: "Welcome",
            subheading: "Christmas Celebration",
            themeMain: "",
            themeSub: "",
            artwork: "images/christmas-bg.jpg",
            textStyle: "dark"
        }
    };

    const occasionRow = document.getElementById("occasionRow");
    const previewFrame = document.getElementById("welcomePreviewFrame");
    const previewWrap = previewFrame.parentElement;

    const headingInput = document.getElementById("welcomeHeadingInput");
    const subheadingInput = document.getElementById("welcomeSubheadingInput");
    const themeMainInput = document.getElementById("welcomeThemeMainInput");
    const themeSubInput = document.getElementById("welcomeThemeSubInput");

    const bgArtworkButton = document.getElementById("welcomeBgArtworkButton");
    const bgUseDefaultButton = document.getElementById("welcomeBgUseDefaultButton");
    const bgFileInput = document.getElementById("welcomeBgFileInput");
    const bgFileButton = bgFileInput.parentElement;
    const bgStatus = document.getElementById("welcomeBgStatus");
    const textStyleSelect = document.getElementById("welcomeTextStyleSelect");

    const saveButton = document.getElementById("welcomeSettingsSaveButton");
    const resetButton = document.getElementById("welcomeSettingsResetButton");
    const settingsStatus = document.getElementById("settingsStatus");

    // Current (unsaved) state of the form
    let occasion = "normal";
    let backgroundChoice = "church"; // "artwork" | "church" | "custom"
    let customBackgroundImage = "";
    let artworkAvailable = false;

    /* ---------- preview sizing ---------- */

    function sizePreview() {
        const width = previewWrap.getBoundingClientRect().width;
        if (width > 0) {
            previewWrap.style.setProperty(
                "--welcome-preview-scale",
                width / 1920
            );
        }
    }

    sizePreview();
    window.addEventListener("resize", sizePreview);

    /* ---------- load / build settings ---------- */

    function loadSaved() {
        try {
            return JSON.parse(localStorage.getItem("welcomeSettings") || "{}");
        } catch (error) {
            return {};
        }
    }

    function buildSettings() {
        const base = OCCASIONS[occasion] || OCCASIONS.normal;

        return {
            occasion,
            heading: headingInput.value.trim() || base.heading,
            subheading: subheadingInput.value.trim() || base.subheading,
            themeMain: themeMainInput.value.trim(),
            themeSub: themeSubInput.value.trim(),
            preset: backgroundChoice === "artwork" ? occasion : "",
            backgroundImage:
                backgroundChoice === "custom" ? customBackgroundImage : "",
            textStyle: textStyleSelect.value
        };
    }

    /* ---------- artwork availability ---------- */

    function checkArtwork(url) {
        return new Promise((resolve) => {
            if (!url) return resolve(false);
            const probe = new Image();
            probe.onload = () => resolve(true);
            probe.onerror = () => resolve(false);
            probe.src = url + "?check=" + Date.now();
        });
    }

    /* ---------- rendering the form ---------- */

    function renderOccasionChips() {
        occasionRow.querySelectorAll(".occasion-chip").forEach((chip) => {
            chip.classList.toggle(
                "occasion-selected",
                chip.dataset.occasion === occasion
            );
        });
    }

    function renderBackgroundChoice() {
        const base = OCCASIONS[occasion];
        const fileName = base.artwork ? base.artwork.split("/").pop() : "";

        bgArtworkButton.disabled = !base.artwork;

        bgArtworkButton.classList.toggle(
            "settings-bg-selected", backgroundChoice === "artwork");
        bgUseDefaultButton.classList.toggle(
            "settings-bg-selected", backgroundChoice === "church");
        bgFileButton.classList.toggle(
            "settings-bg-selected", backgroundChoice === "custom");

        if (backgroundChoice === "custom") {
            bgStatus.textContent = "Using your chosen photo.";
        } else if (backgroundChoice === "artwork") {
            bgStatus.textContent = artworkAvailable
                ? `Using this occasion's artwork (${fileName}).`
                : `No artwork uploaded yet for this occasion — the church ` +
                  `photo will show until images/${fileName} is added to the site.`;
        } else {
            bgStatus.textContent = "Using the normal church photo.";
        }
    }

    /* ---------- live preview ---------- */

    let previewTimer = null;

    function pushPreview() {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
            try {
                previewFrame.contentWindow.postMessage(
                    { type: "previewWelcomeSettings", settings: buildSettings() },
                    window.location.origin
                );
            } catch (error) {
                // Preview frame not ready yet — it'll catch up on load.
            }
        }, 120);
    }

    previewFrame.addEventListener("load", pushPreview);

    /* ---------- applying an occasion ---------- */

    async function selectOccasion(key, savedValues) {
        occasion = OCCASIONS[key] ? key : "normal";
        const base = OCCASIONS[occasion];

        // Starting-point wording (or the saved wording, when reopening)
        headingInput.value = savedValues ? savedValues.heading : base.heading;
        subheadingInput.value = savedValues ? savedValues.subheading : base.subheading;
        themeMainInput.value = savedValues ? (savedValues.themeMain || "") : base.themeMain;
        themeSubInput.value = savedValues ? (savedValues.themeSub || "") : base.themeSub;
        textStyleSelect.value = savedValues ? (savedValues.textStyle || "light") : base.textStyle;

        artworkAvailable = await checkArtwork(base.artwork);

        if (savedValues) {
            if (savedValues.backgroundImage) {
                backgroundChoice = "custom";
                customBackgroundImage = savedValues.backgroundImage;
            } else if (savedValues.preset) {
                backgroundChoice = "artwork";
            } else {
                backgroundChoice = "church";
            }
        } else {
            backgroundChoice = base.artwork ? "artwork" : "church";
        }

        renderOccasionChips();
        renderBackgroundChoice();
        pushPreview();
    }

    occasionRow.addEventListener("click", (event) => {
        const chip = event.target.closest(".occasion-chip");
        if (!chip) return;
        selectOccasion(chip.dataset.occasion);
        settingsStatus.textContent = "";
    });

    /* ---------- background buttons ---------- */

    bgArtworkButton.addEventListener("click", () => {
        backgroundChoice = "artwork";
        textStyleSelect.value = OCCASIONS[occasion].textStyle;
        renderBackgroundChoice();
        pushPreview();
    });

    bgUseDefaultButton.addEventListener("click", () => {
        backgroundChoice = "church";
        textStyleSelect.value = "light";
        renderBackgroundChoice();
        pushPreview();
    });

    /*
     * Photos straight off a phone can be 5–10 MB — far more than
     * localStorage holds. Shrink to TV size and re-save as JPEG.
     */
    function resizeImageFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const scale = Math.min(1, 1920 / img.width, 1080 / img.height);
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Could not read that image."));
            };
            img.src = objectUrl;
        });
    }

    bgFileInput.addEventListener("change", async () => {
        const file = bgFileInput.files && bgFileInput.files[0];
        if (!file) return;

        bgStatus.textContent = "Preparing photo…";
        try {
            customBackgroundImage = await resizeImageFile(file);
            backgroundChoice = "custom";
            renderBackgroundChoice();
            pushPreview();
        } catch (error) {
            bgStatus.textContent =
                "Sorry, that file couldn't be used. Try a JPG or PNG.";
        }
        bgFileInput.value = "";
    });

    /* ---------- text fields → live preview ---------- */

    [headingInput, subheadingInput, themeMainInput, themeSubInput]
        .forEach((input) => input.addEventListener("input", pushPreview));
    textStyleSelect.addEventListener("change", pushPreview);

    /* ---------- save / reset ---------- */

    function broadcastUpdate() {
        localStorage.setItem("welcomeSettingsUpdated", Date.now().toString());
    }

    saveButton.addEventListener("click", () => {
        const settings = buildSettings();

        try {
            localStorage.setItem("welcomeSettings", JSON.stringify(settings));
        } catch (error) {
            settingsStatus.style.color = "#c62828";
            settingsStatus.textContent =
                "That photo is too large to save — please choose a smaller one.";
            return;
        }

        broadcastUpdate();
        settingsStatus.style.color = "";
        settingsStatus.textContent =
            `🟢 Saved — the TV is now showing the ${OCCASIONS[occasion].label} welcome screen.`;
    });

    resetButton.addEventListener("click", () => {
        localStorage.removeItem("welcomeSettings");
        broadcastUpdate();
        selectOccasion("normal");
        settingsStatus.style.color = "";
        settingsStatus.textContent = "🟢 Reset — the TV is back to the normal welcome screen.";
    });

    /* ---------- start: show what's currently saved ---------- */

    const saved = loadSaved();
    if (saved && saved.heading) {
        selectOccasion(saved.occasion || (saved.preset || "normal"), saved);
    } else {
        selectOccasion("normal");
    }
});
