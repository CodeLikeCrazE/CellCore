const MENU_WIDTH = 200;
const MENU_OPTION_HEIGHT = 5;
var deltaTime = 0.005;
var c = 0;
var cameraX = 0;
var cameraY = 0;
var cameraScale = 1;
var targetCameraX = 0;
var targetCameraY = 0;
var targetCameraScale = 1;
var editorHover = null;
var menuSelectionIndex = null;
var textures = {
    drill: "Tx2/Drill.png",
    pusher: "Tx2/Pusher.png",
    generator: "Tx2/Generator.png",
    rotater: "Tx2/Rotator.png",
    alternaterotater: "Tx2/AltRotater.png",
    blocker: "Tx2/Blocker.png",
    tileA: "Tx2/LightGrid.png",
    tileB: "Tx2/DarkGrid.png",
    eraser: "Tx2/Eraser.png",
    sucker: "Tx2/Sucker.png",
    pushable: "Tx2/Pushable.png",
    trash: "Tx2/Trash.png",
    menu: "Tx2/Menu.png",
    editor: "Tx2/Editor.png",
    fan: "Tx2/Fan.png",
};
var menuOptions = [];
var smoothedEditorToolIndex = 0;
var textureElements = {};
var gameTickTime = 0;
var tickFunction = menuTick;
var editorGrid;
var keysDown = [];
var mouseX;
var mouseY;
var mouseDown = false;
var editorDir = 0;
var smoothEditorDir = 0;
var editorToolIndex = 0;
var ctxTransform;
var editorTools = [
    'menu',
    'pusher',
    'blocker',
    'generator',
    'rotater',
    'alternaterotater',
    'drill',
    'pushable',
    'sucker',
    //'fan',
    'trash',
    'eraser',
];
var blockerImmovableDirections = [
    0,
    1,
    2,
    3
];
var selectedEditorTool = null;
var directions = [
    {
        x: 1,
        y: 0
    },
    {
        x: 0,
        y: 1
    },
    {
        x: -1,
        y: 0
    },
    {
        x: 0,
        y: -1
    }
];
var grid;
var editorGrid;

function gridContains(x, y) {
    return x >= 0 && y >= 0 && x < grid.length && y < grid[0].length;
}

Math.clamp = (c, a, b) => {
    if (c < a) {
        return a;
    }
    if (c > b) {
        return b;
    }
    return c;
}

window.onmousedown = (e) => {
    if (e.button == 2) {
        editorDir++;
    } else {
        if (tickFunction == menuTick) {
            if (menuSelectionIndex) {
                menuOptions[menuSelectionIndex].func();
            }
        }
        if (tickFunction == editorTick) {
            if (selectedEditorTool) {
                editorToolIndex = selectedEditorTool;
            } else {
                mouseDown = true;
            }
        }
    }
}

window.oncontextmenu = (e) => {
    e.preventDefault();
}

window.onmouseup = (e) => {
    mouseDown = false;
}

window.onkeydown = (e) => {
    keysDown[e.code] = true;
    if (e.code == "Escape") {
        tickFunction = menuTick;
    }
}

window.onkeyup = (e) => {
    keysDown[e.code] = false;
}

window.onwheel = (e) => {
    if (e.deltaY > 0) {
        editorToolIndex++;
    } else {
        editorToolIndex--;
    }
    if (editorToolIndex < 0) {
        editorToolIndex = editorTools.length - 1;
    }
    if (editorToolIndex >= editorTools.length) {
        editorToolIndex = 0;
    }
}

