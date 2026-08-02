let bible = null;

const books = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings",
    "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job",
    "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
    "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
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

const bookAliases = {

    // Old Testament
    "gen": "Genesis",
    "ge": "Genesis",

    "exo": "Exodus",
    "ex": "Exodus",

    "lev": "Leviticus",

    "num": "Numbers",

    "deut": "Deuteronomy",
    "dt": "Deuteronomy",

    "jos": "Joshua",

    "jud": "Judges",

    "rut": "Ruth",

    "1 sam": "1 Samuel",
    "2 sam": "2 Samuel",

    "1 sa": "1 Samuel",
    "2 sa": "2 Samuel",

    "1 kings": "1 Kings",
    "2 kings": "2 Kings",

    "1 kgs": "1 Kings",
    "2 kgs": "2 Kings",

    "1 chronicles": "1 Chronicles",
    "2 chronicles": "2 Chronicles",

    "1 chr": "1 Chronicles",
    "2 chr": "2 Chronicles",

    "ezr": "Ezra",

    "neh": "Nehemiah",

    "est": "Esther",

    "job": "Job",

    "ps": "Psalms",
    "psalm": "Psalms",

    "prov": "Proverbs",
    "pro": "Proverbs",

    "eccl": "Ecclesiastes",

    "song": "Song of Solomon",
    "song of songs": "Song of Solomon",
    "sos": "Song of Solomon",

    "isa": "Isaiah",

    "jer": "Jeremiah",

    "lam": "Lamentations",

    "ezek": "Ezekiel",

    "dan": "Daniel",

    "hos": "Hosea",

    "joe": "Joel",

    "amo": "Amos",

    "obad": "Obadiah",

    "jon": "Jonah",

    "mic": "Micah",

    "nah": "Nahum",

    "hab": "Habakkuk",

    "zep": "Zephaniah",

    "hag": "Haggai",

    "zec": "Zechariah",

    "mal": "Malachi",

    // New Testament

    "mt": "Matthew",

    "mk": "Mark",

    "lk": "Luke",

    "jn": "John",

    "acts": "Acts",

    "rom": "Romans",

    "1 cor": "1 Corinthians",
    "2 cor": "2 Corinthians",

    "1 co": "1 Corinthians",
    "2 co": "2 Corinthians",

    "gal": "Galatians",

    "eph": "Ephesians",

    "phil": "Philippians",

    "col": "Colossians",

    "1 th": "1 Thessalonians",
    "2 th": "2 Thessalonians",

    "1 thes": "1 Thessalonians",
    "2 thes": "2 Thessalonians",

    "1 tim": "1 Timothy",
    "2 tim": "2 Timothy",

    "tit": "Titus",

    "phm": "Philemon",

    "heb": "Hebrews",

    "jas": "James",

    "1 pet": "1 Peter",
    "2 pet": "2 Peter",

    "1 pe": "1 Peter",
    "2 pe": "2 Peter",

    "1 john": "1 John",
    "2 john": "2 John",
    "3 john": "3 John",

    "1 jn": "1 John",
    "2 jn": "2 John",
    "3 jn": "3 John",

    "jude": "Jude",

    "rev": "Revelation"
};

async function loadBible() {

    if (bible) return;

    const response = await fetch("data/kjv.json");

    if (!response.ok) {
        throw new Error("Unable to load Bible.");
    }

    bible = await response.json();

    console.log("Bible Loaded");
    console.log("Books:", bible.length);

}

async function getScripture(reference) {

    // Make the parser more forgiving
    reference = reference
    .trim()
    .replace(/;/g, ":")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+/g, " ")

// Insert a space between the book name and chapter if missing
reference = reference.replace(
    /^([1-3]?\s*[A-Za-z ]+?)(\d)/,
    "$1 $2"
);

// Add a space after leading numbers (1jn -> 1 jn)
reference = reference.replace(
    /^([1-3])([A-Za-z])/,
    "$1 $2"
);
    await loadBible();

    reference = reference.trim();

    const match = reference.match(
        /^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/
    );

    if (!match) {
        throw new Error("Invalid Bible reference.");
    }

    console.log(match);

    let bookName = match[1].trim();

    const alias = bookAliases[bookName.toLowerCase()];

    if (alias) {
        bookName = alias;
    }

    const chapter = parseInt(match[2]);

    const startVerse = match[3]
        ? parseInt(match[3])
        : 1;

    console.log(bookName);
    console.log(chapter);
    console.log(startVerse);

    const bookIndex = books.findIndex(
        book => book.toLowerCase() === bookName.toLowerCase()
    );

    bookName = books[bookIndex];

    console.log("Book Index:", bookIndex);

    if (bookIndex === -1) {
        throw new Error("Book not found.");
    }

    const chapterData = bible[bookIndex][chapter - 1];

    if (!chapterData) {
        throw new Error("Chapter not found.");
    }
    const chapterDataLength = chapterData.length;

    const endVerse = match[4]
        ? parseInt(match[4])
        : (match[3] ? startVerse : chapterDataLength);

    console.log(endVerse);

    console.log(chapterData);

    let verses = [];

    for (let i = startVerse; i <= endVerse; i++) {

        const verse = chapterData[i - 1];

        if (verse) {

            verses.push({
                verse: i,
                text: verse
            });

        }

    }

    return {
        reference: `${bookName} ${chapter}` +
            (match[3]
                ? `:${startVerse}` + (match[4] ? `-${match[4]}` : "")
                : ""),
        verses: verses
    };
}

async function getChapterCount(bookName) {
    await loadBible();

    const bookIndex = books.findIndex(
        book => book.toLowerCase() === bookName.toLowerCase()
    );

    if (bookIndex === -1) return 0;

    return bible[bookIndex].length;
}

async function getVerseCount(bookName, chapter) {
    await loadBible();

    const bookIndex = books.findIndex(
        book => book.toLowerCase() === bookName.toLowerCase()
    );

    if (bookIndex === -1) return 0;

    const chapterData = bible[bookIndex][chapter - 1];

    return chapterData ? chapterData.length : 0;
}