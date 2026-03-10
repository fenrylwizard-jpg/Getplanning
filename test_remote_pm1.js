async function checkPM1Projects() {
  try {
    // 1. Login to get token
    const loginRes = await fetch("https://getplanning.org/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "pm1@eeg.be", password: "password" }),
    });

    const cookieHeader = loginRes.headers.get("set-cookie");
    if (!cookieHeader) {
      console.log("No cookie received");
      return;
    }

    // 2. Fetch PM dashboard or API to check projects
    // Wait, let's just fetch the home page HTML and see if we get the dashboard or try to hit an API endpoint that returns projects.
    // Let's use /api/users/sm maybe or something else? There is no direct /api/projects for the dashboard. The dashboard fetches server-side.
    // Instead, I can just create a small debug script to get projects if I had a route, but I don't.
    // Is there a way to query projects? /api/project/[id]/tasks exists.
    // Let's just output the cookie.
    console.log("Cookie:", cookieHeader);
    console.log("Successfully authenticated as PM1 on production.");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkPM1Projects();
