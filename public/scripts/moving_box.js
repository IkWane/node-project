const url = window.location.href;
const wsServer = new WebSocket(url);

const box = document.getElementById("moving_box");
const hint_text = document.getElementById("hint_text");
const hint_typewriter = document.getElementById("hint_typewriter")
const text = hint_text.innerText;

const id = Math.trunc(Math.random() * 10000)

const default_box_width = 50;
const default_box_height = 50;

const box_update_interval = 1000 / 90;
const hint_update_interval = 1000 / 25;

var others_id = [];
var others_pos = [];
var boxes = [];

var inputs = [0, 0, 0, 0];

var posX = window.innerWidth/2;
var posY = window.innerHeight/2;
var vertical_velocity = 0;
var can_jump = false;
const speed = 10;
const gravity = 1;

var n = 0;
var unmaking = false;
var pause = 0;
var typewriter_animation = 0;

function update_title_text() {
    if (pause == 0) {
        if (unmaking) {
            if (n > 0) {
                n -= 1;
            } else {
                unmaking = false;
                pause = 10;
            }
        } else {
            if (n < text.length) {
                n += 1;
            } else {
                unmaking = true;
                pause = 10;
            }
        }
    } else {
        pause -= 1;
    }

    hint_text.innerHTML = text.slice(0, n);
}

function update_box() {
    const dirX = inputs[0] - inputs[1];
    const dirY = inputs[3];
    const sneak = inputs[2];

    if (sneak) {
        box.style.height = default_box_height/2 + "px";
    } else {
        box.style.height = default_box_height + "px";
    }

    if (dirY > 0 && can_jump) {
        vertical_velocity -= 20;
        can_jump = false;
    }

    posX += dirX * speed;
    vertical_velocity += gravity;
    posY += vertical_velocity;
    
    if (posY + box.clientHeight/2 > window.innerHeight) {
        posY = window.innerHeight - box.clientHeight/2;
        vertical_velocity = 0;
        can_jump = true;
    } else if (posY - box.clientHeight/2 < 0) {
        posY = box.clientHeight/2;
    }

    if (posX + box.clientWidth/2 > window.innerWidth) {
        posX = window.innerWidth - box.clientWidth/2;
    } else if (posX - box.clientWidth/2 < 0) {
        posX = box.clientWidth/2;
    }


    box.style.left = String(posX - box.clientWidth/2) + "px";
    box.style.top = String(posY - box.clientHeight/2) + "px";

    typewriter_animation += 0.1;
    hint_typewriter.style.color = "rgba(0,0,0," + String((Math.sin(typewriter_animation) + 1)/2) + ")";
}

function updateServerPos() {
    const data = {
        type: "pos_update",
        id: id,
        x: posX,
        y: posY
    }
    if (wsServer.readyState == WebSocket.OPEN) {
        wsServer.send(JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    for (let index = 0; index < others_id.length; index++) {
        boxes[index].style.left = String(others_pos[index].x - boxes[index].clientWidth/2) + "px";
        boxes[index].style.top = String(others_pos[index].y - boxes[index].clientHeight/2) + "px";
    }
}

document.body.addEventListener("keypress", (event) => {
    if (!event.repeat) {
        switch(event.key) {
            case "d" :
                inputs[0] = 1;
                break;
            case "q" :
                inputs[1] = 1;
                break;
            case "s" :
                inputs[2] = 1;
                break;
            case "z" :
                inputs[3] = 1;
                break;
        }
    }
});

document.body.addEventListener("keyup", function(event) {
    if (!event.repeat) {
        switch(event.key) {
            case "d" :
                inputs[0] = 0;
                break;
            case "q" :
                inputs[1] = 0;
                break;
            case "s" :
                inputs[2] = 0;
                break;
            case "z" :
                inputs[3] = 0;
                break;
        }
    }
});

wsServer.onmessage = function(msg) {
    const data = JSON.parse(msg.data);
    switch (data.type) {
        case "timeout":
            const index = others_id.indexOf(data.id);
            if (index != -1) {
                others_id.splice(index, 1);
                others_pos.splice(index, 1);
                boxes[index].remove();
                boxes.splice(index, 1);
            }
            break;
        case "pos_update":
            if (data.id != id) {
                const index = others_id.indexOf(data.id);
                if (index != -1) {
                    others_pos[index].x = data.x;
                    others_pos[index].y = data.y;
                } else {
                    others_id.push(data.id);
                    others_pos.push({
                        x: data.x,
                        y: data.y
                    });
                    const new_box = document.createElement("div")
                    new_box.className = "moving_box";
                    new_box.id = "moving_box-" + data.id;
                    document.body.appendChild(new_box);
                    boxes.push(new_box);
                }
            }
            break;
        default:
            console.log("Unspecified json message : ", data);
            break;
    }
}

setInterval(update_box, box_update_interval);
setInterval(update_title_text, hint_update_interval);
setInterval(updateServerPos, box_update_interval * 2);
