console.log("SCRIPT LOADED");

const message = document.getElementById("message");



document.getElementById("signupBtn").addEventListener("click", async () => {

    console.log("SIGNUP BUTTON CLICKED");

    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!email || !password) {
        message.textContent = "Please enter an email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        console.error("SIGNUP ERROR:", error);
        message.textContent = error.message;
        return;
    }

    console.log("SIGNUP RESPONSE:", data);

    message.textContent =
        "Account created! You can now log in.";
});




document.getElementById("loginBtn").addEventListener("click", async () => {

    console.log("LOGIN BUTTON CLICKED");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        message.textContent = "Please enter an email and password.";
        return;
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        console.error("LOGIN ERROR:", error);
        message.textContent = error.message;
        return;
    }

    console.log("LOGGED IN USER:", data.user);

    message.textContent = "Login successful!";

    await loadProfile();
});




async function loadProfile() {

    console.log("Checking for logged-in user...");

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
        console.error("USER ERROR:", userError);
        return;
    }

    if (!user) {
        console.log("No user is currently logged in.");
        return;
    }

    console.log("Current user ID:", user.id);

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

    console.log("PROFILE:", profile);

    message.textContent =
        `Welcome, ${profile.username}!`;

    // Fill profile inputs
    document.getElementById("usernameInput").value =
        profile.username || "";

    document.getElementById("fullNameInput").value =
        profile.full_name || "";
}


document.getElementById("saveProfileBtn").addEventListener("click", async () => {

    console.log("SAVING PROFILE...");

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
            username: username,
            full_name: fullName
        })
        .eq("id", user.id);

    if (error) {
        console.error("PROFILE UPDATE ERROR:", error);
        message.textContent = error.message;
        return;
    }

    console.log("PROFILE UPDATED!");

    message.textContent =
        "Profile saved successfully!";

    // Reload profile so the welcome message updates too
    await loadProfile();
});




loadProfile();
loadCapsules();

document.getElementById("createCapsuleBtn").addEventListener("click", async () => {

    console.log("CREATING CAPSULE...");

    const title =
        document.getElementById("capsuleTitle").value.trim();

    const capsuleText =
        document.getElementById("capsuleMessage").value.trim();

    const unlockAt =
        document.getElementById("unlockDate").value;

    const capsuleStatus =
    document.getElementById("capsuleStatus");


    if (!title || !capsuleText || !unlockAt) {
        capsuleStatus.textContent =
            "Please fill in all the fields.";

        return;
    }


    
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        console.error("USER ERROR:", userError);

        capsuleStatus.textContent =
            "Please log in first.";

        return;
    }


    // Insert capsule
    const { data, error } =
        await supabaseClient
            .from("capsules")
            .insert({
                user_id: user.id,
                title: title,
                message: capsuleText,
                unlock_at: unlockAt
            })
            .select()
            .single();


    if (error) {

        console.error("CAPSULE ERROR:", error);

        capsuleStatus.textContent =
            error.message;

        return;
    }


    console.log("CAPSULE CREATED:", data);

    capsuleStatus.textContent =
        "🔒 Capsule locked successfully!";


    // Clear form
    document.getElementById("capsuleTitle").value = "";
    document.getElementById("capsuleMessage").value = "";
    document.getElementById("unlockDate").value = "";

});


async function loadCapsules() {

    console.log("Loading capsules...");

    const capsulesList =
        document.getElementById("capsulesList");


    
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        console.log("No logged-in user.");

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


    console.log("CAPSULES:", capsules);


    
    if (!capsules || capsules.length === 0) {

        capsulesList.innerHTML =
            "<p>You haven't created any capsules yet.</p>";

        return;
    }


    
    capsulesList.innerHTML = "";



    const now = new Date();


    
    capsules.forEach(capsule => {

        const unlockTime =
            new Date(capsule.unlock_at);

        const card =
            document.createElement("div");

        card.className = "capsule-card";


    
        if (unlockTime <= now) {

            card.innerHTML = `
                <h3>🔓 ${escapeHTML(capsule.title)}</h3>

                <p>
                    <strong>Unlocked</strong>
                </p>

                <p>
                    ${escapeHTML(capsule.message)}
                </p>

                <small>
                    Unlocked on:
                    ${unlockTime.toLocaleString()}
                </small>
            `;

        } else {

            card.innerHTML = `
                <h3>🔒 ${escapeHTML(capsule.title)}</h3>

                <p>
                    <strong>Locked</strong>
                </p>

                <p>
                    Opens on:
                    ${unlockTime.toLocaleString()}
                </p>
            `;
        }


        capsulesList.appendChild(card);

    });
}




function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}