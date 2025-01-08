const { ipcRenderer } = require("electron");
const statusDiv = document.getElementById("status");
statusDiv.innerText = "Jouer !";

document.getElementById("check-updates").addEventListener("click", async () => {
    const statusDiv = document.getElementById("status");
    const button = document.getElementById("check-updates");

    button.disabled = true;
    statusDiv.innerText = "Téléchargement...";

    const result = await ipcRenderer.invoke("checkForUpdates");

    if (result.status === "updated") {
        statusDiv.innerText = "Installation...";

        setTimeout(() => { 
            button.disabled = false; // Re-enable the button after installation
            statusDiv.innerText = "Installation terminée.";
            button.innerText = "Jouer !"; // Reset button text to "Jouer !"
            ipcRenderer.invoke("launchGame"); // Launch the game
        }, 5000);
    } else if (result.status === "up-to-date") {
        statusDiv.innerText = "Jeu à jour.";
        button.disabled = false;
        ipcRenderer.invoke("launchGame");
    } else {
        statusDiv.innerText = `Erreur : ${result.message}`;
        button.disabled = false;
    }
});

ipcRenderer.on('download-progress', (event, progress) => {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = `Téléchargement... ${progress}%`; // Update status text with progress
});

// New code to display update notes
ipcRenderer.on('update-notes', (event, notes) => {
    const updateNotesDiv = document.getElementById("update-notes");
    updateNotesDiv.innerText = notes; // Display the fetched notes
});

document.getElementById("check-updates").addEventListener("dblclick", async () => {
    await ipcRenderer.invoke("launchGame");
});

const versionElement = document.getElementById("version");

// Écouter les données envoyées par le processus principal
ipcRenderer.on("version", (event, notes) => {
    console.log("Version received:", notes); // Log pour vérification
    versionElement.textContent = notes; // Mettre à jour l'élément HTML
});
