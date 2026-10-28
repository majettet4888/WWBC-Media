/*
 * WWBC Slides — shared code for announcement slides.
 *
 * Used by BOTH the Announcements editor (announcements.html) and the
 * TV (display.html), so a slide is drawn by the exact same code in
 * both places and always looks identical.
 *
 * Where slides are kept: in this browser's built-in database
 * (IndexedDB) on the church Chromebook. It holds far more than
 * localStorage (photos included) and survives restarts. It is wiped
 * only if someone clears Chrome's browsing data for the site — which
 * is what the Backup / Restore buttons on the Announcements page are
 * for.
 *
 * Talking to the TV uses small localStorage "signals" (localStorage
 * fires an event in every other open tab on the same site):
 *   displayMode          = "announcement"   → TV switches to slides
 *   announcementShow     = {mode, slideId | interval, startedAt, label, ts}
 *   announcementsUpdated = timestamp        → TV redraws (slide edited)
 */

(function (global) {
    "use strict";

    const DB_NAME = "wwbc-media";
    const DB_VERSION = 1;
    const STORE = "slides";

    const CANVAS_W = 1920;
    const CANVAS_H = 1080;

    /* ---------------- storage ---------------- */

    let dbPromise = null;

    function openDb() {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: "id" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        return dbPromise;
    }

    function tx(mode, work) {
        return openDb().then(
            (db) =>
                new Promise((resolve, reject) => {
                    const t = db.transaction(STORE, mode);
                    const store = t.objectStore(STORE);
                    const result = work(store);
                    t.oncomplete = () =>
                        resolve(result && "result" in result ? result.result : undefined);
                    t.onerror = () => reject(t.error);
                    t.onabort = () => reject(t.error);
                })
        );
    }

    async function getAllSlides() {
        const slides = (await tx("readonly", (s) => s.getAll())) || [];
        return slides.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    function saveSlide(slide) {
        slide.updatedAt = Date.now();
        return tx("readwrite", (s) => s.put(slide));
    }

    function saveSlides(slides) {
        return tx("readwrite", (s) => {
            slides.forEach((slide) => s.put(slide));
        });
    }

    function deleteSlide(id) {
        return tx("readwrite", (s) => s.delete(id));
    }

    function replaceAllSlides(slides) {
        return tx("readwrite", (s) => {
            s.clear();
            slides.forEach((slide) => s.put(slide));
        });
    }

    /* ---------------- backgrounds ---------------- */

    // Built-in pictures already on the site.
    const PRESET_IMAGES = {
        church:             { label: "Church Photo",        url: "images/WWBC-Church.jpg" },
        foundersDay:        { label: "Founders' Day",       url: "images/founders-day-bg.jpg" },
        pastorAppreciation: { label: "Pastor Appreciation", url: "images/pastor-appreciation-bg.jpg" },
        thanksgiving:       { label: "Thanksgiving",        url: "images/thanksgiving-bg.jpg" },
        christmas:          { label: "Christmas",           url: "images/christmas-bg.jpg" },
        newYearsEve:        { label: "New Year's Eve",      url: "images/new-years-eve-bg.jpg" },
        newYearsDay:        { label: "New Year's Day",      url: "images/new-years-day-bg.jpg" }
    };

    // One-click color backgrounds.
    const PRESET_FILLS = [
        { label: "Royal Blue",   value: "linear-gradient(135deg, #1d3557 0%, #0b1a33 100%)" },
        { label: "Burgundy",     value: "linear-gradient(135deg, #7a1f2b 0%, #3b0d14 100%)" },
        { label: "Forest Green", value: "linear-gradient(135deg, #2f5d3a 0%, #13281a 100%)" },
        { label: "Purple",       value: "linear-gradient(135deg, #5b2a86 0%, #2a1040 100%)" },
        { label: "Gold",         value: "linear-gradient(135deg, #e3c26b 0%, #b8892a 100%)" },
        { label: "Sky",          value: "linear-gradient(135deg, #8ec5fc 0%, #e0c3fc 100%)" },
        { label: "Black",        value: "#000000" },
        { label: "White",        value: "#ffffff" }
    ];

    function backgroundCss(bg) {
        if (!bg) return { image: "", color: "#000" };

        if (bg.kind === "preset" && PRESET_IMAGES[bg.value]) {
            return { image: `url("${PRESET_IMAGES[bg.value].url}")`, color: "#000" };
        }
        if (bg.kind === "photo" && bg.value) {
            return { image: `url("${bg.value}")`, color: "#000" };
        }
        if (bg.kind === "fill" && bg.value) {
            if (bg.value.startsWith("linear-gradient")) {
                return { image: bg.value, color: "#000" };
            }
            return { image: "", color: bg.value };
        }
        return { image: "", color: "#000" };
    }

    /* ---------------- drawing a slide ---------------- */

    /*
     * Draws `slide` into `canvas` (an element of class slide-canvas,
     * 1920x1080). Returns the text element, which the editor turns
     * into an editable box.
     */
    function renderSlide(canvas, slide) {
        canvas.innerHTML = "";
        canvas.classList.add("slide-canvas");

        const bg = slide.bg || {};
        const css = backgroundCss(bg);

        const bgEl = document.createElement("div");
        bgEl.className = "slide-bg";
        bgEl.style.backgroundColor = css.color;
        bgEl.style.backgroundImage = css.image;
        bgEl.style.backgroundSize =
            bg.kind === "fill" ? "cover" : bg.fit === "contain" ? "contain" : "cover";
        canvas.appendChild(bgEl);

        const dim = Math.max(0, Math.min(0.8, Number(bg.dim) || 0));
        if (dim > 0) {
            const dimEl = document.createElement("div");
            dimEl.className = "slide-dim";
            dimEl.style.background = `rgba(0, 0, 0, ${dim})`;
            canvas.appendChild(dimEl);
        }

        const frame = document.createElement("div");
        frame.className = `slide-frame valign-${slide.valign || "middle"}`;
        canvas.appendChild(frame);

        const content = document.createElement("div");
        content.className = "slide-content";
        if (slide.shadow) content.classList.add("with-shadow");
        if (slide.lineHeight) content.style.lineHeight = slide.lineHeight;
        if (slide.spread) content.classList.add("spread");
        content.innerHTML = slide.html || "";
        fillFields(content);
        frame.appendChild(content);

        return content;
    }

    /*
     * TV safety net: if a slide's text is taller than the screen (too
     * many lines, or the countdown is taking room at the bottom),
     * shrink the whole text block just enough to fit instead of
     * cutting lines off. Used on the TV only — the editor warns
     * instead, so the person making the slide can fix it properly.
     */
    function shrinkToFit(content) {
        if (!content || !content.parentElement) return 1;

        content.style.transform = "";
        content.style.height = "";
        content.style.maxHeight = "";
        content.style.marginBottom = "";
        content.style.flexShrink = "";

        const frame = content.parentElement;
        const fs = getComputedStyle(frame);
        const available =
            frame.clientHeight - parseFloat(fs.paddingTop) - parseFloat(fs.paddingBottom);

        content.style.maxHeight = "none";
        content.style.height = "auto";
        const natural = content.scrollHeight;

        if (natural <= available + 2) {
            content.style.maxHeight = "";
            content.style.height = "";
            return 1;
        }

        const scale = available / natural;
        content.style.flexShrink = "0";
        content.style.height = natural + "px";
        content.style.transformOrigin = "top center";
        content.style.transform = `scale(${scale})`;
        content.style.marginBottom = `${-(natural * (1 - scale))}px`;
        return scale;
    }

    /* ---------------- live fields (today's date) ---------------- */

    function todayLong() {
        return new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }

    // A "date" piece always shows today's date, whenever it's shown.
    function fillFields(root) {
        root.querySelectorAll('[data-field="date"]').forEach((el) => {
            el.textContent = todayLong();
            el.setAttribute("contenteditable", "false");
        });
    }

    function dateFieldHtml() {
        return `<span class="slide-field" data-field="date" contenteditable="false">${todayLong()}</span>`;
    }

    /*
     * Scales a 1920x1080 canvas to fit inside `box`, centered.
     */
    function fitCanvas(canvas, box) {
        const w = box.clientWidth;
        const h = box.clientHeight || (w * CANVAS_H) / CANVAS_W;
        const scale = Math.min(w / CANVAS_W, h / CANVAS_H);
        canvas.style.transform = `scale(${scale})`;
        canvas.style.position = "absolute";
        canvas.style.left = `${(w - CANVAS_W * scale) / 2}px`;
        canvas.style.top = `${(h - CANVAS_H * scale) / 2}px`;
        return scale;
    }

    /* ---------------- photos ---------------- */

    /*
     * Shrinks a photo (phone pictures can be 5–10 MB) down to what
     * the TV can actually show, and returns it as a data URL.
     */
    function resizeImageFile(file, maxW, maxH, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                const scale = Math.min(1, maxW / img.width, maxH / img.height);
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Keep transparency for PNGs (logos); JPEG for photos.
                const isPng = /png$/i.test(file.type);
                resolve(
                    isPng
                        ? canvas.toDataURL("image/png")
                        : canvas.toDataURL("image/jpeg", quality || 0.85)
                );
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Could not read that picture."));
            };
            img.src = url;
        });
    }

    /* ---------------- slideshow timing ---------------- */

    /*
     * Which slide a slideshow should be on right now. Worked out from
     * the clock (not a counter), so the TV and every preview on this
     * computer always agree on the current slide.
     */
    function slideshowPosition(show, count) {
        const interval = Math.max(3, Number(show.interval) || 8) * 1000;
        const elapsed = Math.max(0, Date.now() - (show.startedAt || 0));
        const step = Math.floor(elapsed / interval);
        return {
            index: count > 0 ? step % count : 0,
            msUntilNext: interval - (elapsed % interval)
        };
    }

    function readShow() {
        try {
            return JSON.parse(localStorage.getItem("announcementShow") || "null");
        } catch (error) {
            return null;
        }
    }

    /* ---------------- welcome screen designs ---------------- */

    /*
     * Each occasion's Welcome Screen is a slide too (kind "welcome"),
     * edited with the same editor as announcements. These are the
     * starting designs — they match how each Welcome Screen looked
     * before it became editable. "Reset" on the editor brings one
     * back to this.
     */
    const WELCOME_OCCASIONS = [
        { key: "normal",             label: "Normal Sunday" },
        { key: "foundersDay",        label: "Founders' Day" },
        { key: "pastorAppreciation", label: "Pastor Appreciation" },
        { key: "thanksgiving",       label: "Thanksgiving" },
        { key: "christmas",          label: "Christmas" },
        { key: "newYearsEve",        label: "New Year's Eve" },
        { key: "newYearsDay",        label: "New Year's Day" }
    ];

    const FOUNDERS_FIRST_YEAR = 2004; // Year 23 was 2026

    // Brush-stroke swash under "Anyhow" (same shape as before).
    const SWASH =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 60' preserveAspectRatio='none'>" +
            "<path d='M4 46 C 60 38, 140 26, 250 30 C 320 33, 360 40, 396 20 C 372 44, 330 50, 250 46 C 150 42, 70 46, 4 52 Z' fill='#1a1a1a'/></svg>"
        );

    function line(inner) {
        return `<div>${inner}</div>`;
    }

    function welcomeSeed(key) {
        const label = (WELCOME_OCCASIONS.find((o) => o.key === key) || {}).label || key;
        const base = {
            id: "welcome-" + key,
            kind: "welcome",
            occasion: key,
            name: label,
            valign: "middle",
            lineHeight: "1.1",
            spread: true
        };

        if (key === "normal") {
            return Object.assign(base, {
                shadow: true,
                bg: { kind: "preset", value: "church", fit: "cover", dim: 0.55 },
                html:
                    line('<b><span style="font-size: 118px;">Whosoever Will Baptist Church</span></b>') +
                    line('<b><span style="font-size: 145px;">Welcome</span></b>') +
                    line('<b><span style="font-size: 102px;">Sunday Worship Service</span></b>') +
                    line('<b><span style="font-size: 84px;">' + dateFieldHtml() + "</span></b>")
            });
        }

        if (key === "foundersDay") {
            const year = new Date().getFullYear() - FOUNDERS_FIRST_YEAR + 1;
            return Object.assign(base, {
                shadow: false,
                bg: { kind: "preset", value: "foundersDay", fit: "cover", dim: 0 },
                html:
                    line('<font color="#4b5a3a"><b><span style="font-size: 118px;">Whosoever Will Baptist Church</span></b></font>') +
                    line('<font face="Great Vibes" color="#b8471f"><span style="font-size: 182px;">Welcome</span></font>') +
                    line('<font color="#9a6b1e"><span style="font-size: 80px;">Celebrating Annual Founders\u2019 Day \u2013 Year ' + year + "</span></font>") +
                    '<div style="line-height: 0.9;">' +
                        '<div><font face="Playfair Display" color="#1a1a1a"><b><span style="font-size: 88px;">PRAISE</span></b></font></div>' +
                        '<div><font face="Playfair Display" color="#1a1a1a"><b><span style="font-size: 88px;">HIM</span></b></font></div>' +
                        '<div><font face="Kaushan Script" color="#1a1a1a"><span style="font-size: 120px;">Anyhow</span></font></div>' +
                        `<div style="line-height: 0; font-size: 0;"><img src="${SWASH}" alt="" style="height: 26px; width: 300px; border-radius: 0; margin: 4px 0 14px;"></div>` +
                        '<div><font face="Cormorant Garamond" color="#1a1a1a"><b><span style="font-size: 46px;">(Ain\u2019t Nobody God but God!)</span></b></font></div>' +
                    "</div>" +
                    line('<font face="Cormorant Garamond" color="#4b5a3a"><i><span style="font-size: 76px;">Speaker: Pastor Howard Woods Jr.</span></i></font>')
            });
        }

        const sub = {
            pastorAppreciation: "Pastor Appreciation Day",
            thanksgiving: "Thanksgiving Service",
            christmas: "Christmas Celebration",
            newYearsEve: "New Year\u2019s Eve Service",
            newYearsDay: "New Year\u2019s Day " + new Date().getFullYear()
        }[key] || label;

        return Object.assign(base, {
            shadow: false,
            bg: { kind: "preset", value: key in PRESET_IMAGES ? key : "church", fit: "cover", dim: 0 },
            html:
                line('<font color="#111111"><b><span style="font-size: 118px;">Whosoever Will Baptist Church</span></b></font>') +
                line('<font face="Great Vibes" color="#111111"><span style="font-size: 182px;">Welcome</span></font>') +
                line('<font color="#111111"><span style="font-size: 96px;">' + sub + "</span></font>") +
                line('<font face="Cormorant Garamond" color="#111111"><i><span style="font-size: 80px;">' + dateFieldHtml() + "</span></i></font>")
        });
    }

    /*
     * Makes sure every occasion has a Welcome Screen design. Missing
     * ones are created from the starting design; existing ones (which
     * may have been edited) are never touched.
     */
    async function ensureWelcomeDesigns() {
        const all = await getAllSlides();
        const have = new Set(all.filter((s) => s.kind === "welcome").map((s) => s.occasion));
        const missing = WELCOME_OCCASIONS
            .filter((o) => !have.has(o.key))
            .map((o, i) => Object.assign(welcomeSeed(o.key), { order: 1000 + i }));
        if (missing.length) await saveSlides(missing);
        return missing.length;
    }

    async function getWelcomeDesign(key) {
        const all = await getAllSlides();
        return all.find((s) => s.kind === "welcome" && s.occasion === key) || null;
    }

    // Which occasion's Welcome Screen the TV shows ("normal" if unset;
    // carries over the occasion chosen on the old Settings page).
    function getActiveWelcome() {
        let key = null;
        try {
            key = localStorage.getItem("activeWelcome");
            if (!key) {
                const old = JSON.parse(localStorage.getItem("welcomeSettings") || "{}");
                key = old.occasion || null;
            }
        } catch (error) {
            key = null;
        }
        return WELCOME_OCCASIONS.some((o) => o.key === key) ? key : "normal";
    }

    function setActiveWelcome(key) {
        localStorage.setItem("activeWelcome", key);
        localStorage.setItem("welcomeDesignUpdated", Date.now().toString());
    }

    function newId() {
        return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    global.WWBCSlides = {
        CANVAS_W,
        CANVAS_H,
        PRESET_IMAGES,
        PRESET_FILLS,
        getAllSlides,
        saveSlide,
        saveSlides,
        deleteSlide,
        replaceAllSlides,
        renderSlide,
        fitCanvas,
        resizeImageFile,
        slideshowPosition,
        readShow,
        newId,
        dateFieldHtml,
        shrinkToFit,
        fillFields,
        WELCOME_OCCASIONS,
        welcomeSeed,
        ensureWelcomeDesigns,
        getWelcomeDesign,
        getActiveWelcome,
        setActiveWelcome
    };
})(window);
