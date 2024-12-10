const express = require("express");
const fs = require("fs");
const ws = require("ws");
const app = express();
const port = 8080;
var client_ids = [];
var client_timeouts = [];
const timeout_delay = 200;

function log_debug(str) {
    fs.appendFile("./debug.log", str + "\n", {root:__dirname}, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

app.use(express.static(__dirname + "/public"));

app.set("trust proxy", true);

app.get("/", (req, res) => {
    res.sendFile("./index.html");
    log_debug(req.ip);
});

app.get("/moving_box", (req, res) => {
    const options = {
        root: __dirname + "/public"
    }
    res.sendFile("./pages/moving_box.html", options, (err) => {
        if (err) {
            console.error(err);
        }
    });
    log_debug(req.ip + " accessed moving box page");
});

const app_server = app.listen(port, () => {
    log_debug('\napp is listening on port ' + port);
});

const wsServer = new ws.Server({
    noServer: true
});

wsServer.on("connection", (ws) => {
    ws.on("message", (msg) => {
        const json_data = JSON.parse(msg.toString());
        const index = client_ids.indexOf(json_data.id);
        if (index != -1) {
            client_timeouts[index] = timeout_delay;
        } else {
            log_debug("new player connected, id: " + json_data.id);
            client_ids.push(json_data.id);
            client_timeouts.push(timeout_delay);
        }
        wsServer.clients.forEach((client) => {
            if (client.readyState == WebSocket.OPEN) {
                client.send(msg.toString(), (err) => {
                    if (err) {
                        log_debug(err);
                    }
                });
            }
        });
    });
});

app_server.on("upgrade", async function upgrade(request, socket, head) {
    wsServer.handleUpgrade(request, socket, head, (ws)=> {
        wsServer.emit("connection", ws, request);
    });
});

function update_tms() {
    for (let index = 0; index < client_timeouts.length; index++) {
        client_timeouts[index] -= 1;
        if (client_timeouts[index] == 0) {
            wsServer.clients.forEach((client) => {
                if (client.readyState == WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "timeout",
                        id: client_ids[index]
                    }), (err) => {
                        if (err) {
                            log_debug(err);
                        }
                    });
                }
            });
            log_debug("player timeout, id : " + client_ids[index]);
            client_timeouts.splice(index, 1);
            client_ids.splice(index, 1);
        }
    }
}

setInterval(update_tms, 0.01);