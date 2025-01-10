const { ipcRenderer } = require("electron");
const statusDiv = document.getElementById("status");
statusDiv.innerText = "Jouer !";

document.getElementById("check-updates").addEventListener("click", async () => {
    const statusDiv = document.getElementById("status");
    const button = document.getElementById("check-updates");

    button.disabled = true;
    statusDiv.innerText = "Jouer !";

    const result = await ipcRenderer.invoke("checkForUpdates");

    if (result.status === "updated") {
        statusDiv.innerText = "Installation...";

        setTimeout(() => { 
            button.disabled = false;
            statusDiv.innerText = "Installation terminée.";
            button.innerText = "Jouer !";
            ipcRenderer.invoke("launchGame");
        }, 5000);
    } else if (result.status === "up-to-date") {
        statusDiv.innerText = "Jeu à jour";
        button.disabled = false;
        ipcRenderer.invoke("launchGame");
    } else {
        statusDiv.innerText = `Erreur : ${result.message}`;
        button.disabled = false;
    }
});

ipcRenderer.on("download-progress", (event) => {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = `Téléchargement...`;
});

ipcRenderer.on("update-notes", (event, notes) => {
    const updateNotesDiv = document.getElementById("update-notes");
    updateNotesDiv.innerText = notes;
});

document.getElementById("check-updates").addEventListener("dblclick", async () => {
    await ipcRenderer.invoke("launchGame");
});

const versionElement = document.getElementById("version");

ipcRenderer.on("version", (event, notes) => {
    versionElement.textContent = notes;
});
