import admin from "firebase-admin";
import fs from "fs";

// Render mounts secret files here
const serviceAccount = JSON.parse(
  fs.readFileSync("/etc/secrets/serviceAccount.json", "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;