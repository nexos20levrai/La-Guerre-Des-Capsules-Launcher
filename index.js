const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const os = require("os");
const https = require("https");
const unzipper = require("unzipper");
const path = require("path");
const { exec } = require("child_process");

let mainWindow;

const pastebinUrl = "https://raw.githubusercontent.com/nexos20levrai/La-Guerre-Des-Capsules-DL/refs/heads/main/version.txt";
const gameZipUrl = "https://raw.githubusercontent.com/nexos20levrai/La-Guerre-Des-Capsules-DL/refs/heads/main/Win/Build.zip";
const updateNotesUrl = "https://raw.githubusercontent.com/nexos20levrai/La-Guerre-Des-Capsules-DL/refs/heads/main/update_notes.txt";

const gameFolder = path.join(process.env.APPDATA, ".La Guerre Des Capsules");

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 576,
        resizable: false,
        autoHideMenuBar: true,
        icon: "assets/icon.ico",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile("index.html");

    fetchUpdateNotes();
    fetchLastVersioUwU();
});

async function fetchUpdateNotes() {
    try {
        const fetch = (await import("node-fetch")).default;
        const response = await fetch(updateNotesUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const notes = await response.text();
        mainWindow.webContents.send("update-notes", notes);
    } catch (error) {
        console.error("Error fetching update notes:", error);
    }
}

async function fetchLastVersioUwU() {
    try {
        const fetch = (await import("node-fetch")).default;
        if (!fs.existsSync(gameFolder)) {
            fs.mkdirSync(gameFolder, { recursive: true });
        }

        const localVersionPath = path.join(gameFolder, "version.txt");

        if (!fs.existsSync(localVersionPath)) {
            fs.writeFileSync(localVersionPath, "Jeu non installé !", "utf-8");
        }

        const notes = fs.readFileSync(localVersionPath, "utf-8");
        mainWindow.webContents.send("version", notes);
    } catch (error) {
        console.error("Error fetching update notes:", error);
    }
}

ipcMain.handle("checkForUpdates", async (event) => {
    try {
        const fetch = (await import("node-fetch")).default;
        const response = await fetch(pastebinUrl);
        const latestVersion = (await response.text()).trim();
        const localVersionPath = path.join(gameFolder, "version.txt");

        if (!fs.existsSync(gameFolder)) {
            fs.mkdirSync(gameFolder, { recursive: true });
        }

        const localVersion = fs.existsSync(localVersionPath)
            ? fs.readFileSync(localVersionPath, "utf8").trim()
            : "0.0";

        if (localVersion !== latestVersion) {
            await downloadAndInstall(latestVersion);
            return { status: "updated", version: latestVersion };
        }

        return { status: "up-to-date", version: localVersion };
    } catch (error) {
        return { status: "error", message: error.message };
    }
});

async function downloadAndInstall(version) {
    const zipPath = path.join(gameFolder, "build.zip");

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);
        https.get(gameZipUrl, (response) => {
            response.pipe(file);
            file.on("finish", () => {
                file.close(async () => {
                    fs.createReadStream(zipPath)
                        .pipe(unzipper.Extract({ path: gameFolder }))
                        .on("close", () => {
                            fs.unlinkSync(zipPath);
                            fs.writeFileSync(
                                path.join(gameFolder, "version.txt"),
                                version
                            );
                            resolve();
                        })
                        .on("error", reject);
                });
            });
        }).on("error", reject);
    });
}

const launchFolder = path.join(process.env.APPDATA, ".La Guerre Des Capsules", "Build");

ipcMain.handle("launchGame", () => {
    const exePath = path.join(process.env.APPDATA, ".La Guerre Des Capsules", "Build", "La Guerre Des Capsules.exe");

    if (!fs.existsSync(exePath)) {
        console.error(`Executable not found: ${exePath}`);
        return;
    }

    const command = `"${exePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error launching game: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log("Game launched successfully!");
        console.log(`stdout: ${stdout}`);
        app.quit();
    });
});
