/*
 * Settings page — choose which occasion's Welcome Screen the TV shows,
 * and jump into the editor to change it.
 *
 * Each occasion's Welcome Screen is an editable slide (see
 * js/slides.js). The editor itself lives on the Announcements page
 * (Welcome Screens tab), so there is only ONE editor to learn.
 */

document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const S = window.WWBCSlides;

    const occasionRow = document.getElementById("occasionRow");
    const previewFrame = document.getElementById("welcomePreviewFrame");
    const previewWrap = previewFrame.parentElement;
    const status = document.getElementById("settingsStatus");

    let selected = S.getActiveWelcome();

    function sizePreview() {
        const width = previewWrap.getBoundingClientRect().width;
        if (width > 0) {
            previewWrap.style.setProperty("--welcome-preview-scale", width / 1920);
        }
    }

    function showPreview() {
        try {
            previewFrame.contentWindow.postMessage(
                { type: "previewWelcomeOccasion", occasion: selected },
                window.location.origin
            );
        } catch (error) {
            // Preview not ready yet — it catches up on load.
        }
    }

    function renderChips() {
        const active = S.getActiveWelcome();
        occasionRow.innerHTML = "";

        S.WELCOME_OCCASIONS.forEach((o) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "occasion-chip" + (o.key === selected ? " occasion-selected" : "");
            chip.textContent = o.label + (o.key === active ? " ✓" : "");
            chip.title = o.key === active ? "This is the one the TV shows" : "";
            chip.addEventListener("click", () => {
                selected = o.key;
                renderChips();
                showPreview();
                status.textContent = "";
            });
            occasionRow.appendChild(chip);
        });
    }

    document.getElementById("useOnTvButton").addEventListener("click", () => {
        S.setActiveWelcome(selected);
        renderChips();
        const label = S.WELCOME_OCCASIONS.find((o) => o.key === selected).label;
        status.textContent = `🟢 The TV's Welcome Screen is now “${label}”.`;
    });

    document.getElementById("editButton").addEventListener("click", () => {
        location.href = `announcements.html?tab=welcome&occasion=${encodeURIComponent(selected)}`;
    });

    // Another tab changed the active occasion or edited a design.
    window.addEventListener("storage", (e) => {
        if (e.key === "activeWelcome") renderChips();
    });

    previewFrame.addEventListener("load", showPreview);
    window.addEventListener("resize", sizePreview);

    await S.ensureWelcomeDesigns();
    sizePreview();
    renderChips();
    showPreview();
});
