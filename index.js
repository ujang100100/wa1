const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./session")

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" })
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]

        if (!msg.message) return

        const from = msg.key.remoteJid
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

        if (text === ".ping") {
            await sock.sendMessage(from, {
                text: "Pong 🏓"
            })
        }

        if (text === ".menu") {
            await sock.sendMessage(from, {
                text:
`*MENU BOT*

.ping
.menu`
            })
        }
    })

    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            if (shouldReconnect) startBot()
        }

        if (connection === "open") {
            console.log("Bot Connected")
        }
    })
}

startBot()