window.onmousemove = (e) => {
    editorHover = null;
    selectedEditorTool = null;
    menuSelectionIndex = null;
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (tickFunction == editorTick) {
        if (!editorGrid || !window.ctx) {
            return;
        }
        /*ctx.resetTransform();
        translateCamera();
        ctxTransform = ctx.getTransform();*/
        for (var x = 0; x < editorGrid.length; x++) {
            for (var y = 0; y < editorGrid[x].length; y++) {
                var tileRect = transformRectangle(x * 50 + grid.length * -25, y * 50 + grid[0].length * -25, 50, 50);
                if (mouseX > tileRect.x && mouseY > tileRect.y && mouseX < tileRect.x + tileRect.w && mouseY < tileRect.y + tileRect.h) {
                    editorHover = {
                        x: x,
                        y: y
                    };
                }
            }
        }
        ctx.resetTransform();
        for (var x in editorTools) {
            if (x != editorToolIndex) {
                ctx.globalAlpha = 0.5;
            } else {
                ctx.globalAlpha = 1;
            }
            var yPos = 75 + x * 65 - 25 - smoothedEditorToolIndex * 65;
            var rectLeft = 50;
            var rectTop = yPos;
            var rectRight = 100;
            var rectBottom = yPos + 50;
            if (mouseX > rectLeft && mouseY > rectTop && mouseX < rectRight && mouseY < rectBottom) {
                selectedEditorTool = x;
                editorHover = null;
            }
        }
    }
    if (tickFunction == menuTick) {
        var centerX = innerWidth / 2;
        var yTop = innerHeight / 2;
        yTop -= MENU_WIDTH / 2;
        yTop -= MENU_OPTION_HEIGHT * 4 * (menuOptions.length);
        for (var i in menuOptions) {
            var x = centerX;
            var y = yTop + MENU_WIDTH + ((i + 8) * MENU_OPTION_HEIGHT);
            //ctx.fillStyle = "white";
            //ctx.fillRect(x - MENU_WIDTH / 2,y-25,MENU_WIDTH,50);
            if (mouseX > x - MENU_WIDTH / 2 && mouseX < x + MENU_WIDTH / 2 && mouseY > y - 25 && mouseY < y + 25) {
                menuSelectionIndex = i;
            }
        }
    }
}

var updater = (d) => {
    while (d.type != "cellCorev1") {
        switch (d.type) {
            default:
                throw new Error("Invalid file type, cannot update!");
        }
    }
}

window.onload = () => {
    setInterval(tick, 0);
    var fileUploader = document.getElementById("fileUploader");
    fileUploader.onchange = (e) => {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = (o) => {
            var text = o.target.result;
            var data = JSON.parse(text);
            updater(data);
            console.log(data);
            if (data.grid) {
                grid = structuredClone(data.grid);
                editorGrid = structuredClone(data.grid);
            } else {
                alert("File import error!");
            }
        }
        reader.readAsText(file);
    }
    /*
    grid = [];
    for (var y = 0; y < 7; y++) {
        var row = [];
        for (var x = 0; x < 10; x++) {
            row.push(null);
        }
        grid.push(row);
    }
    grid[1][0] = {
        x : 0,
        y : 0,
        dir : 0,
        displayRotation: 0,
        type : 'blocker'
    }
    grid[0][5] = {
        x:0,
        y:0,
        dir:3,
        displayRotation:0,
        type:'pusher'
    };
    grid[0][1] = {
        x:0,
        y:0,
        dir:3,
        displayRotation:0,
        type:'rotater'
    };
    grid[6][1] = {
        x:0,
        y:0,
        dir:3,
        displayRotation:0,
        type:'rotater'
    };
    grid[2][6] = {
        x:0,
        y:0,
        dir:0,
        displayRotation:0,
        type:'pusher'
    };
    grid[0][8] = {
        x:0,
        y:0,
        dir:2,
        displayRotation:0,
        type:'rotater'
    };
    grid[1][8] = {
        x:0,
        y:0,
        dir:0,
        displayRotation:0,
        type:'generator'
    };
    grid[1][9] = {
        x:0,
        y:0,
        dir:1,
        displayRotation:0,
        type:'pusher'
    };
    editorGrid = structuredClone(grid);
    */
}

