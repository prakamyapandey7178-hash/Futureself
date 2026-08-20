const signupBtn = document.getElementById("signupBtn");
const message = document.getElementById("message");

signupBtn.addEventListener("click", async () => {
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!email || !password) {
        message.textContent = "Please enter your email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        message.textContent = error.message;
        return;
    }

    message.textContent = "Your space has been created ✦";

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1200);
});