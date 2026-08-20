const usernameElement = document.getElementById("username");
const logoutBtn = document.getElementById("logoutBtn");
const currentDateElement = document.getElementById("currentDate");
const spaceGreeting = document.getElementById("spaceGreeting");
const diaryCount = document.getElementById("diaryCount");
const capsuleCount = document.getElementById("capsuleCount");
const lockedCount = document.getElementById("lockedCount");
const recentEntries = document.getElementById("recentEntries");
const nextCapsule = document.getElementById("nextCapsule");

let currentUser = null;

function showDate() {
    const now = new Date();

    currentDateElement.textContent = now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function showGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        spaceGreeting.textContent =
            "Good morning. A new little chapter is waiting for you.";
    } else if (hour < 18) {
        spaceGreeting.textContent =
            "Good afternoon. Take a moment to come back to yourself.";
    } else {
        spaceGreeting.textContent =
            "Good evening. The stars are listening.";
    }
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

function getTimeRemaining(dateString) {
    const difference = new Date(dateString).getTime() - Date.now();

    if (difference <= 0) {
        return "Ready to be opened ✦";
    }

    const days = Math.floor(difference / 86400000);
    const hours = Math.floor(
        (difference % 86400000) / 3600000
    );

    if (days > 0) {
        return `${days} day${days === 1 ? "" : "s"} away`;
    }

    if (hours > 0) {
        return `${hours} hour${hours === 1 ? "" : "s"} away`;
    }

    const minutes = Math.floor(
        (difference % 3600000) / 60000
    );

    return `${Math.max(minutes, 1)} minute${minutes === 1 ? "" : "s"} away`;
}

async function loadUser() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return false;
    }

    currentUser = user;

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

    if (!profileError && profile && profile.username) {
        usernameElement.textContent = profile.username + ".";
    } else {
        usernameElement.textContent = "dreamer.";
    }

    return true;
}

async function loadDiaryStats() {
    const { data, error } = await supabaseClient
        .from("diary_entries")
        .select("id, title, content, created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("DIARY ERROR:", error);
        return;
    }

    diaryCount.textContent = data.length;

    if (data.length === 0) {
        recentEntries.innerHTML = `
            <div class="empty-space-message">
                <span>✎</span>
                <p>Your first diary entry is waiting to be written.</p>
                <a href="diary.html">Write something →</a>
            </div>
        `;
        return;
    }

    recentEntries.innerHTML = "";

    data.slice(0, 3).forEach(entry => {
        const card = document.createElement("article");

        card.className = "recent-entry";

        card.innerHTML = `
            <div>
                <span class="recent-date">
                    ${formatDate(entry.created_at)}
                </span>

                <h3>${escapeHTML(entry.title)}</h3>

                <p>${escapeHTML(entry.content)}</p>
            </div>

            <span class="recent-arrow">→</span>
        `;

        recentEntries.appendChild(card);
    });
}

async function loadCapsuleStats() {
    const { data, error } = await supabaseClient
        .from("time_capsules")
        .select("id, title, content, unlock_date")
        .eq("user_id", currentUser.id)
        .order("unlock_date", { ascending: true });

    if (error) {
        console.error("CAPSULE ERROR:", error);
        return;
    }

    capsuleCount.textContent = data.length;

    const now = new Date();

    const locked = data.filter(
        capsule => new Date(capsule.unlock_date) > now
    );

    lockedCount.textContent = locked.length;

    if (locked.length === 0) {
        nextCapsule.innerHTML = `
            <div class="capsule-placeholder">
                <span>✦</span>
                <p>No sealed messages are waiting.</p>
                <a href="capsules.html">Create a time capsule →</a>
            </div>
        `;
        return;
    }

    const capsule = locked[0];

    nextCapsule.innerHTML = `
        <div class="next-capsule-card">
            <div class="next-capsule-symbol">✦</div>

            <div>
                <span class="recent-date">SEALED UNTIL</span>

                <h3>${escapeHTML(capsule.title)}</h3>

                <p>${formatDate(capsule.unlock_date)}</p>

                <strong>
                    ${getTimeRemaining(capsule.unlock_date)}
                </strong>
            </div>
        </div>
    `;
}

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
});

async function initializeSpace() {
    showDate();
    showGreeting();

    const loggedIn = await loadUser();

    if (!loggedIn) {
        return;
    }

    await Promise.all([
        loadDiaryStats(),
        loadCapsuleStats()
    ]);
}

initializeSpace();