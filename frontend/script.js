console.log("SCRIPT LOADED");

const message = document.getElementById("message");

document.getElementById("signupBtn").addEventListener("click", async () => {
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!email || !password) {
        message.textContent = "Please enter an email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error("SIGNUP ERROR:", error);
        message.textContent = error.message;
        return;
    }

    console.log("SIGNUP RESPONSE:", data);
    message.textContent = "Account created! You can now log in.";
});

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        message.textContent = "Please enter an email and password.";
        return;
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        console.error("LOGIN ERROR:", error);
        message.textContent = error.message;
        return;
    }

    message.textContent = "Login successful!";

    await loadProfile();
    await loadCapsules();
});

async function loadProfile() {
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
        console.error("USER ERROR:", userError);
        return;
    }

    if (!user) {
        return;
    }

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        return;
    }

    message.textContent = `Welcome, ${profile.username}!`;

    document.getElementById("usernameInput").value =
        profile.username || "";

    document.getElementById("fullNameInput").value =
        profile.full_name || "";
}

document.getElementById("saveProfileBtn").addEventListener("click", async () => {
    const username =
        document.getElementById("usernameInput").value.trim();

    const fullName =
        document.getElementById("fullNameInput").value.trim();

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        message.textContent = "Please log in first.";
        return;
    }

    const { error } = await supabaseClient
        .from("profiles")
        .update({
            username,
            full_name: fullName
        })
        .eq("id", user.id);

    if (error) {
        console.error("PROFILE UPDATE ERROR:", error);
        message.textContent = error.message;
        return;
    }

    message.textContent = "Profile saved successfully!";

    await loadProfile();
});

document.getElementById("createCapsuleBtn").addEventListener("click", async () => {
    const title =
        document.getElementById("capsuleTitle").value.trim();

    const capsuleText =
        document.getElementById("capsuleMessage").value.trim();

    const unlockAt =
        document.getElementById("unlockDate").value;

    const file =
        document.getElementById("capsuleFile").files[0];

    const capsuleStatus =
        document.getElementById("capsuleStatus");

    if (!title || !capsuleText || !unlockAt) {
        capsuleStatus.textContent =
            "Please fill in the title, message and unlock time.";
        return;
    }

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        capsuleStatus.textContent = "Please log in first.";
        return;
    }

    let filePath = null;

    if (file) {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.type)) {
            capsuleStatus.textContent =
                "Please select a JPG, PNG, WEBP or GIF image.";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            capsuleStatus.textContent =
                "Image must be smaller than 5 MB.";
            return;
        }

        const fileExtension =
            file.name.split(".").pop().toLowerCase();

        filePath =
            `${user.id}/${crypto.randomUUID()}.${fileExtension}`;

        const { error: uploadError } =
            await supabaseClient.storage
                .from("capsule-files")
                .upload(filePath, file);

        if (uploadError) {
            console.error("UPLOAD ERROR:", uploadError);
            capsuleStatus.textContent =
                uploadError.message;
            return;
        }
    }

    const { data, error } =
        await supabaseClient
            .from("capsules")
            .insert({
                user_id: user.id,
                title,
                message: capsuleText,
                unlock_at: unlockAt,
                file_path: filePath
            })
            .select()
            .single();

    if (error) {
        console.error("CAPSULE ERROR:", error);

        if (filePath) {
            await supabaseClient.storage
                .from("capsule-files")
                .remove([filePath]);
        }

        capsuleStatus.textContent = error.message;
        return;
    }

    console.log("CAPSULE CREATED:", data);

    capsuleStatus.textContent =
        "🔒 Capsule locked successfully!";

    document.getElementById("capsuleTitle").value = "";
    document.getElementById("capsuleMessage").value = "";
    document.getElementById("unlockDate").value = "";
    document.getElementById("capsuleFile").value = "";

    await loadCapsules();
});

async function loadCapsules() {
    const capsulesList =
        document.getElementById("capsulesList");

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        capsulesList.innerHTML =
            "<p>Please log in to see your capsules.</p>";
        return;
    }

    const { data: capsules, error } =
        await supabaseClient
            .from("capsules")
            .select("*")
            .eq("user_id", user.id)
            .order("unlock_at", { ascending: true });

    if (error) {
        console.error("CAPSULE LOAD ERROR:", error);
        capsulesList.innerHTML =
            `<p>${error.message}</p>`;
        return;
    }

    if (!capsules || capsules.length === 0) {
        capsulesList.innerHTML =
            "<p>You haven't created any capsules yet.</p>";
        return;
    }

    capsulesList.innerHTML = "";

    capsules.forEach(capsule => {
        const card = document.createElement("div");
        card.className = "capsule-card";

        const unlockTime =
            new Date(capsule.unlock_at);

        const now =
            new Date();

        if (unlockTime <= now) {
            card.innerHTML = `
                <h3>🔓 ${escapeHTML(capsule.title)}</h3>
                <p><strong>Unlocked!</strong></p>
                <p>${escapeHTML(capsule.message)}</p>
                <small>Unlocked on: ${unlockTime.toLocaleString()}</small>
            `;

            if (capsule.file_path) {
                addPrivateImage(card, capsule.file_path);
            }

            capsulesList.appendChild(card);
        } else {
            card.innerHTML = `
                <h3>🔒 ${escapeHTML(capsule.title)}</h3>
                <p><strong>Time remaining:</strong></p>
                <p id="countdown-${capsule.id}">Calculating...</p>
                <small>Opens on: ${unlockTime.toLocaleString()}</small>
            `;

            capsulesList.appendChild(card);

            startCountdown(capsule, card, unlockTime);
        }
    });
}

function startCountdown(capsule, card, unlockTime) {
    const countdown =
        document.getElementById(`countdown-${capsule.id}`);

    const timer = setInterval(async () => {
        const now = new Date();
        const difference = unlockTime - now;

        if (difference <= 0) {
            clearInterval(timer);

            card.innerHTML = `
                <h3>🔓 ${escapeHTML(capsule.title)}</h3>
                <p><strong>Unlocked!</strong></p>
                <p>${escapeHTML(capsule.message)}</p>
                <small>Unlocked just now.</small>
            `;

            if (capsule.file_path) {
                addPrivateImage(card, capsule.file_path);
            }

            return;
        }

        const totalSeconds =
            Math.floor(difference / 1000);

        const days =
            Math.floor(totalSeconds / 86400);

        const hours =
            Math.floor((totalSeconds % 86400) / 3600);

        const minutes =
            Math.floor((totalSeconds % 3600) / 60);

        const seconds =
            totalSeconds % 60;

        countdown.textContent =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

async function addPrivateImage(card, filePath) {
    const { data, error } =
        await supabaseClient.storage
            .from("capsule-files")
            .createSignedUrl(filePath, 3600);

    if (error) {
        console.error("IMAGE URL ERROR:", error);
        return;
    }

    const image = document.createElement("img");

    image.src = data.signedUrl;
    image.alt = "FutureSelf capsule photo";
    image.style.maxWidth = "100%";

    card.appendChild(image);
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("LOGOUT ERROR:", error);
        message.textContent = error.message;
        return;
    }

    message.textContent = "You have been logged out.";

    document.getElementById("usernameInput").value = "";
    document.getElementById("fullNameInput").value = "";
    document.getElementById("capsulesList").innerHTML = "";
});

loadProfile();
loadCapsules();