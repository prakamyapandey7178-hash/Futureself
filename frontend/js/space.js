const usernameElement = document.getElementById("username");
const logoutBtn = document.getElementById("logoutBtn");

async function loadUser() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    if (profile && profile.username) {
        usernameElement.textContent = profile.username + ".";
    } else {
        usernameElement.textContent = "dreamer.";
    }
}

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
});

loadUser();