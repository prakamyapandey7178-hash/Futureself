console.log("SCRIPT LOADED");

const message = document.getElementById("message");


// =====================================
// SIGN UP
// =====================================

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


// =====================================
// LOGIN
// =====================================

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


// =====================================
// LOAD PROFILE
// =====================================

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


// =====================================
// SAVE PROFILE
// =====================================

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


// =====================================
// CHECK LOGIN WHEN PAGE LOADS
// =====================================

loadProfile();
// =====================================
// CREATE CAPSULE
// =====================================

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


    // Get logged-in user
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