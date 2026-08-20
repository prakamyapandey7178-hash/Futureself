const titleInput = document.getElementById("diaryTitle");
const contentInput = document.getElementById("diaryContent");
const saveButton = document.getElementById("saveDiaryBtn");
const message = document.getElementById("diaryMessage");
const entriesContainer = document.getElementById("entriesContainer");
const todayDate = document.getElementById("todayDate");
const logoutBtn = document.getElementById("logoutBtn");
const characterCount = document.getElementById("characterCount");
const wordCount = document.getElementById("wordCount");
const entryCount = document.getElementById("entryCount");

const editModal = document.getElementById("editModal");
const deleteModal = document.getElementById("deleteModal");

const editTitle = document.getElementById("editTitle");
const editContent = document.getElementById("editContent");
const updateDiaryBtn = document.getElementById("updateDiaryBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const closeEditModal = document.getElementById("closeEditModal");
const editMessage = document.getElementById("editMessage");

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const closeDeleteModal = document.getElementById("closeDeleteModal");

let currentUser = null;
let editingEntryId = null;
let deletingEntryId = null;

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

function updateWritingStats() {
    const content = contentInput.value;

    characterCount.textContent =
        `${content.length} / 5000`;

    const words = content.trim()
        ? content.trim().split(/\s+/).length
        : 0;

    wordCount.textContent =
        `${words} ${words === 1 ? "word" : "words"}`;
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit"
    });
}

async function loadEntries() {
    const { data, error } = await supabaseClient
        .from("diary_entries")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("LOAD ENTRIES ERROR:", error);

        entriesContainer.innerHTML = `
            <div class="empty-message">
                <span>☾</span>
                <h3>Something went quiet.</h3>
                <p>We couldn't load your memories right now.</p>
            </div>
        `;

        return;
    }

    entryCount.textContent =
        `${data.length} ${data.length === 1 ? "memory" : "memories"}`;

    if (!data || data.length === 0) {
        entriesContainer.innerHTML = `
            <div class="empty-message">
                <span>✦</span>
                <h3>Your story starts here.</h3>
                <p>
                    Write something today and it will become
                    a little piece of your universe.
                </p>
            </div>
        `;

        return;
    }

    entriesContainer.innerHTML = "";

    data.forEach(entry => {
        const card = document.createElement("article");

        card.className = "entry-card";

        card.innerHTML = `
            <div class="entry-top">
                <div>
                    <div class="entry-date">
                        ${formatDate(entry.created_at)}
                        ·
                        ${formatTime(entry.created_at)}
                    </div>

                    <h3>${escapeHTML(entry.title)}</h3>
                </div>

                <div class="entry-actions">

                    <button
                        type="button"
                        class="entry-edit"
                        data-id="${entry.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="entry-delete"
                        data-id="${entry.id}"
                    >
                        Delete
                    </button>

                </div>
            </div>

            <p class="entry-content">
                ${escapeHTML(entry.content)}
            </p>
        `;

        entriesContainer.appendChild(card);
    });

    document.querySelectorAll(".entry-edit").forEach(button => {
        button.addEventListener("click", () => {
            const entry = data.find(
                item => item.id === button.dataset.id
            );

            if (entry) {
                openEditModal(entry);
            }
        });
    });

    document.querySelectorAll(".entry-delete").forEach(button => {
        button.addEventListener("click", () => {
            deletingEntryId = button.dataset.id;
            deleteModal.classList.add("show");
        });
    });
}

async function saveEntry() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        message.textContent =
            "Write a title and something in your diary first.";
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

    updateWritingStats();

    message.textContent = "Saved among the stars ✦";

    await loadEntries();

    saveButton.disabled = false;

    setTimeout(() => {
        message.textContent = "";
    }, 3000);
}

function openEditModal(entry) {
    editingEntryId = entry.id;

    editTitle.value = entry.title;
    editContent.value = entry.content;
    editMessage.textContent = "";

    editModal.classList.add("show");
}

function closeEdit() {
    editModal.classList.remove("show");
    editingEntryId = null;
}

async function updateEntry() {
    const title = editTitle.value.trim();
    const content = editContent.value.trim();

    if (!title || !content) {
        editMessage.textContent =
            "Your memory needs a title and some words.";
        return;
    }

    updateDiaryBtn.disabled = true;
    editMessage.textContent = "Saving changes...";

    const { error } = await supabaseClient
        .from("diary_entries")
        .update({
            title: title,
            content: content
        })
        .eq("id", editingEntryId)
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("UPDATE ENTRY ERROR:", error);
        editMessage.textContent = error.message;
        updateDiaryBtn.disabled = false;
        return;
    }

    editMessage.textContent = "Memory updated ✦";

    await loadEntries();

    setTimeout(() => {
        closeEdit();
        updateDiaryBtn.disabled = false;
    }, 700);
}

async function deleteEntry() {
    if (!deletingEntryId) {
        return;
    }

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Deleting...";

    const { error } = await supabaseClient
        .from("diary_entries")
        .delete()
        .eq("id", deletingEntryId)
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("DELETE ENTRY ERROR:", error);
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Delete memory";
        return;
    }

    deleteModal.classList.remove("show");

    deletingEntryId = null;

    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Delete memory";

    await loadEntries();
}

contentInput.addEventListener("input", updateWritingStats);

saveButton.addEventListener("click", saveEntry);

updateDiaryBtn.addEventListener("click", updateEntry);

cancelEditBtn.addEventListener("click", closeEdit);

closeEditModal.addEventListener("click", closeEdit);

confirmDeleteBtn.addEventListener("click", deleteEntry);

cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.classList.remove("show");
    deletingEntryId = null;
});

closeDeleteModal.addEventListener("click", () => {
    deleteModal.classList.remove("show");
    deletingEntryId = null;
});

editModal.addEventListener("click", event => {
    if (event.target === editModal) {
        closeEdit();
    }
});

deleteModal.addEventListener("click", event => {
    if (event.target === deleteModal) {
        deleteModal.classList.remove("show");
        deletingEntryId = null;
    }
});

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
});

async function initializeDiary() {
    showToday();
    updateWritingStats();

    const loggedIn = await checkUser();

    if (!loggedIn) {
        return;
    }

    await loadEntries();
}

initializeDiary();