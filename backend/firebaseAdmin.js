import admin from "firebase-admin";
import fs from "fs";

// Render mounts secret files here
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccount.json")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;