const canvas = document.getElementById("main-canvas");
const ctx= canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var mpx, mpy;

function update_mouse(event) {
    mpx = event.clientX;
    mpy = event.clientY;
}

function draw_circle(x , y, r, color) {
    ctx.beginPath();
    ctx.fillStyle = 'rgb('+color+')';
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
}

setInterval(() => {
    draw_circle(mpx, mpy, 20, '255,255,0');
}, 1)