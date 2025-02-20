document.addEventListener("DOMContentLoaded", function () {
    fetch("https://vr-game-server.onrender.com/api/games")
        .then(response => response.json())
        .then(data => {
            console.log("Data received:", data); // בדיקה אם הנתונים מתקבלים
            updateTable(data);
        })
        .catch(error => console.error("Error fetching data:", error));
});

function updateTable(games) {
    const tableBody = document.getElementById("game-results");
    if (!tableBody) {
        console.error("Table body not found!");
        return;
    }

    tableBody.innerHTML = ""; // מנקה את הטבלה לפני שמעדכנים

    games.forEach(game => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${game.playerName}</td>
            <td>${game.score}</td>
            <td>${game.time}</td>
            <td>${game.itemsCollected.join(", ")}</td>
        `;
        tableBody.appendChild(row);
    });
}
