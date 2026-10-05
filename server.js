const express = require('express');
const path = require('path');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Deffinition Relying Party
const rpName = 'Dummy EC Store';
const rpID = 'localhost';
const expectedOrigin = `http://localhost:${PORT}`;

// An inline-database for learning
const users = new Map(); // username -> { id, username, credentials: [] }
const userChallenges = new Map(); // username -> challenge (temporary save)

// ----------------------------------------
// 1. Registration flow, generation a passkey
// ----------------------------------------

// (1) Retrieving registration options
app.post('/api/register/options', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    let user = users.get(username);
    if (!user) {
        user = {
            id: Buffer.from(username),
            username,
            credentials: [],
        };
        users.set(username, user);
    }

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: user.id,
        userName: user.username,
        attestationType: 'none',
        // Exclude the registed key (Prevention duplicated registration of authenticator)
        excludeCredentials: user.credentials.map((cred) => ({
            id: cred.id,
            type: 'public-key',
            transports: cred.transports,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'discouraged',
        },
    });

    userChallenges.set(username, options.challenge);

    res.json(options);
});

app.post('/api/register/verify', async (req, res) => {
    const { username, response } = req.body;
    const user = users.get(username);
    const expectedChallenge = userChallenges.get(username);

    if (!user || !expectedChallenge) {
        return res.status(400).json({ error: 'Invalid session or user' });
    }

    try {
        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpID,
            requireUserVerification: false,
        });

        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo;

            // Save the credentials and pub-key to DB
            user.credentials.push({
                id: credential.id,
                publicKey: credential.publicKey,
                counter: credential.counter,
                transports: credential.transports, 
            });

            userChallenges.delete(username);
            return res.json({ verified: true, message: 'Registration success!'});
        }

        res.status(400).json({ verified: false, error: 'Verification failed'});
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// ----------------------------------------
// 2. Rigistration flows
// ----------------------------------------

// (1) Retrieving options of authentication
app.post('/api/login/options', async (req, res) => {
    const { username } = req.body;
    const user = users.get(username);

    if (!user || user.credentials.length === 0) {
        return res.status(400).json({ error: 'The user does not exist, or no passkey has been registered.'});
    }

    const options = await generateAuthenticationOptions({
        rpID,
        // Displays a list of public keys registered by the user.
        allowCredentials: user.credentials.map((cred) => ({
            id: cred.id,
            type: 'public-key',
            transports: cred.transports,
        })),
        userVerification: 'discouraged',
    });

    userChallenges.set(username, options.challenge);

    res.json(options);
});

// (2) Verifications the signeture of auth-response
app.post('/api/login/verify', async (req, res) => {
    const { username, response } = req.body;
    const user = users.get(username);
    const expectedChallenge = userChallenges.get(username);

    if (!user || !expectedChallenge) {
        return res.status(400).json({ error: 'Invalid session or user' });
    }

    // Find the public key associated with the provided credential ID
    const credential = user.credentials.find((c) => c.id === response.id);
    if (!credential) {
        return res.status(400).json({ error: 'This credentials have not been registered'});
    }

    try {
        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpID,
            credential: {
                id: credential.id,
                publicKey: credential.publicKey,
                counter: credential.counter,
                transports: credential.transports,
            },
            requireUserVerification: false,
        });

        if (verification.verified) {
            // Updates the counter for prevention replay-attack
            credential.counter = verification.authenticationInfo.newCounter;
            userChallenges.delete(username);

            return res.json({ verified: true, message: `You have successfully logged in to ${username}!`});
        }

        res.status(400).json({ verfied: false, error: 'Login failed'})
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});