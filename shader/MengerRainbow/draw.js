let mengerShader;

function preload() {
    mengerShader = loadShader("MengerSponge.vert", "MengerSponge.frag");
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1.);
    noStroke();
}
function draw() {
    shader(mengerShader);
    mengerShader.setUniform('u_time', millis() / 1000);
    mengerShader.setUniform('u_resolution', [width, height]);
    mengerShader.setUniform('u_mouse', [mouseX, mouseY]);
    rect(0, 0, width, height);
    resetShader();
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight, WEBGL);
}