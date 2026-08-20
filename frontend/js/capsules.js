const titleInput = document.getElementById("capsuleTitle");
const contentInput = document.getElementById("capsuleContent");
const unlockInput = document.getElementById("unlockDate");
const saveButton = document.getElementById("saveCapsuleBtn");
const message = document.getElementById("capsuleMessage");
const capsulesContainer = document.getElementById("capsulesContainer");
const logoutBtn = document.getElementById("logoutBtn");

const capsuleCount = document.getElementById("capsuleCount");
const sealedCount = document.getElementById("sealedCount");

const characterCount = document.getElementById("capsuleCharacterCount");
const wordCount = document.getElementById("capsuleWordCount");

const capsuleModal = document.getElementById("capsuleModal");
const closeCapsuleModal = document.getElementById("closeCapsuleModal");

const openedCapsuleDate =
    document.getElementById("openedCapsuleDate");

const openedCapsuleTitle =
    document.getElementById("openedCapsuleTitle");

const openedCapsuleContent =
    document.getElementById("openedCapsuleContent");

let currentUser = null;

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

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function isUnlocked(dateString) {
    return new Date(dateString).getTime() <= Date.now();
}

function getCountdown(dateString) {
    const difference =
        new Date(dateString).getTime() - Date.now();

    if (difference <= 0) {
        return "Ready to open ✦";
    }

    const days = Math.floor(
        difference / 86400000
    );

    const hours = Math.floor(
        (difference % 86400000) / 3600000
    );

    const minutes = Math.floor(
        (difference % 3600000) / 60000
    );

    if (days > 0) {
        return `${days} day${days === 1 ? "" : "s"} away`;
    }

    if (hours > 0) {
        return `${hours} hour${hours === 1 ? "" : "s"} away`;
    }

    return `${Math.max(minutes, 1)} minute${minutes === 1 ? "" : "s"} away`;
}

function openCapsule(capsule) {
    openedCapsuleDate.textContent =
        `Unlocked ${formatDateTime(capsule.unlock_date)}`;

    openedCapsuleTitle.textContent =
        capsule.title;

    openedCapsuleContent.textContent =
        capsule.content;

    capsuleModal.classList.add("show");
}

function closeModal() {
    capsuleModal.classList.remove("show");
}

async function deleteCapsule(id) {
    const confirmed =
        window.confirm(
            "Delete this time capsule permanently?"
        );

    if (!confirmed) {
        return;
    }

    const { error } = await supabaseClient
        .from("time_capsules")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("DELETE CAPSULE ERROR:", error);
        message.textContent = error.message;
        return;
    }

    message.textContent =
        "The capsule has drifted away ✦";

    await loadCapsules();
}

