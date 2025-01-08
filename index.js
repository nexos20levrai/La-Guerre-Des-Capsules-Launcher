const { app, BrowserWindow, ipcMain } = require("electron"); // Garder cette ligne
const fetch = require("node-fetch");
const fs = require("fs");
const os = require("os");
const https = require("https");
const unzipper = require("unzipper");
const path = require("path");
const { exec } = require("child_process");

let mainWindow;

// URL pour vérifier la version
const pastebinUrl = "https://pastebin.com/raw/iYW9NG1b"; // Version actuelle
const gameZipUrl = "https://www.googleapis.com/drive/v3/files/1D-4ZcAjnmcWxI0L7mFRvgGx7Zf00sXGb?alt=media&key=AIzaSyCGE3KiwHENNSbet1JwbTwjHIXVMYAbYPE";
const updateNotesUrl = "https://pastebin.com/raw/1CG8M28L"; // Replace with your actual Pastebin ID

// Dossier où sera installé le jeu
const gameFolder = path.join(process.env.APPDATA, ".La Guerre Des Capsules");

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 576,
        resizable: false,
        autoHideMenuBar: true,
        icon: "assets/icon.ico", // Add this line
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile("index.html");

    // Fetch and display update notes
    fetchUpdateNotes();
    fetchLastVersioUwU();
});

async function fetchUpdateNotes() {
    try {
        const response = await fetch(updateNotesUrl);
        console.log("Response status:", response.status); // Log the response status
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const notes = await response.text();
        console.log("Fetched update notes:", notes); // Log the fetched notes
        mainWindow.webContents.send("update-notes", notes); // Send notes to renderer process
    } catch (error) {
        console.error("Error fetching update notes:", error);
    }
}

async function fetchLastVersioUwU() {
    try {
        // Vérifie si le dossier du jeu existe sinon le crée
        if (!fs.existsSync(gameFolder)) {
            fs.mkdirSync(gameFolder, { recursive: true });
        }

        const localVersionPath = path.join(gameFolder, "version.txt");

        // Si le fichier version.txt n'existe pas, le créer avec "Version 0.0"
        if (!fs.existsSync(localVersionPath)) {
            fs.writeFileSync(localVersionPath, "Jeu non installé !", "utf-8");
            console.log("version.txt created with default version: Version 0.0");
        }

        // Lire le fichier version.txt
        const notes = fs.readFileSync(localVersionPath, "utf-8");
        console.log("Fetched last version:", notes); // Log pour vérification

        // Envoyer les données au processus renderer
        mainWindow.webContents.send("version", notes);
    } catch (error) {
        console.error("Error fetching update notes:", error);
    }
}



// Vérifie et télécharge les mises à jour
ipcMain.handle("checkForUpdates", async (event) => {
    try {
        const response = await fetch(pastebinUrl);
        const latestVersion = (await response.text()).trim();
        const localVersionPath = path.join(gameFolder, "version.txt");

        // Crée le dossier du jeu s'il n'existe pas
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
                            fs.unlinkSync(zipPath); // Supprime le fichier ZIP
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

const launchFolder = path.join(process.env.APPDATA, ".La Guerre Des Capsules", "Build"); // Met à jour le chemin du dossier du jeu

ipcMain.handle("launchGame", () => {
    const exePath = path.join(process.env.APPDATA, ".La Guerre Des Capsules", "Build", "La Guerre Des Capsules.exe");
    console.log(`Launching game at: ${exePath}`);

    // Vérifiez si l'exécutable existe
    if (!fs.existsSync(exePath)) {
        console.error(`Executable not found: ${exePath}`);
        return;
    }

    // Créer la commande pour exécuter le fichier .exe dans cmd
    const command = `"${exePath}"`; // Peut-être ajouter un terminal si nécessaire

    // Exécuter la commande dans un terminal
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error launching game: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log("Game launched successfully!");
        console.log(`stdout: ${stdout}`);
    });
    app.quit();
});