function menuTick() {
    menuOptions = [];
    menuOptions.push({
        text: "New Level",
        func: () => {
            editorGrid = [];
            for (var y = 0; y < 10; y++) {
                var row = [];
                for (var x = 0; x < 10; x++) {
                    row.push(null);
                }
                editorGrid.push(row);
            }
        }
    });
    if (grid) {
        menuOptions.push({
            text: "Play",
            func: () => {
                tickFunction = gameTick;
            }
        });
    }
    if (editorGrid) {
        menuOptions.push({
            text: "Editor",
            func: () => {
                tickFunction = editorTick;
            }
        });
    }
    menuOptions.push({
        text: "Import",
        func: () => {
            document.getElementById("fileUploader").click();
        }
    });
    if (editorGrid) {
        menuOptions.push({
            text: "Export",
            func: () => {
                var tempLink = document.createElement("a");
                var blob = new Blob([JSON.stringify({
                    type: "cellCorev1",
                    grid: editorGrid
                })], { type: 'text/cellcore' });

                tempLink.setAttribute('href', URL.createObjectURL(blob));
                tempLink.setAttribute('download', `My Level.clc`);
                tempLink.click();

                URL.revokeObjectURL(tempLink.href);
            }
        });
    }
    var menuLogo = "pusher"; // for users of development versions
    if (window.location.hostname != 'codelikecraze.github.io') {
        menuLogo = "rotater";
    }
    if (location.hostname.includes("localhost") || location.hostname.includes("127.")) {
        menuLogo = "generator";
    }
    var centerX = innerWidth / 2;
    var yTop = innerHeight / 2;
    yTop -= MENU_WIDTH / 2;
    yTop -= MENU_OPTION_HEIGHT * 4 * (menuOptions.length);
    ctx.drawImage(textureElements[menuLogo], centerX - MENU_WIDTH / 2, yTop, MENU_WIDTH, MENU_WIDTH);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var i in menuOptions) {
        if (i == menuSelectionIndex) {
            ctx.globalAlpha = 1;
        } else {
            ctx.globalAlpha = 0.5;
        }
        ctx.fillText(menuOptions[i].text, centerX, yTop + MENU_WIDTH + ((i + 8) * MENU_OPTION_HEIGHT));
    }
    ctx.globalAlpha = 1;
}

function tick() {
    window.canvas = document.getElementById('canvas');
    window.ctx = canvas.getContext('2d');

    var t = performance.now();

    if (!window.previousTime) {
        window.previousTime = t;
    }

    deltaTime = (t - window.previousTime) / 1000;

    if (deltaTime > 0.1) {
        deltaTime = 0.1;
    }

    window.previousTime = t;

    for (var x in textures) {
        if (!textureElements[x]) {
            var elm = document.createElement("img");
            elm.src = textures[x];
            textureElements[x] = elm;
        }
    }

    if (keysDown.ArrowUp || keysDown.KeyW) {
        targetCameraY -= deltaTime * 500;
    }
    if (keysDown.ArrowDown || keysDown.KeyS) {
        targetCameraY += deltaTime * 500;
    }
    if (keysDown.ArrowLeft || keysDown.KeyA) {
        targetCameraX -= deltaTime * 500;
    }
    if (keysDown.ArrowRight || keysDown.KeyD) {
        targetCameraX += deltaTime * 500;
    }
    if (keysDown.KeyQ) {
        targetCameraScale += deltaTime * 1;
    }
    if (keysDown.KeyE) {
        targetCameraScale -= deltaTime * 1;
    }

    cameraX = lerp(cameraX, targetCameraX, deltaTime * 5);
    cameraY = lerp(cameraY, targetCameraY, deltaTime * 5);
    cameraScale = lerp(cameraScale, targetCameraScale, deltaTime * 5);

    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = "25px 'Press Start 2P'";
    tickFunction();
    ctx.resetTransform();

    ctx.globalAlpha = 0.25;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    var versionText = "";
    if (window.location.hostname != 'codelikecraze.github.io') {
        versionText = "FORKED";
    }
    if (location.hostname.includes("localhost") || location.hostname.includes("127.")) {
        versionText = "DEVELOPMENT";
    }

    if (tickFunction != editorTick && tickFunction != menuTick) {
        versionText = "ESC FOR MENU";
        if (window.location.hostname != 'codelikecraze.github.io') {
            versionText = "FORK - ESC FOR MENU";
        }
        if (location.hostname.includes("localhost") || location.hostname.includes("127.")) {
            versionText = "DEV - ESC FOR MENU";
        }
    }

    ctx.fillStyle = "white";
    ctx.fillText(versionText, 25, 25);

    ctx.globalAlpha = 1;
}

