const fs = require('fs');

async function testLogin() {
  const credentials = [
    { email: "antigravity@eeg.be", password: "password" },
    { email: "antigravity.pm@eeg.be", password: "password" },
    { email: "pm1@eeg.be", password: "password" },
  ];
  let out = "";
  for (const cred of credentials) {
    try {
      const res = await fetch("https://getplanning.org/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cred),
      });

      const data = await res.json();
      out += `Email: ${cred.email} -> Status: ${res.status} | Response: ${JSON.stringify(data)}\n`;
    } catch (e) {
      out += `Email: ${cred.email} -> Error: ${e.message}\n`;
    }
  }
  fs.writeFileSync('test_remote_out3.txt', out, 'utf8');
}

testLogin();