async function loadCapsules() {
    const { data, error } = await supabaseClient
        .from("time_capsules")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("unlock_date", { ascending: true });

    if (error) {
        console.error("LOAD CAPSULES ERROR:", error);

        capsulesContainer.innerHTML = `
            <div class="empty-message">
                <span>☾</span>
                <h3>Something went quiet.</h3>
                <p>
                    We couldn't load your capsules right now.
                </p>
            </div>
        `;

        return;
    }

    capsuleCount.textContent = data.length;

    const lockedCapsules = data.filter(
        capsule => !isUnlocked(capsule.unlock_date)
    );

    sealedCount.textContent =
        `${lockedCapsules.length} sealed`;

    if (!data || data.length === 0) {
        capsulesContainer.innerHTML = `
            <div class="empty-message">
                <span>✦</span>
                <h3>Nothing is waiting yet.</h3>
                <p>
                    Send a message to your future self
                    and let time carry it forward.
                </p>
            </div>
        `;

        return;
    }

    capsulesContainer.innerHTML = "";

    data.forEach(capsule => {
        const unlocked =
            isUnlocked(capsule.unlock_date);

        const card =
            document.createElement("article");

        card.className =
            unlocked
                ? "capsule-card unlocked"
                : "capsule-card locked";

        if (unlocked) {
            card.innerHTML = `
                <div class="capsule-card-top">

                    <div class="capsule-status">
                        ✦ UNLOCKED
                    </div>

                    <button
                        type="button"
                        class="capsule-delete"
                        data-id="${capsule.id}"
                    >
                        Delete
                    </button>

                </div>

                <div class="capsule-date">
                    Unlocked ${formatDate(capsule.unlock_date)}
                </div>

                <h3>${escapeHTML(capsule.title)}</h3>

                <p class="capsule-preview">
                    Your message is ready.
                </p>

                <button
                    type="button"
                    class="open-capsule"
                    data-id="${capsule.id}"
                >
                    Open message →
                </button>
            `;
        } else {
            card.innerHTML = `
                <div class="capsule-card-top">

                    <div class="capsule-status">
                        🔒 SEALED
                    </div>

                    <button
                        type="button"
                        class="capsule-delete"
                        data-id="${capsule.id}"
                    >
                        Delete
                    </button>

                </div>

                <div class="capsule-date">
                    Opens ${formatDateTime(capsule.unlock_date)}
                </div>

                <h3>${escapeHTML(capsule.title)}</h3>

                <p class="locked-message">
                    This message is still sleeping.
                </p>

                <div class="capsule-countdown">
                    <span>☾</span>
                    ${getCountdown(capsule.unlock_date)}
                </div>
            `;
        }

        capsulesContainer.appendChild(card);
    });

    document
        .querySelectorAll(".open-capsule")
        .forEach(button => {
            button.addEventListener("click", () => {
                const capsule =
                    data.find(
                        item =>
                            item.id === button.dataset.id
                    );

                if (capsule) {
                    openCapsule(capsule);
                }
            });
        });

    document
        .querySelectorAll(".capsule-delete")
        .forEach(button => {
            button.addEventListener("click", () => {
                deleteCapsule(button.dataset.id);
            });
        });
}

async function saveCapsule() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const unlockDate = unlockInput.value;

    if (!title || !content || !unlockDate) {
        message.textContent =
            "Complete your capsule before sealing it.";
        return;
    }

    const selectedDate =
        new Date(unlockDate);

    if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate <= new Date()
    ) {
        message.textContent =
            "Choose a future date and time.";
        return;
    }

    saveButton.disabled = true;
    message.textContent =
        "Sealing your message...";

    const { error } = await supabaseClient
        .from("time_capsules")
        .insert({
            user_id: currentUser.id,
            title: title,
            content: content,
            unlock_date: selectedDate.toISOString()
        });

    if (error) {
        console.error(
            "SAVE CAPSULE ERROR:",
            error
        );

        message.textContent =
            error.message;

        saveButton.disabled = false;

        return;
    }

    titleInput.value = "";
    contentInput.value = "";
    unlockInput.value = "";

    updateWritingStats();

    message.textContent =
        "Your message has been sealed in time ✦";

    await loadCapsules();

    saveButton.disabled = false;
}

contentInput.addEventListener(
    "input",
    updateWritingStats
);

saveButton.addEventListener(
    "click",
    saveCapsule
);

closeCapsuleModal.addEventListener(
    "click",
    closeModal
);

capsuleModal.addEventListener(
    "click",
    event => {
        if (event.target === capsuleModal) {
            closeModal();
        }
    }
);

logoutBtn.addEventListener(
    "click",
    async event => {
        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";
    }
);

async function initializeCapsules() {
    updateWritingStats();

    const loggedIn =
        await checkUser();

    if (!loggedIn) {
        return;
    }

    await loadCapsules();
}

initializeCapsules();

setInterval(() => {
    document
        .querySelectorAll(".capsule-card.locked")
        .forEach(card => {
            const dateText =
                card.querySelector(".capsule-date");

            const countdown =
                card.querySelector(".capsule-countdown");

            if (!dateText || !countdown) {
                return;
            }
        });
}, 60000);