function editorTick() {
    for (var x = 0; x < editorGrid.length; x++) {
        for (var y = 0; y < editorGrid[x].length; y++) {
            ctx.resetTransform();
            translateCamera();
            if ((x + y) % 2 == 0) {
                ctx.drawImage(textureElements["tileA"], x * 50 + editorGrid.length * -25, y * 50 + editorGrid[0].length * -25, 50, 50);
            } else {
                ctx.drawImage(textureElements["tileB"], x * 50 + editorGrid.length * -25, y * 50 + editorGrid[0].length * -25, 50, 50);
            }
        }
    }
    for (var x = 0; x < editorGrid.length; x++) {
        for (var y = 0; y < editorGrid[x].length; y++) {
            if (editorGrid[x][y]) {
                editorGrid[x][y].x = x;
                editorGrid[x][y].y = y;
                editorGrid[x][y].displayRotation = editorGrid[x][y].dir * 90;
                ctx.resetTransform();
                translateCamera();
                ctx.translate((editorGrid[x][y].x * 50) + 25 + editorGrid.length * -25, (editorGrid[x][y].y * 50) + 25 + editorGrid[0].length * -25);
                ctx.rotate(editorGrid[x][y].displayRotation * Math.PI / 180);
                ctx.drawImage(textureElements[editorGrid[x][y].type], -25, -25, 50, 50);
            }
        }
    }
    if (editorHover) {
        var alpha = lerp(0.2, 0.4, Math.abs(Math.sin(new Date().getTime() / 300)));
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.resetTransform();
        translateCamera();
        ctx.translate((editorHover.x * 50) + 25 + editorGrid.length * -25, (editorHover.y * 50) + 25 + editorGrid[0].length * -25);
        ctx.fillRect(-25, -25, 50, 50);
        if (mouseDown) {
            if (editorTools[editorToolIndex] == "menu") {
                tickFunction = menuTick;
            } else if (editorTools[editorToolIndex] == "eraser") {
                editorGrid[editorHover.x][editorHover.y] = null;
            } else {
                editorGrid[editorHover.x][editorHover.y] = {
                    x: 0,
                    y: 0,
                    dir: editorDir % 4,
                    displayRotation: 0,
                    type: editorTools[editorToolIndex]
                }
            }
        }
    }
    grid = structuredClone(editorGrid);
    smoothEditorDir = lerp(smoothEditorDir, editorDir, deltaTime * 15);
    smoothedEditorToolIndex = lerp(smoothedEditorToolIndex, editorToolIndex, deltaTime * 10);
    for (var x in editorTools) {
        if (x != editorToolIndex) {
            ctx.globalAlpha = 0.25;
        } else {
            ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = 1;
        //ctx.globalAlpha = Math.clamp(1 - Math.abs(smoothedEditorToolIndex - x) / 2, 0.25, 1);
        var scaleMultiplier = Math.clamp(1.3 - Math.abs(smoothedEditorToolIndex - x) / 4, 1, 1.3);
        ctx.resetTransform();
        ctx.translate(75, 75 - smoothedEditorToolIndex * 65 + x * 65);
        ctx.rotate(smoothEditorDir * Math.PI / 2);
        ctx.drawImage(textureElements[editorTools[x]], -25 * scaleMultiplier, -25 * scaleMultiplier, 50 * scaleMultiplier, 50 * scaleMultiplier);
    }
}

function gameTick() {
    gameTickTime -= deltaTime;
    if (gameTickTime < 0) {
        cellTick();
        gameTickTime = 0.3;
    }

    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[x].length; y++) {
            ctx.resetTransform();
            translateCamera();
            if ((x + y) % 2 == 0) {
                ctx.drawImage(textureElements["tileA"], x * 50 + grid.length * -25, y * 50 + grid[0].length * -25, 50, 50);
            } else {
                ctx.drawImage(textureElements["tileB"], x * 50 + grid.length * -25, y * 50 + grid[0].length * -25, 50, 50);
            }
        }
    }
    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[x].length; y++) {
            if (grid[x][y]) {
                grid[x][y].x = lerp(grid[x][y].x, x, deltaTime * 15);
                grid[x][y].y = lerp(grid[x][y].y, y, deltaTime * 15);
                grid[x][y].displayRotation = lerp(grid[x][y].displayRotation, grid[x][y].dir * 90, deltaTime * 15);
                ctx.resetTransform();
                translateCamera();
                ctx.translate((grid[x][y].x * 50) + 25 + grid.length * -25, (grid[x][y].y * 50) + 25 + grid[0].length * -25);
                ctx.rotate(grid[x][y].displayRotation * Math.PI / 180);
                ctx.drawImage(textureElements[grid[x][y].type], -25, -25, 50, 50);
            }
        }
    }
}

