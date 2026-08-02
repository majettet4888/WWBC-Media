document.addEventListener("DOMContentLoaded", () => {

    const button = document.getElementById("displayButton");
    const referenceInput = document.getElementById("reference");
    
    // Put the cursor in the Bible Reference box when the page loads
referenceInput.focus();

const bibleBooks = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
    "Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel",
    "1 Kings","2 Kings",
    "1 Chronicles","2 Chronicles",
    "Ezra","Nehemiah","Esther","Job",
    "Psalms","Proverbs","Ecclesiastes","Song of Solomon",
    "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel",
    "Hosea","Joel","Amos","Obadiah","Jonah","Micah",
    "Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
    "Matthew","Mark","Luke","John","Acts",
    "Romans",
    "1 Corinthians","2 Corinthians",
    "Galatians","Ephesians","Philippians","Colossians",
    "1 Thessalonians","2 Thessalonians",
    "1 Timothy","2 Timothy",
    "Titus","Philemon","Hebrews","James",
    "1 Peter","2 Peter",
    "1 John","2 John","3 John",
    "Jude","Revelation"
];

    if (!button) return;

    button.addEventListener("click", async () => {

        const reference =
            document.getElementById("reference").value.trim();

        if (reference === "") {
            alert("Please enter a Bible reference.");
            return;
        }

        try {

            const scripture = await getScripture(reference);

            console.log(scripture);

            localStorage.setItem(
                "scriptureData",
                JSON.stringify(scripture)
            );

            localStorage.setItem(
                "referenceText",
                scripture.reference
            );

 if (!window.displayWindow || window.displayWindow.closed) {

    window.displayWindow = window.open(
        "display.html",
        "ScriptureDisplay"
    );

} else {

    // Notify the display page that the Scripture changed
    localStorage.setItem("scriptureUpdated", Date.now());

    window.displayWindow.focus();

}


// Return focus to the Bible Reference box
referenceInput.focus();

// Highlight the previous reference so typing replaces it
referenceInput.select();


        } catch (error) {

            alert("Unable to retrieve Scripture.");

            console.error(error);

        }

    });

  
    
const suggestionsBox = document.getElementById("bookSuggestions");

let selectedSuggestion = -1;
let currentMatches = [];

function refreshSuggestions() {

    const items = suggestionsBox.querySelectorAll(".suggestion-item");

    items.forEach((item, index) => {

        item.style.backgroundColor =
            index === selectedSuggestion ? "#e9f2ff" : "";

    });

}

referenceInput.addEventListener("input", () => {

    const value = referenceInput.value.trim().toLowerCase();

    suggestionsBox.innerHTML = "";

    if (value.length < 2) {
        suggestionsBox.style.display = "none";
        return;
    }

    currentMatches = bibleBooks.filter(book =>
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

            referenceInput.value = book + " ";

            suggestionsBox.style.display = "none";

            referenceInput.focus();

        });

        suggestionsBox.appendChild(item);

    });

    suggestionsBox.style.display = "block";

});

referenceInput.addEventListener("keydown", (event) => {

    console.log(event.key);

    // Arrow keys only work when suggestions are visible

    // Arrow keys only work when suggestions are visible
    if (suggestionsBox.style.display === "block") {

        const items = suggestionsBox.querySelectorAll(".suggestion-item");

        if (event.key === "ArrowDown") {

            event.preventDefault();

            selectedSuggestion =
                (selectedSuggestion + 1) % items.length;

            refreshSuggestions();

            return;

        }

        if (event.key === "ArrowUp") {

            event.preventDefault();

            selectedSuggestion =
                (selectedSuggestion - 1 + items.length) % items.length;

            refreshSuggestions();

            return;

        }

        if (event.key === "Escape") {

            suggestionsBox.style.display = "none";

            return;

        }

        if (event.key === "Enter" && selectedSuggestion >= 0) {

            event.preventDefault();

            referenceInput.value =
                currentMatches[selectedSuggestion] + " ";

            suggestionsBox.style.display = "none";

            referenceInput.focus();

            return;

        }

    }

    // If suggestions aren't being used, Enter displays the scripture
    if (event.key === "Enter") {

        event.preventDefault();

        button.click();

    }

});
});