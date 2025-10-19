import admin from "../firebaseAdmin.js";


const authenticateFirebaseToken = async (req, res, next) => {
    const token = req.headers.authorization?.split("Bearer ")[1]
    if (!token){
        console.log("token missing");
        return res.status(401).json({ error: "Token missing" })
    }
    try {

        const decodedToken = await admin.auth().verifyIdToken(token);

        if (!decodedToken.email_verified) {
            console.log("Email not verified")
            return res.status(403).json({ error: "Email not verified" });
        }

        req.user = decodedToken;
        next()

    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(403).json({ error: "Invalid or Expired token" });
    }
}

export default authenticateFirebaseToken