function calculateTranslatedPoint(x, y) {
    //return new DOMPoint(x, y).matrixTransform(ctxTransform);
    return {
        x: (x - cameraX) * cameraScale + innerWidth / 2,
        y: (y - cameraY) * cameraScale + innerHeight / 2
    }
}

function transformRectangle(x, y, w, h) {
    var topLeft = calculateTranslatedPoint(x, y);
    var bottomRight = calculateTranslatedPoint(x + w, y + h);
    return {
        x: topLeft.x,
        y: topLeft.y,
        w: bottomRight.x - topLeft.x,
        h: bottomRight.y - topLeft.y
    };
}

function translateCamera() {
    ctx.translate(innerWidth / 2, innerHeight / 2);
    ctx.scale(cameraScale, cameraScale);
    ctx.translate(-cameraX, -cameraY);
}

var cellTick = () => {
    var priorityPhases = ['rotater', 'alternaterotater', 'sucker', 'fan', 'drill', 'generater', 'mover'];
    for (var i in priorityPhases) {
        for (var x = 0; x < grid.length; x++) {
            for (var y = 0; y < grid[x].length; y++) {
                if (grid[x][y] && grid[x][y].type == priorityPhases[i]) {
                    tryUpdate(x, y);
                }
            }
        }
    }
    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[x].length; y++) {
            tryUpdate(x, y);
        }
    }
    c++;
}

function tryUpdate(x, y) {
    if (grid[x][y] && window[grid[x][y].type] && grid[x][y].c != c) {
        grid[x][y].c = c;
        grid[x][y].dir %= 4;
        window[grid[x][y].type](x, y);
    }
}

function drill(x, y) {
    var dir = grid[x][y].dir % 4;
    if (gridContains(x + directions[dir], x, y + directions[dir].y)) {
        grid[x + directions[dir].x][y + directions[dir].y] = grid[x][y];
        grid[x][y] = null;
    }
}

function blocker(x, y) {
    grid[x][y].immovableDirections = [0, 1, 2, 3];
    grid[x][y].dir = 0;
}

function pusher(x, y) {
    var dir = grid[x][y].dir % 4;
    while (dir < 0) {
        dir += 4;
    }
    if (push(dir, x, y)) {
        //grid[x+directions[dir].x][y+directions[dir].y].c = c;
    }
}

function sucker(x, y) {
    var dir = grid[x][y].dir % 4;
    if (!grid[x + directions[dir].x][y + directions[dir].y]) {
        var grabbedX = x + directions[dir].x;
        var grabbedY = y + directions[dir].y;
        var timeDown = 20;
        while (!grid[grabbedX][grabbedY]) {
            timeDown--;
            if (timeDown == 0) {
                return;
            }
            grabbedX += directions[dir].x;
            grabbedY += directions[dir].y;
        }
        push((dir + 2) % 4, grabbedX, grabbedY)
    }
}

