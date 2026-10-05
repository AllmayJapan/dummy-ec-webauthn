# 🛒 passkey-store-demo

> **"Passwords are so 2010. Let's kill them already."**
> A lightweight, zero-BS proof of concept showing how painless WebAuthn / Passkeys actually are.

Ever wondered why we still force users to remember 16-character passwords with 3 symbols, a hieroglyph, and their grandma's maiden name? Yeah, me neither.

This is a dead-simple, bare-bones dummy e-commerce checkout flow built from scratch to show off the magic of **FIDO2 / WebAuthn**. Fingerprint goes *boop*, signature gets checked, user logs in. Pure cryptography, zero password-leak panic.

---

## ⚡ Technical Highlights (The Good Stuff)

* **🚫 Zero Passwords, Zero Heartaches:**
There is literally no password database to get breached. If a hacker dumps the DB, congratulations—all they get is a useless bucket of public keys. Good luck cracking ECDSA/P-256 with that!
* **🛡️ Phishing-Resistant by Design:**
Built-in browser origin validation (`localhost` / WebAuthn RP ID). The private key never leaves the client's secure enclave, meaning fake phishing domains can't do jack.
* **📦 Clean Standard Flows:**
* **Attestation:** Registration ceremony creating asymmetric key pairs on the fly.
* **Assertion:** Challenge-response login verifying cryptographic signatures against stored public keys.


* **⚡ Native Browser Standards:**
Vanilla JS frontend leveraging `navigator.credentials` + modern backend verification via `@simplewebauthn`. No bloat, no 40MB UI frameworks—just pure WebAuthn goodness.

---

## 🚀 Quickstart

Fire it up in 30 seconds flat:

```bash
# 1. Grab the code
git clone https://github.com/<your-username>/dummy-ec-webauthn.git
cd dummy-ec-webauthn

# 2. Install dependencies
npm install

# 3. Spin up the server
node server.js

```

Head over to `http://localhost:3000`, punch in a test username, tap **New passkey Registration**, and watch your OS/Touch ID/Windows Hello do the heavy lifting.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js + Express
* **Frontend:** Plain HTML5, Vanilla JavaScript, CSS3
* **Crypto / WebAuthn Engine:** `@simplewebauthn/server` & `@simplewebauthn/browser`
* **Testing:** Fully compatible with Chrome DevTools Virtual Authenticator (CTAP2)

---

## 👨‍💻 Why I Built This

I'm diving deep into cybersecurity and modern authentication protocols. Instead of just reading the W3C spec until my eyes bleed, I wanted to build an end-to-end sandbox to see how the bytes actually fly between the authenticator, browser, and server.

Feel free to fork it, break it, inspect the binary payloads, or use it as a blueprint for your next project!

---