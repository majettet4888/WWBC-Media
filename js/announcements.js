/*
 * Announcements page — a Word-style slide editor plus TV controls.
 *
 * Slides are saved automatically (no Save button to forget) in this
 * browser's database via WWBCSlides (js/slides.js). The TV reads the
 * same database, so "Show on TV" is instant and nothing ever has to be
 * copied anywhere.
 */

document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const S = window.WWBCSlides;

    /* ---------------- choices offered in the toolbar ---------------- */

    const FONTS = [
        "Georgia",
        "Arial",
        "Times New Roman",
        "Verdana",
        "Trebuchet MS",
        "Playfair Display",
        "Cormorant Garamond",
        "Cinzel",
        "Montserrat",
        "Oswald",
        "Great Vibes",
        "Dancing Script",
        "Kaushan Script",
        "Lobster"
    ];

    // True TV pixels (the TV is 1920 x 1080).
    const SIZES = [30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 240, 300];

    const SWATCHES = [
        "#ffffff", "#000000", "#d4af37", "#f3d27a", "#c41e3a",
        "#1d3557", "#2f5d3a", "#5b2a86", "#e07b24"
    ];

    /* ---------------- elements ---------------- */

    const $ = (id) => document.getElementById(id);

    const slideList = $("slideList");
    const slideName = $("slideName");
    const onTvBadge = $("onTvBadge");
    const saveStatus = $("saveStatus");
    const toolbar = $("toolbar");
    const fontSelect = $("fontSelect");
    const sizeSelect = $("sizeSelect");
    const colorInput = $("colorInput");
    const swatches = $("swatches");
    const inlinePhotoInput = $("inlinePhotoInput");
    const photoBar = $("photoBar");
    const stageWrap = $("stageWrap");
    const stage = $("stage");
    const overflowWarning = $("overflowWarning");
    const valignButtons = $("valignButtons");
    const lineHeightSelect = $("lineHeightSelect");
    const shadowCheck = $("shadowCheck");
    const bgFills = $("bgFills");
    const bgPresets = $("bgPresets");
    const bgColorInput = $("bgColorInput");
    const bgPhotoInput = $("bgPhotoInput");
    const bgPictureOptions = $("bgPictureOptions");
    const fitButtons = $("fitButtons");
    const dimRange = $("dimRange");
    const tvPreview = $("tvPreview");
    const tvStatus = $("tvStatus");
    const intervalSelect = $("intervalSelect");
    const spreadCheck = $("spreadCheck");
    const tabs = $("tabs");

    /* ---------------- which tab: announcements or welcome screens ---------------- */

    let tab = "announcement";

    /* ---------------- state ---------------- */

    let slides = [];
    let current = null;      // the slide being edited
    let content = null;      // its editable text element
    let savedRange = null;   // last selection inside the text
    let selectedPhoto = null;
    let pendingSizePx = null;
    let saveTimer = null;
    const thumbs = new Map(); // slide id -> { canvas, box }

    document.execCommand("defaultParagraphSeparator", false, "div");

    /* ================================================================
     * Templates
     * ================================================================ */

    function todayLabel() {
        return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }

    function makeSlide(template) {
        const base = {
            id: S.newId(),
            kind: "announcement",
            order: slides.length ? Math.max(...slides.map((s) => s.order || 0)) + 1 : 1,
            inShow: true,
            valign: "middle",
            lineHeight: "1.2",
            shadow: true
        };

        switch (template) {
            case "birthday":
                return Object.assign(base, {
                    name: "Birthday – " + todayLabel(),
                    bg: { kind: "fill", value: S.PRESET_FILLS[3].value, dim: 0 },
                    html:
                        '<div><font face="Great Vibes" color="#f3d27a"><span style="font-size: 200px;">Happy Birthday</span></font></div>' +
                        '<div><b><span style="font-size: 130px;">Name Goes Here</span></b></div>' +
                        '<div><span style="font-size: 70px;">' + todayLabel() + "</span></div>"
                });

            case "event":
                return Object.assign(base, {
                    name: "Event – " + todayLabel(),
                    bg: { kind: "preset", value: "church", fit: "cover", dim: 0.55 },
                    html:
                        '<div><font face="Cinzel"><b><span style="font-size: 120px;">Event Name</span></b></font></div>' +
                        '<div><span style="font-size: 80px;">Saturday · 10:00 AM</span></div>' +
                        '<div><span style="font-size: 70px;">Fellowship Hall</span></div>' +
                        '<div><font color="#f3d27a"><span style="font-size: 60px;">All are welcome!</span></font></div>'
                });

            case "flyer":
                return Object.assign(base, {
                    name: "Flyer – " + todayLabel(),
                    shadow: false,
                    bg: { kind: "fill", value: "#000000", fit: "contain", dim: 0 },
                    html: ""
                });

            default:
                return Object.assign(base, {
                    name: "Announcement – " + todayLabel(),
                    bg: { kind: "fill", value: S.PRESET_FILLS[0].value, dim: 0 },
                    html: '<div><span style="font-size: 100px;">Type your announcement here</span></div>'
                });
        }
    }

    /* ================================================================
     * Saving
     * ================================================================ */

    function cleanHtml() {
        if (!content) return "";
        const copy = content.cloneNode(true);
        copy.querySelectorAll(".selected-photo").forEach((img) =>
            img.classList.remove("selected-photo")
        );
        copy.querySelectorAll('[class=""]').forEach((el) => el.removeAttribute("class"));
        return copy.innerHTML;
    }

    function scheduleSave() {
        saveStatus.textContent = "Saving…";
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 400);
    }

    async function saveNow() {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (!current) return;

        try {
            await S.saveSlide(current);
            saveStatus.textContent = "Saved ✓";
        } catch (error) {
            console.error(error);
            saveStatus.textContent = "⚠ Couldn't save";
            return;
        }

        refreshThumb(current);

        if (current.kind === "welcome") {
            // Lets the TV (if showing it) and the Settings preview redraw.
            localStorage.setItem("welcomeDesignUpdated", Date.now().toString());
        } else if (isOnTv(current)) {
            localStorage.setItem("announcementsUpdated", Date.now().toString());
        }
    }

    // Don't lose the last few keystrokes when leaving the page.
    window.addEventListener("pagehide", () => {
        if (saveTimer) saveNow();
    });

    /* ================================================================
     * Slide list (left column)
     * ================================================================ */

    function renderList() {
        slideList.innerHTML = "";
        thumbs.clear();

        slides.forEach((slide, index) => {
            const li = document.createElement("li");
            li.className = "ann-slide-item" + (current && slide.id === current.id ? " selected" : "");

            const box = document.createElement("div");
            box.className = "ann-thumb";
            const canvas = document.createElement("div");
            box.appendChild(canvas);
            S.renderSlide(canvas, slide);
            li.appendChild(box);

            const meta = document.createElement("div");
            meta.className = "ann-slide-meta";
            const name = document.createElement("div");
            name.className = "ann-slide-name";
            name.textContent = slide.name || "Untitled";
            meta.appendChild(name);
            if (isOnTv(slide)) {
                const live = document.createElement("span");
                live.className = "ann-slide-live";
                live.textContent = "● ON TV";
                meta.appendChild(live);
            }
            li.appendChild(meta);

            li.addEventListener("click", () => selectSlide(slide.id));
            slideList.appendChild(li);
            thumbs.set(slide.id, { canvas, box });
            if (tab === "welcome") return;

            const controls = document.createElement("div");
            controls.className = "ann-slide-controls";
            controls.innerHTML =
                '<label title="Include this slide when the slideshow plays"><input type="checkbox"> In slideshow</label>' +
                '<button type="button" data-act="up" title="Move up">▲</button>' +
                '<button type="button" data-act="down" title="Move down">▼</button>' +
                '<button type="button" data-act="copy" title="Make a copy">⧉</button>' +
                '<button type="button" data-act="delete" title="Delete">🗑</button>';
            const check = controls.querySelector("input");
            check.checked = slide.inShow !== false;
            check.addEventListener("change", async () => {
                slide.inShow = check.checked;
                await S.saveSlide(slide);
                if (localStorage.getItem("displayMode") === "announcement") {
                    localStorage.setItem("announcementsUpdated", Date.now().toString());
                }
            });
            controls.querySelector('[data-act="up"]').disabled = index === 0;
            controls.querySelector('[data-act="down"]').disabled = index === slides.length - 1;
            controls.addEventListener("click", (e) => {
                const act = e.target.closest("button")?.dataset.act;
                e.stopPropagation();
                if (act === "up") moveSlide(slide, -1);
                if (act === "down") moveSlide(slide, 1);
                if (act === "copy") duplicateSlide(slide);
                if (act === "delete") askDelete(slide);
            });
            li.appendChild(controls);
        });

        requestAnimationFrame(() => {
            thumbs.forEach(({ canvas, box }) => S.fitCanvas(canvas, box));
        });
    }

    function refreshThumb(slide) {
        const t = thumbs.get(slide.id);
        if (!t) return;
        S.renderSlide(t.canvas, slide);
        S.fitCanvas(t.canvas, t.box);
        const name = t.box.parentElement.querySelector(".ann-slide-name");
        if (name) name.textContent = slide.name || "Untitled";
    }

    async function addSlide(template) {
        await saveNow();
        const slide = makeSlide(template);
        await S.saveSlide(slide);
        slides.push(slide);
        current = slide;
        renderList();
        loadEditor(slide);

        if (template === "flyer") {
            // Go straight to picking the flyer picture.
            bgPhotoInput.click();
        }
    }

    async function moveSlide(slide, direction) {
        const i = slides.indexOf(slide);
        const j = i + direction;
        if (j < 0 || j >= slides.length) return;
        [slides[i], slides[j]] = [slides[j], slides[i]];
        slides.forEach((s, k) => (s.order = k + 1));
        await S.saveSlides(slides);
        renderList();
        if (localStorage.getItem("displayMode") === "announcement") {
            localStorage.setItem("announcementsUpdated", Date.now().toString());
        }
    }

    async function duplicateSlide(slide) {
        await saveNow();
        const copy = JSON.parse(JSON.stringify(slide));
        copy.id = S.newId();
        copy.name = (slide.name || "Untitled") + " (copy)";
        const i = slides.indexOf(slide);
        slides.splice(i + 1, 0, copy);
        slides.forEach((s, k) => (s.order = k + 1));
        await S.saveSlides(slides);
        selectSlide(copy.id);
    }

    let pendingDelete = null;
    let pendingReset = false;

    function askDelete(slide) {
        pendingReset = false;
        $("deleteYes").textContent = "Yes, delete it";
        pendingDelete = slide;
        $("deleteMessage").textContent =
            `Delete “${slide.name || "Untitled"}”? This can't be undone.`;
        $("deleteOverlay").style.display = "flex";
    }

    $("deleteNo").addEventListener("click", () => {
        pendingDelete = null;
        $("deleteOverlay").style.display = "none";
    });

    $("deleteYes").addEventListener("click", async () => {
        $("deleteOverlay").style.display = "none";

        if (pendingReset) {
            pendingReset = false;
            await resetWelcomeDesign();
            return;
        }

        const slide = pendingDelete;
        pendingDelete = null;
        if (!slide) return;

        const i = slides.indexOf(slide);
        await S.deleteSlide(slide.id);
        slides.splice(i, 1);

        if (localStorage.getItem("displayMode") === "announcement") {
            localStorage.setItem("announcementsUpdated", Date.now().toString());
        }

        if (!slides.length) {
            await addSlide("blank");
            return;
        }
        if (current && current.id === slide.id) {
            current = slides[Math.min(i, slides.length - 1)];
            loadEditor(current);
        }
        renderList();
    });

    async function selectSlide(id) {
        if (current && current.id === id) return;
        await saveNow();
        current = slides.find((s) => s.id === id) || slides[0];
        try { localStorage.setItem("annSelectedId", current.id); } catch (e) { /* ignore */ }
        renderList();
        loadEditor(current);
    }

    /* ================================================================
     * Editor (middle column)
     * ================================================================ */

    function loadEditor(slide) {
        current = slide;
        savedRange = null;
        deselectPhoto();

        content = S.renderSlide(stage, slide);
        content.contentEditable = "true";
        content.spellcheck = true;

        content.addEventListener("input", onContentInput);
        content.addEventListener("click", onContentClick);
        content.addEventListener("paste", onContentPaste);

        S.fitCanvas(stage, stageWrap);

        slideName.value = slide.name || "";
        renderPanels();
        updateOnTvBadge();
        checkOverflow();
        saveStatus.textContent = "";
    }

    // Clicking empty space on the slide puts the cursor in the text.
    stage.addEventListener("mousedown", (e) => {
        if (!content || e.target === content || content.contains(e.target)) return;
        e.preventDefault();
        placeCaretAtEnd();
    });

    function rerenderStage() {
        // Background/layout changed — redraw, keeping the text.
        current.html = cleanHtml();
        loadEditor(current);
        scheduleSave();
    }

    function onContentInput() {
        convertPendingFontSize();
        current.html = cleanHtml();
        checkOverflow();
        scheduleSave();
    }

    function checkOverflow() {
        if (!content) return;
        overflowWarning.hidden = content.scrollHeight <= content.clientHeight + 4;
    }

    slideName.addEventListener("input", () => {
        if (!current) return;
        current.name = slideName.value.trim();
        scheduleSave();
    });

    window.addEventListener("resize", () => {
        if (current) S.fitCanvas(stage, stageWrap);
        thumbs.forEach(({ canvas, box }) => S.fitCanvas(canvas, box));
        sizeTvPreview();
    });

    /* ---------------- keeping track of the selection ---------------- */

    document.addEventListener("selectionchange", () => {
        const sel = window.getSelection();
        if (!content || !sel.rangeCount) return;
        if (!content.contains(sel.anchorNode)) return;
        savedRange = sel.getRangeAt(0).cloneRange();
        updateToolbarState();
    });

    function placeCaretAtEnd() {
        content.focus();
        const range = document.createRange();
        range.selectNodeContents(content);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        savedRange = range.cloneRange();
    }

    // Put the cursor/selection back before running a toolbar command
    // (clicking a dropdown takes the focus away from the slide).
    // Nothing selected yet → the command applies to the whole slide.
    function restoreSelection() {
        content.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        if (savedRange && content.contains(savedRange.startContainer)) {
            sel.addRange(savedRange);
        } else {
            const range = document.createRange();
            range.selectNodeContents(content);
            sel.addRange(range);
            savedRange = range.cloneRange();
        }
    }

    function exec(command, value) {
        restoreSelection();
        document.execCommand("styleWithCSS", false, false);
        document.execCommand(command, false, value);
        onContentInput();
        updateToolbarState();
    }

    /* ---------------- font size ---------------- */

    function applyFontSize(px) {
        restoreSelection();
        pendingSizePx = px;
        document.execCommand("styleWithCSS", false, false);
        document.execCommand("fontSize", false, "7");
        onContentInput();
        updateToolbarState();
    }

    // The browser marks resized text with size="7"; swap that for the
    // exact TV pixel size chosen.
    function convertPendingFontSize() {
        if (!content || !pendingSizePx) return;
        content.querySelectorAll('font[size="7"]').forEach((el) => {
            el.removeAttribute("size");
            el.style.fontSize = pendingSizePx + "px";
            el.querySelectorAll("[style]").forEach((inner) => {
                inner.style.fontSize = "";
                if (!inner.getAttribute("style")) inner.removeAttribute("style");
            });
            el.querySelectorAll("font[size]").forEach((inner) => inner.removeAttribute("size"));
        });
    }

    function currentFontSizePx() {
        const node = savedRange ? savedRange.startContainer : content;
        const el = node.nodeType === 1 ? node : node.parentElement;
        return Math.round(parseFloat(getComputedStyle(el || content).fontSize)) || 90;
    }

    function stepFontSize(direction) {
        const now = currentFontSizePx();
        let next;
        if (direction > 0) {
            next = SIZES.find((s) => s > now) || SIZES[SIZES.length - 1];
        } else {
            next = [...SIZES].reverse().find((s) => s < now) || SIZES[0];
        }
        applyFontSize(next);
    }

    /* ---------------- toolbar ---------------- */

    FONTS.forEach((font) => {
        const opt = document.createElement("option");
        opt.value = font;
        opt.textContent = font;
        opt.style.fontFamily = `"${font}"`;
        fontSelect.appendChild(opt);
    });

    SIZES.forEach((size) => {
        const opt = document.createElement("option");
        opt.value = size;
        opt.textContent = size;
        sizeSelect.appendChild(opt);
    });

    SWATCHES.forEach((color) => {
        const b = document.createElement("button");
        b.type = "button";
        b.style.background = color;
        b.title = color;
        b.dataset.color = color;
        swatches.appendChild(b);
    });

    // Buttons must not steal the selection from the slide.
    toolbar.addEventListener("mousedown", (e) => {
        if (e.target.closest("button")) e.preventDefault();
    });

    toolbar.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        if (!button || !content) return;

        if (button.dataset.color) {
            colorInput.value = button.dataset.color;
            exec("foreColor", button.dataset.color);
            return;
        }

        const cmd = button.dataset.cmd;
        if (cmd === "insertDate") return exec("insertHTML", S.dateFieldHtml() + "&nbsp;");
        if (cmd === "bigger") return stepFontSize(1);
        if (cmd === "smaller") return stepFontSize(-1);
        if (cmd) exec(cmd);
    });

    fontSelect.addEventListener("change", () => exec("fontName", fontSelect.value));
    sizeSelect.addEventListener("change", () => applyFontSize(Number(sizeSelect.value)));
    colorInput.addEventListener("input", () => exec("foreColor", colorInput.value));

    function rgbToHex(rgb) {
        const m = rgb.match(/\d+/g);
        if (!m) return "#ffffff";
        return "#" + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
    }

    function updateToolbarState() {
        if (!content || !savedRange) return;
        const node = savedRange.startContainer;
        const el = (node.nodeType === 1 ? node : node.parentElement) || content;
        const cs = getComputedStyle(el);

        const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
        const match = FONTS.find((f) => f.toLowerCase() === family.toLowerCase());
        if (match) fontSelect.value = match;

        const px = Math.round(parseFloat(cs.fontSize));
        const nearest = SIZES.reduce((a, b) => (Math.abs(b - px) < Math.abs(a - px) ? b : a));
        sizeSelect.value = nearest;

        colorInput.value = rgbToHex(cs.color);

        ["bold", "italic", "underline", "justifyLeft", "justifyCenter", "justifyRight"].forEach((cmd) => {
            const b = toolbar.querySelector(`[data-cmd="${cmd}"]`);
            if (b) b.classList.toggle("active", document.queryCommandState(cmd));
        });
    }

    /* ---------------- photos inside the text ---------------- */

    inlinePhotoInput.addEventListener("change", async () => {
        const file = inlinePhotoInput.files[0];
        inlinePhotoInput.value = "";
        if (!file || !content) return;

        saveStatus.textContent = "Adding photo…";
        try {
            const data = await S.resizeImageFile(file, 1000, 1000, 0.85);
            restoreSelection();
            document.execCommand(
                "insertHTML",
                false,
                `<img src="${data}" style="height: 420px;" alt="">`
            );
            onContentInput();
        } catch (error) {
            saveStatus.textContent = "⚠ That picture couldn't be used";
        }
    });

    // A picture copied from a website (right-click → Copy image) and
    // pasted into the slide goes in as a photo.
    async function onContentPaste(e) {
        const items = [...(e.clipboardData ? e.clipboardData.items : [])];
        const imageItem = items.find((i) => i.kind === "file" && i.type.startsWith("image/"));
        if (!imageItem) return;

        e.preventDefault();
        const file = imageItem.getAsFile();
        saveStatus.textContent = "Adding photo…";
        try {
            const data = await S.resizeImageFile(file, 1000, 1000, 0.85);
            restoreSelection();
            document.execCommand("insertHTML", false, `<img src="${data}" style="height: 420px;" alt="">`);
            onContentInput();
        } catch (error) {
            saveStatus.textContent = "⚠ That picture couldn't be used";
        }
    }

    function onContentClick(e) {
        if (e.target.tagName === "IMG") {
            selectPhoto(e.target);
        } else {
            deselectPhoto();
        }
    }

    function selectPhoto(img) {
        deselectPhoto();
        selectedPhoto = img;
        img.classList.add("selected-photo");
        photoBar.hidden = false;
    }

    function deselectPhoto() {
        if (selectedPhoto) selectedPhoto.classList.remove("selected-photo");
        selectedPhoto = null;
        photoBar.hidden = true;
    }

    function resizePhoto(delta) {
        if (!selectedPhoto) return;
        const h = parseFloat(selectedPhoto.style.height) || selectedPhoto.offsetHeight || 400;
        selectedPhoto.style.height = Math.max(80, Math.min(950, h + delta)) + "px";
        onContentInput();
    }

    $("photoBigger").addEventListener("click", () => resizePhoto(80));
    $("photoSmaller").addEventListener("click", () => resizePhoto(-80));
    $("photoDelete").addEventListener("click", () => {
        if (!selectedPhoto) return;
        selectedPhoto.remove();
        deselectPhoto();
        onContentInput();
    });

    /* ================================================================
     * Layout + background panels
     * ================================================================ */

    S.PRESET_FILLS.forEach((fill) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ann-bg-tile";
        b.style.background = fill.value;
        b.innerHTML = `<span>${fill.label}</span>`;
        b.addEventListener("click", () => {
            current.bg = { kind: "fill", value: fill.value, dim: 0 };
            rerenderStage();
        });
        b.dataset.fill = fill.value;
        bgFills.appendChild(b);
    });

    Object.entries(S.PRESET_IMAGES).forEach(([key, preset]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ann-bg-tile";
        b.style.backgroundImage = `url("${preset.url}")`;
        b.innerHTML = `<span>${preset.label}</span>`;
        b.dataset.preset = key;
        b.addEventListener("click", () => {
            current.bg = {
                kind: "preset",
                value: key,
                fit: "cover",
                // The church photo needs darkening so text reads on it.
                dim: key === "church" ? 0.5 : 0
            };
            rerenderStage();
        });
        bgPresets.appendChild(b);
    });

    bgColorInput.addEventListener("change", () => {
        current.bg = { kind: "fill", value: bgColorInput.value, dim: 0 };
        rerenderStage();
    });

    bgPhotoInput.addEventListener("change", async () => {
        const file = bgPhotoInput.files[0];
        bgPhotoInput.value = "";
        if (!file) return;
        saveStatus.textContent = "Adding picture…";
        try {
            const data = await S.resizeImageFile(file, 1920, 1080, 0.85);
            const wasFlyer = current.html === "" && current.bg && current.bg.fit === "contain";
            current.bg = {
                kind: "photo",
                value: data,
                fit: wasFlyer ? "contain" : "cover",
                dim: wasFlyer ? 0 : 0.3
            };
            rerenderStage();
        } catch (error) {
            saveStatus.textContent = "⚠ That picture couldn't be used";
        }
    });

    fitButtons.addEventListener("click", (e) => {
        const fit = e.target.closest("button")?.dataset.fit;
        if (!fit) return;
        current.bg = Object.assign({}, current.bg, { fit });
        rerenderStage();
    });

    dimRange.addEventListener("input", () => {
        current.bg = Object.assign({}, current.bg, { dim: Number(dimRange.value) });
        rerenderStage();
    });

    valignButtons.addEventListener("click", (e) => {
        const v = e.target.closest("button")?.dataset.valign;
        if (!v) return;
        current.valign = v;
        rerenderStage();
    });

    lineHeightSelect.addEventListener("change", () => {
        current.lineHeight = lineHeightSelect.value;
        rerenderStage();
    });

    spreadCheck.addEventListener("change", () => {
        current.spread = spreadCheck.checked;
        rerenderStage();
    });

    $("bgPasteButton").addEventListener("click", async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                const type = item.types.find((t) => t.startsWith("image/"));
                if (!type) continue;
                const blob = await item.getType(type);
                const data = await S.resizeImageFile(blob, 1920, 1080, 0.85);
                current.bg = { kind: "photo", value: data, fit: "cover", dim: 0.3 };
                rerenderStage();
                return;
            }
            saveStatus.textContent = "⚠ No picture copied — right-click a picture → Copy image first";
        } catch (error) {
            saveStatus.textContent = "⚠ No picture copied — right-click a picture → Copy image first";
        }
    });

    $("bgLinkButton").addEventListener("click", () => {
        const url = $("bgLinkInput").value.trim();
        if (!/^https?:\/\//i.test(url)) {
            saveStatus.textContent = "⚠ Paste a web link that starts with https://";
            return;
        }
        saveStatus.textContent = "Checking picture…";
        const probe = new Image();
        probe.onload = () => {
            current.bg = { kind: "photo", value: url, fit: "cover", dim: 0.3 };
            $("bgLinkInput").value = "";
            rerenderStage();
        };
        probe.onerror = () => {
            saveStatus.textContent = "⚠ That link isn't a picture (try right-click → Copy image, then Paste)";
        };
        probe.src = url;
    });

    shadowCheck.addEventListener("change", () => {
        current.shadow = shadowCheck.checked;
        rerenderStage();
    });

    function renderPanels() {
        const bg = current.bg || {};

        valignButtons.querySelectorAll("button").forEach((b) =>
            b.classList.toggle("active", b.dataset.valign === (current.valign || "middle"))
        );
        lineHeightSelect.value = current.lineHeight || "1.2";
        shadowCheck.checked = !!current.shadow;
        spreadCheck.checked = !!current.spread;

        bgFills.querySelectorAll("button").forEach((b) =>
            b.classList.toggle("active", bg.kind === "fill" && b.dataset.fill === bg.value)
        );
        bgPresets.querySelectorAll("button").forEach((b) =>
            b.classList.toggle("active", bg.kind === "preset" && b.dataset.preset === bg.value)
        );
        if (bg.kind === "fill" && /^#/.test(bg.value || "")) bgColorInput.value = bg.value;

        const isPicture = bg.kind === "photo" || bg.kind === "preset";
        bgPictureOptions.style.display = isPicture ? "" : "none";
        fitButtons.querySelectorAll("button").forEach((b) =>
            b.classList.toggle("active", b.dataset.fit === (bg.fit || "cover"))
        );
        dimRange.value = bg.dim || 0;
    }

    /* ================================================================
     * TV controls (right column)
     * ================================================================ */

    function readShow() {
        return S.readShow();
    }

    function isOnTv(slide) {
        if (!slide) return false;
        if (slide.kind === "welcome") {
            const mode = localStorage.getItem("displayMode") || "welcome";
            return mode === "welcome" && S.getActiveWelcome() === slide.occasion;
        }
        if (localStorage.getItem("displayMode") !== "announcement") return false;
        const show = readShow();
        if (!show) return false;
        if (show.mode === "single") return show.slideId === slide.id;
        return slide.inShow !== false;
    }

    function updateOnTvBadge() {
        onTvBadge.hidden = !isOnTv(current);
    }

    function renderTvStatus() {
        const mode = localStorage.getItem("displayMode") || "welcome";
        const show = readShow();

        if (mode === "announcement" && show) {
            tvStatus.textContent =
                show.mode === "slideshow"
                    ? `▶ Slideshow playing (${show.interval}s each)`
                    : `📢 ${show.label || "Announcement"}`;
        } else if (mode === "scripture") {
            const ref = localStorage.getItem("displayedReference");
            tvStatus.textContent = ref ? `📖 ${ref}` : "📖 Scripture";
        } else if (mode === "hymnal") {
            tvStatus.textContent = "🎵 Hymn";
        } else {
            const key = S.getActiveWelcome();
            const occ = S.WELCOME_OCCASIONS.find((o) => o.key === key);
            tvStatus.textContent = `🏠 Welcome Screen – ${occ ? occ.label : "Normal Sunday"}`;
        }

        updateOnTvBadge();
    }

    function sendToTv(show) {
        show.ts = Date.now();
        localStorage.setItem("announcementShow", JSON.stringify(show));
        localStorage.setItem("displayMode", "announcement");
        renderTvStatus();
        renderList();
    }

    $("showSlideButton").addEventListener("click", async () => {
        if (!current) return;
        await saveNow();
        sendToTv({ mode: "single", slideId: current.id, label: current.name || "Announcement" });
    });

    $("playSlideshowButton").addEventListener("click", async () => {
        await saveNow();
        const count = slides.filter((s) => s.inShow !== false).length;
        if (!count) {
            tvStatus.textContent = "⚠ No slides are checked “In slideshow”.";
            return;
        }
        sendToTv({
            mode: "slideshow",
            interval: Number(intervalSelect.value),
            startedAt: Date.now(),
            label: "Slideshow"
        });
    });

    $("useWelcomeButton").addEventListener("click", async () => {
        if (!current || current.kind !== "welcome") return;
        await saveNow();
        S.setActiveWelcome(current.occasion);
        localStorage.setItem("displayMode", "welcome");
        renderTvStatus();
        renderList();
    });

    $("resetWelcomeButton").addEventListener("click", () => {
        if (!current || current.kind !== "welcome") return;
        pendingReset = true;
        $("deleteYes").textContent = "Yes, reset it";
        $("deleteMessage").textContent =
            `Put “${current.name}” back to its original design? Changes made to it will be lost.`;
        $("deleteOverlay").style.display = "flex";
    });

    async function resetWelcomeDesign() {
        const seed = S.welcomeSeed(current.occasion);
        seed.order = current.order;
        Object.keys(current).forEach((k) => delete current[k]);
        Object.assign(current, seed);
        await S.saveSlide(current);
        localStorage.setItem("welcomeDesignUpdated", Date.now().toString());
        loadEditor(current);
        renderList();
        saveStatus.textContent = "Reset to the original design ✓";
    }

    $("welcomeButton").addEventListener("click", () => {
        localStorage.setItem("displayMode", "welcome");
        renderTvStatus();
        renderList();
    });

    // Keep this page in step if the Scripture console (or another tab)
    // changes what's on the TV.
    window.addEventListener("storage", (e) => {
        if (["displayMode", "announcementShow", "displayedReference", "activeWelcome"].includes(e.key)) {
            renderTvStatus();
            renderList();
        }
    });

    function sizeTvPreview() {
        const box = tvPreview.parentElement;
        tvPreview.style.transform = `scale(${box.clientWidth / 1920})`;
    }

    /* ================================================================
     * Backup / restore
     * ================================================================ */

    $("backupButton").addEventListener("click", async () => {
        await saveNow();
        const all = await S.getAllSlides();
        const data = {
            app: "WWBC-Media",
            kind: "announcements",
            version: 1,
            exportedAt: new Date().toISOString(),
            slides: all
        };
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `WWBC-announcements-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        saveStatus.textContent = `Backup saved (${all.length} slides) ✓`;
    });

    $("restoreInput").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;

        try {
            const data = JSON.parse(await file.text());
            if (!data || !Array.isArray(data.slides)) throw new Error("not a backup");

            // Add the backup's slides to what's here. A slide that's
            // already here (same slide) is updated, not duplicated.
            const everything = await S.getAllSlides();
            let order = everything.length ? Math.max(...everything.map((s) => s.order || 0)) : 0;
            const incoming = data.slides
                .filter((s) => s && s.id && typeof s.html === "string")
                .map((s) => {
                    const existing = everything.find((x) => x.id === s.id);
                    return Object.assign({}, s, { order: existing ? existing.order : ++order });
                });

            await S.saveSlides(incoming);
            await loadTab(tab, current && current.id);
            saveStatus.textContent = `Loaded ${incoming.length} slides from backup ✓`;
        } catch (error) {
            saveStatus.textContent = "⚠ That file isn't a WWBC announcements backup";
        }
    });

    /* ================================================================
     * Start
     * ================================================================ */

    document.querySelectorAll("[data-template]").forEach((b) =>
        b.addEventListener("click", () => addSlide(b.dataset.template))
    );

    async function loadTab(name, preferredId) {
        await saveNow();
        tab = name === "welcome" ? "welcome" : "announcement";

        let all = await S.getAllSlides();
        if (tab === "welcome") {
            if (await S.ensureWelcomeDesigns()) all = await S.getAllSlides();
            slides = S.WELCOME_OCCASIONS
                .map((o) => all.find((s) => s.kind === "welcome" && s.occasion === o.key))
                .filter(Boolean);
        } else {
            slides = all.filter((s) => s.kind !== "welcome");
            if (!slides.length) {
                const first = makeSlide("blank");
                await S.saveSlide(first);
                slides = [first];
            }
        }

        let lastId = null;
        try { lastId = localStorage.getItem("annSelectedId"); } catch (e) { /* ignore */ }
        current =
            slides.find((s) => s.id === preferredId) ||
            slides.find((s) => s.id === lastId) ||
            (tab === "welcome" && slides.find((s) => s.occasion === S.getActiveWelcome())) ||
            slides[0];

        applyTabUi();
        renderList();
        loadEditor(current);
        renderTvStatus();
    }

    function applyTabUi() {
        const welcome = tab === "welcome";

        tabs.querySelectorAll("button").forEach((b) =>
            b.classList.toggle("active", b.dataset.tab === tab)
        );
        $("pageTitle").textContent = welcome ? "🏠 Welcome Screens" : "📢 Announcements";
        $("listLabel").textContent = welcome ? "Pick an occasion to edit" : "Your slides";
        $("newSlideBox").hidden = welcome;
        $("showSlideButton").hidden = welcome;
        $("slideshowBox").hidden = welcome;
        $("useWelcomeButton").hidden = !welcome;
        $("resetWelcomeButton").hidden = !welcome;
        slideName.readOnly = welcome;

        const url = new URL(location.href);
        url.searchParams.set("tab", tab);
        url.searchParams.delete("occasion");
        history.replaceState(null, "", url);
    }

    tabs.addEventListener("click", (e) => {
        const name = e.target.closest("button")?.dataset.tab;
        if (name && name !== tab) loadTab(name);
    });

    const params = new URLSearchParams(location.search);
    const startOccasion = params.get("occasion");
    await loadTab(
        params.get("tab") === "welcome" || startOccasion ? "welcome" : "announcement",
        startOccasion ? "welcome-" + startOccasion : null
    );
    sizeTvPreview();

    // Web fonts arrive a moment after the page — re-check fit then.
    if (document.fonts) document.fonts.ready.then(checkOverflow);
});
