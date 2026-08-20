const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        message.textContent = "Please enter your email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        message.textContent = error.message;
        return;
    }

    message.textContent = "Welcome back ✦";

    setTimeout(() => {
        window.location.href = "space.html";
    }, 800);
});