const titleInput = document.getElementById("diaryTitle");
const contentInput = document.getElementById("diaryContent");
const saveButton = document.getElementById("saveDiaryBtn");
const message = document.getElementById("diaryMessage");
const entriesContainer = document.getElementById("entriesContainer");
const todayDate = document.getElementById("todayDate");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

function showToday() {
    const date = new Date();

    todayDate.textContent = date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

async function checkUser() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return false;
    }

    currentUser = user;
    return true;
}

async function loadEntries() {
    const { data, error } = await supabaseClient
        .from("diary_entries")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("LOAD ENTRIES ERROR:", error);
        entriesContainer.innerHTML =
            '<p class="empty-message">Unable to load your memories.</p>';
        return;
    }

    if (!data || data.length === 0) {
        entriesContainer.innerHTML =
            '<p class="empty-message">Your little collection of memories will appear here.</p>';
        return;
    }

    entriesContainer.innerHTML = "";

    data.forEach(entry => {
        const card = document.createElement("article");

        card.className = "entry-card";

        const date = new Date(entry.created_at);

        card.innerHTML = `
            <div class="entry-date">
                ${date.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                })}
            </div>

            <h3>${escapeHTML(entry.title)}</h3>

            <p>${escapeHTML(entry.content)}</p>
        `;

        entriesContainer.appendChild(card);
    });
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

saveButton.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        message.textContent = "Write a title and something in your diary first.";
        return;
    }

    saveButton.disabled = true;
    message.textContent = "Saving your memory...";

    const { error } = await supabaseClient
        .from("diary_entries")
        .insert({
            user_id: currentUser.id,
            title: title,
            content: content
        });

    if (error) {
        console.error("SAVE ENTRY ERROR:", error);
        message.textContent = error.message;
        saveButton.disabled = false;
        return;
    }

    titleInput.value = "";
    contentInput.value = "";

    message.textContent = "Saved among the stars ✦";

    await loadEntries();

    saveButton.disabled = false;
});

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
});

async function initializeDiary() {
    showToday();

    const loggedIn = await checkUser();

    if (!loggedIn) {
        return;
    }

    await loadEntries();
}

initializeDiary();