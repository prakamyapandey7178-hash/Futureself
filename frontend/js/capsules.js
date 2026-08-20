const titleInput = document.getElementById("capsuleTitle");
const contentInput = document.getElementById("capsuleContent");
const unlockInput = document.getElementById("unlockDate");
const saveButton = document.getElementById("saveCapsuleBtn");
const message = document.getElementById("capsuleMessage");
const capsulesContainer = document.getElementById("capsulesContainer");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

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
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function isUnlocked(dateString) {
    return new Date(dateString) <= new Date();
}

async function loadCapsules() {
    const { data, error } = await supabaseClient
        .from("time_capsules")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("unlock_date", { ascending: true });

    if (error) {
        console.error("LOAD CAPSULES ERROR:", error);
        capsulesContainer.innerHTML =
            '<p class="empty-message">Unable to load your capsules.</p>';
        return;
    }

    if (!data || data.length === 0) {
        capsulesContainer.innerHTML =
            '<p class="empty-message">Your sealed messages will appear here.</p>';
        return;
    }

    capsulesContainer.innerHTML = "";

    data.forEach(capsule => {
        const unlocked = isUnlocked(capsule.unlock_date);

        const card = document.createElement("article");
        card.className = unlocked
            ? "capsule-card unlocked"
            : "capsule-card locked";

        if (unlocked) {
            card.innerHTML = `
                <div class="capsule-status">✦ UNLOCKED</div>

                <div class="capsule-date">
                    Opened ${formatDate(capsule.unlock_date)}
                </div>

                <h3>${escapeHTML(capsule.title)}</h3>

                <p>${escapeHTML(capsule.content)}</p>
            `;
        } else {
            card.innerHTML = `
                <div class="capsule-status">🔒 SEALED</div>

                <div class="capsule-date">
                    Opens ${formatDate(capsule.unlock_date)}
                </div>

                <h3>${escapeHTML(capsule.title)}</h3>

                <p class="locked-message">
                    This message is still sleeping.
                </p>
            `;
        }

        capsulesContainer.appendChild(card);
    });
}

saveButton.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const unlockDate = unlockInput.value;

    if (!title || !content || !unlockDate) {
        message.textContent = "Complete your capsule before sealing it.";
        return;
    }

    const selectedDate = new Date(unlockDate);

    if (selectedDate <= new Date()) {
        message.textContent = "Choose a future date.";
        return;
    }

    saveButton.disabled = true;
    message.textContent = "Sealing your message...";

    const { error } = await supabaseClient
        .from("time_capsules")
        .insert({
            user_id: currentUser.id,
            title: title,
            content: content,
            unlock_date: selectedDate.toISOString()
        });

    if (error) {
        console.error("SAVE CAPSULE ERROR:", error);
        message.textContent = error.message;
        saveButton.disabled = false;
        return;
    }

    titleInput.value = "";
    contentInput.value = "";
    unlockInput.value = "";

    message.textContent = "Your message has been sealed in time ✦";

    await loadCapsules();

    saveButton.disabled = false;
});

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
});

async function initializeCapsules() {
    const loggedIn = await checkUser();

    if (!loggedIn) {
        return;
    }

    await loadCapsules();
}

initializeCapsules();