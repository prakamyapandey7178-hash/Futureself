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

    console.log("Sending signup request...");

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

    console.log("Trying to log in...");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
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

    // Load the profile after successful login
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

    const { data: profile, error: profileError } =
        await supabaseClient
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
}


// =====================================
// CHECK LOGIN WHEN PAGE LOADS
// =====================================

loadProfile();