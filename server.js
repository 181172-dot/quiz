const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

// 管理者IDとパスワード（自由に変更OK）
const ADMINS = {
    admin: "quiz123",
    teacher: "school456"
};

let teams = [];

const wss = new WebSocket.Server({ port: PORT });

function broadcast() {
    const msg = JSON.stringify({
        type: "update",
        teams
    });
    wss.clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(msg);
        }
    });
}

wss.on("connection", ws => {
    ws.isAdmin = false;

    // 初期データ送信
    ws.send(JSON.stringify({
        type: "update",
        teams
    }));

    ws.on("message", msg => {
        let data;
        try {
            data = JSON.parse(msg.toString());
        } catch {
            return;
        }

        // 管理者ログイン
        if (data.type === "login") {
            const ok = ADMINS[data.id] === data.password;
            ws.isAdmin = ok;
            ws.send(JSON.stringify({
                type: "admin",
                success: ok
            }));
            return;
        }

        if (!ws.isAdmin) return;

        if (data.type === "addTeam") {
            teams.push({ name: "チーム", score: 0 });
        }

        if (data.type === "deleteTeam") {
            teams.splice(data.index, 1);
        }

        if (data.type === "update") {
            teams = data.teams;
        }

        if (data.type === "reset") {
            teams.forEach(t => t.score = 0);
        }

        broadcast();
    });
});

console.log("WebSocket server running");
