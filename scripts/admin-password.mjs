// Creates the admin login (or changes its password).
// The password is typed in the Terminal (hidden) and goes straight to Supabase;
// it is never shown or written to any file.
//
// Usage: npm run admin:password      (uses ADMIN_EMAIL from .env.local)

import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: secret, ADMIN_EMAIL: email } = process.env;
if (!url || !secret || !email) throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and ADMIN_EMAIL must be set in .env.local");

/** Ask a question without echoing what is typed. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

console.log(`Admin email: ${email}\n`);
const password = await askHidden("New password (at least 10 characters): ");
if (password.length < 10) {
  console.log("✗ Too short. Please run the command again.");
  process.exit(1);
}
const again = await askHidden("Type the same password again: ");
if (again !== password) {
  console.log("✗ The two passwords are different. Please run the command again.");
  process.exit(1);
}

// Find the user (if it exists) and create or update it.
let existing = null;
for (let page = 1; !existing; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  existing = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  if (data.users.length < 200) break;
}

const { error } = existing
  ? await db.auth.admin.updateUserById(existing.id, { password })
  : await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) throw error;
console.log(existing ? "✓ Password changed." : "✓ Admin login created.");
console.log("  Log in at /admin/login on the website.");