function fan(x, y) {
    var dir = grid[x][y].dir % 4;
    if (!grid[x + directions[dir].x][y + directions[dir].y]) {
        var grabbedX = x + directions[dir].x;
        var grabbedY = y + directions[dir].y;
        var timeDown = 20;
        while (!grid[grabbedX][grabbedY]) {
            timeDown--;
            if (timeDown == 0) {
                return;
            }
            grabbedX += directions[dir].x;
            grabbedY += directions[dir].y;
        }
        push(dir, grabbedX, grabbedY)
    }
}

function generator(x, y) {
    var dir = grid[x][y].dir % 4;
    var gridIntitial = structuredClone(grid);
    if (gridContains(x + directions[dir].x, y + directions[dir].y)) {
        var width = grid.length;
        var height = grid[0].length;
        push(dir, x + directions[dir].x, y + directions[dir].y);
        if (!grid[x + directions[dir].x][y + directions[dir].y]) {
            grid[x + directions[dir].x][y + directions[dir].y] = structuredClone(grid[x - directions[dir].x][y - directions[dir].y]);
            grid[x + directions[dir].x][y + directions[dir].y].c = c;
        }
        if (width != grid.length) {
            throw new Error();
        }
        for (var x in grid) {
            if (grid[x].length != height) {
                throw new Error();
            }
        }
    }
}

function rotater(x, y) {
    if (!grid[x][y].nonStandardDir) {
        grid[x][y].nonStandardDir = 0;
    }
    grid[x][y].nonStandardDir++;
    grid[x][y].dir = grid[x][y].nonStandardDir;
    for (var i in directions) {
        if (gridContains(x + directions[i].x, y + directions[i].y)) {
            grid[x + directions[i].x][y + directions[i].y].dir++;
        }
    }
}

function alternaterotater(x, y) {
    if (!grid[x][y].nonStandardDir) {
        grid[x][y].nonStandardDir = 0;
    }
    grid[x][y].nonStandardDir--;
    grid[x][y].dir = grid[x][y].nonStandardDir;
    for (var i in directions) {
        if (gridContains(x + directions[i].x, y + directions[i].y)) {
            grid[x + directions[i].x][y + directions[i].y].dir--;
        }
    }
}


function push(d, x, y) {
    if (!grid[x][y]) {
        return;
    }
    var dir = d % 4;
    grid[x][y].immovableDirections = grid[x][y].immovableDirections || window[grid[x][y].type + "ImmovableDirections"];
    if ((grid[x][y] && grid[x][y].immovableDirections && grid[x][y].immovableDirections.includes(dir))) {
        return;
    }
    if (grid[x][y].lastTick != c) {
        grid[x][y].lastTick = c;
        grid[x][y].pushedDirections = [];
    }
    if (!grid[x][y].pushedDirections.includes(d)) {
        grid[x][y].pushedDirections.push(d);
    } else {
        return false;
    }
    var initialGrid = structuredClone(grid);
    var width = grid.length;
    var height = grid[0].length;
    if (!gridContains(x + directions[dir].x, y + directions[dir].y)) {
        return false;
    }
    if (grid[x][y].type == "trash") {
        grid[x - directions[dir].x][y - directions[dir].y] = null;
        console.log("exiting early");
        return false;
    }
    if (grid[x + directions[dir].x][y + directions[dir].y]) {
        push(dir, x + directions[dir].x, y + directions[dir].y);
    }
    if (!grid[x + directions[dir].x][y + directions[dir].y]) {
        grid[x + directions[dir].x][y + directions[dir].y] = grid[x][y];
        grid[x][y] = null;
    } else {
        return false;
    }
    if (grid[x + directions[dir].x][y + directions[dir].y] && grid[x + directions[dir].x][y + directions[dir].y].type == "pusher") {
        //grid[x + directions[dir].x][y + directions[dir].y].c = c;
    }
    return true;
}

function lerp(a, b, t) {
    return (a * (1 - Math.clamp(t, 0, 1))) + (b * Math.clamp(t, 0, 1));
}