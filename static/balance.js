const SCALE_LEFT_EDGE = 50;
const SCALE_WIDTH = 800;
const SCALE_RIGHT_EDGE = SCALE_LEFT_EDGE + SCALE_WIDTH;
const SCALE_Y = 500;
const WEIGHT_HEIGHT = 80;
const WEIGHT_WIDTH = 60;
const SCALE_HEIGHT = 40;
const FULCRUM_X = (SCALE_LEFT_EDGE + SCALE_RIGHT_EDGE) / 2;
const DEFAULT_Y = SCALE_Y - WEIGHT_HEIGHT

const UNKNOWN = 127;
const NEG_UNKNOWN = -127;

// initialize context
kaboom();

// load assets
loadSprite("pos_unknown", "/static/sprites/unknown.png");
loadSprite("neg_unknown", "/static/sprites/neg_unknown.png");
loadSprite("rectangle", "/static/sprites/rectangle2.png");
loadSprite("balloon", "/static/sprites/red_balloon.png");

let scaleStatus = 0;
let score = 0;

// const alertBox = document.createElement("div");
// document.body.appendChild(alertBox);
// alertBox.style.width = "500px";
// alertBox.style.height = "250px";
// alertBox.style.zIndex = 9999;
// alertBox.style.position = "absolute";
// alertBox.style.top = "0px";
// alertBox.style.left = "0px";

scene("game", () => {

    let leftSide = [];
    let rightSide = [];
    let solution = Math.floor(Math.random() * 13) - 6;
    let pointer = false;
    let objectsToAdd = [];
    let showScaleBox = false;

    // scale and fulcrum
    add([
        rect(SCALE_WIDTH, SCALE_HEIGHT),
        outline(4),
        pos(SCALE_LEFT_EDGE, SCALE_Y),
        origin("botleft"),
        area(),
        solid(),
        color(127, 200, 255),
    ]);

    let scaleBox = add([
        rect(SCALE_WIDTH, WEIGHT_HEIGHT + SCALE_HEIGHT + 10),
        pos(SCALE_LEFT_EDGE, SCALE_Y),
        origin("botleft"),
        //outline(4, RED),
        area(),
        solid(),
        opacity(0)
    ])

    // buttons
    let secondRowButtons = [];
    let buttonColors = [color(0, 255, 204), color(255, 102, 153), color(153, 153, 255)];
    let texts = ["DIVIDE\nBOTH SIDES", "REMOVE\nOBJECTS", "SIMPLIFY\n"]
    let buttonPos = [125, 325, 450];
    for (let i=0; i < 3; i++) {
        secondRowButtons.push(add([
            rect(160, 100),
            outline(2),
            pos(buttonPos[i], 125),
            origin(i == 2 ? "left" : "center"),
            area(),
            solid(),
            text(texts[i], {size: 24, transform: () => ({color: BLACK})}),
            buttonColors[i],
            "button"
        ]))
    }

    add([
        text("Add Object to\nBoth Sides:", {size: 24, transform: () => ({color: BLACK})}),
        pos(150, 50),
        origin("center"),
    ])

    let firstRowButtons = [];
    let buttonSprites = ["rectangle", "balloon", "pos_unknown", "neg_unknown"];
    texts = ["+", "-", "?", "-?"]
    buttonPos = [300, 375, 450, 525];

    for (let i=0; i < 4; i++) {
        let arr = [
            sprite(buttonSprites[i]),
            pos(buttonPos[i], 50),
            origin("center"),
            scale(i < 2 ? 0.75: 0.8),
            text(texts[i], {size: i < 2 ? 48 : 32}),
            solid(),
            area(),
            "button"
        ]
        if (i >= 2) {
            arr.push("unknown_button");
        }
        firstRowButtons.push(add(arr));
    }

    const [addWeightButton, addBalloonButton, addXButton, addNegXButton] = firstRowButtons;
    const [divideButton, removeButton, simplifyButton] = secondRowButtons;

    onHover("button", (c) => {
        pointer = true;
    })

    addXButton.onClick(() => {
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        const mouseY = mousePos().y;
        objectsToAdd = [
            createUnknown(true, SCALE_LEFT_EDGE + SCALE_WIDTH/4, mouseY, "left"),
            createUnknown(true, FULCRUM_X + SCALE_WIDTH/4, mouseY, "right")
        ];
    })

    addNegXButton.onClick(() => {
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        const mouseY = mousePos().y;
        objectsToAdd = [
            createUnknown(false, SCALE_LEFT_EDGE + SCALE_WIDTH/4, mouseY, "left"),
            createUnknown(false, FULCRUM_X + SCALE_WIDTH/4, mouseY, "right")
        ];
    })

    addWeightButton.onClick(() => {
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        const value = Number(prompt("Choose a value from 1 to 9"));
        if (isNaN(value) || value < 1 || value > 9) {
            alert("Invalid value!")
        }
        else {
            const mouseY = mousePos().y;
            objectsToAdd = [
                createWeight(value, SCALE_LEFT_EDGE + SCALE_WIDTH/4, mouseY, "left"),
                createWeight(value, FULCRUM_X + SCALE_WIDTH/4, mouseY, "right")
            ];
        }
    })

    addBalloonButton.onClick(() => {
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        const value = Number(prompt("Choose a value from -1 to -9"));
        if (isNaN(value) || value > -1 || value < -9) {
            alert("Invalid value!")
        }
        else {
            const mouseY = mousePos().y;
            objectsToAdd = [
                createWeight(value, SCALE_LEFT_EDGE + SCALE_WIDTH/4, mouseY, "left"),
                createWeight(value, FULCRUM_X + SCALE_WIDTH/4, mouseY, "right")
            ];
        }
    })

    onUpdate("weight", (obj) => {
        if (obj.newObj) {
            const mouse_pos = mousePos();
            obj.pos.y = mouse_pos.y;
            const posOnScale = Math.max(
                SCALE_LEFT_EDGE,
                Math.min(mouse_pos.x, SCALE_RIGHT_EDGE - WEIGHT_WIDTH))
            if (obj.newObj === 'left') {
                if (mouse_pos.y < 150) {
                    obj.pos.x = SCALE_LEFT_EDGE + SCALE_WIDTH/4
                }
                else if (posOnScale < FULCRUM_X) {
                    obj.pos.x = posOnScale;
                }
                else {
                    obj.pos.x = posOnScale - SCALE_WIDTH / 2;
                }
            }
            else {
                if (mouse_pos.y < 150) {
                    obj.pos.x = FULCRUM_X + SCALE_WIDTH/4;
                }
                else if (posOnScale > FULCRUM_X) {
                    obj.pos.x = posOnScale;
                }
                else {
                    obj.pos.x = posOnScale + SCALE_WIDTH / 2;
                }
            }
            if (obj.pos.y >= SCALE_Y - (WEIGHT_HEIGHT + SCALE_HEIGHT + 10) && obj.pos.y <= SCALE_Y) {
                showScaleBox = true;
                pointer = true;
            }
        }
    })

    scaleBox.onClick(() => {
        if (objectsToAdd) {
            let i = 0;
            while (leftSide[i] && leftSide[i].pos.x < objectsToAdd[0].pos.x) {
                i++;
            }
            leftSide.splice(i, 0, objectsToAdd[0]);
            console.log("Inserting on left side at index", i)
            console.log(leftSide.map(o => o.value))
            i = 0;
            while (rightSide[i] && rightSide[i].pos.x < objectsToAdd[1].pos.x) {
                i++;
            }
            rightSide.splice(i, 0, objectsToAdd[1]);
            console.log("Inserting on right side at index", i)
            console.log(rightSide.map(o => o.value))
            objectsToAdd[0].pos.y = DEFAULT_Y;
            objectsToAdd[0].newObj = false;
            objectsToAdd[1].pos.y = DEFAULT_Y;
            objectsToAdd[1].newObj = false;
            objectsToAdd = [];
        }
        rearrangeWeights();
    })

    onDraw(() => {
        // fulcrum
        drawTriangle({
            p1: vec2(FULCRUM_X, SCALE_Y),
            p2: vec2(FULCRUM_X - 30, SCALE_Y + 60),
            p3: vec2(FULCRUM_X + 30, SCALE_Y + 60),
            outline: {width: 2, color: BLACK},
            color: rgb(127, 200, 255),
        })

        // button click
        if (pointer) {
            cursor("pointer");
        }
        else {
            cursor("default");
        }
        pointer = false;

        if (showScaleBox) {
            scaleBox.outline = {"color": RED, "width": 4};
        }
        else {
            scaleBox.outline = null;
        }
        showScaleBox = false;
    });

    // WEIGHTS / UNKNOWNS

    function createUnknown(isPosUnknown, xPos=100, yPos=DEFAULT_Y, newObj=false) {
        let arr = [
            sprite(isPosUnknown ? "pos_unknown" : "neg_unknown"),
            pos(xPos, yPos),
            origin("center"),
            scale(1.0667),
            text(isPosUnknown ? "?" : "-?", {size: 32}),
            solid(),
            area(),
            "weight",
            "unknown",
            {
              value: isPosUnknown ? solution : -solution,
              isUnknown: true,
              newObj: newObj
            }
        ]
        return add(arr);
    }

    function createWeight(value, xPos=100, yPos=DEFAULT_Y, newObj=false) {
        let arr = [
            sprite(value >= 0 ? "rectangle" : "balloon"),
            pos(xPos, yPos),
            origin("center"),
            text(value, {size: 32}),
            solid(),
            area(),
            "weight",
            {
              value: value,
              isUnknown: false,
              newObj: newObj
            }
        ];
        return add(arr);
    }

    function rearrangeWeights() {
        let leftUnknowns = leftSide.filter(w => w.isUnknown);
        let leftWeights = leftSide.filter(w => !w.isUnknown);
        let rightUnknowns = rightSide.filter(w => w.isUnknown);
        let rightWeights = rightSide.filter(w => !w.isUnknown);
        let x_coord = SCALE_LEFT_EDGE + WEIGHT_WIDTH / 2;
        let leftSpacing = leftSide.length < 5 ? 20 : 5;
        let rightSpacing = rightSide.length < 5 ? 20 : 5;
        for (let u of leftUnknowns) {
            u.pos.x = x_coord;
            x_coord += (WEIGHT_WIDTH + leftSpacing);
        }
        x_coord += (leftSpacing * 2);
        for (let w of leftWeights) {
            w.pos.x = x_coord;
            x_coord += (WEIGHT_WIDTH + leftSpacing);
        }
        x_coord = SCALE_RIGHT_EDGE - WEIGHT_WIDTH / 2;
        for (let w of rightWeights.toReversed()) {
            w.pos.x = x_coord;
            x_coord -= (WEIGHT_WIDTH + rightSpacing);
        }
        x_coord -= (rightSpacing * 2);
        for (let u of rightUnknowns.toReversed()) {
            u.pos.x = x_coord;
            x_coord -= (WEIGHT_WIDTH + rightSpacing);
        }
    }

    // EQUATION LOGIC

    function randomInRange(minVal, maxVal) {
        return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    }

    function createWeightsForEquation(mainSide, otherSide, unknown, coeff, xOffset) {
        for (let i = 0; i < coeff + xOffset; i++) {
            mainSide.push(createUnknown(unknown > 0, 50 + i*50));
        }
        
        if (xOffset < 0) {
            for (let i=0; i > xOffset; i--) {
                otherSide.push(createUnknown(unknown < 0, 500 + i*50));
            }
        }
        else {
            for (let i=0; i < xOffset; i++) {
                otherSide.push(createUnknown(unknown > 0, 500 + i*50));
            }
        }
        const tmp = (unknown < 0) ? - solution*coeff : solution*coeff;
        let addend = 0;
        while (addend == 0 || tmp + addend == 0) {
            if (tmp >= 0) {
                addend = randomInRange(-9, 9 - tmp);
            }
            else {
                addend = randomInRange(-9 - tmp, 9);
            }
        }
        mainSide.push(createWeight(addend, 250));
        otherSide.push(createWeight(tmp + addend, 750));
    }

    function generateEquation(leftSide, rightSide) {

        const negXEnabled = true;
        const mainSideLeft = Math.random() >= 0.5; // true if main side is left, false if right
        const coeff = Math.ceil(Math.random() * (negXEnabled ? 3 : 2));  // coefficient of X, 1 thru 3

        // Are there X's on both sides?
        const xOnBothSides = negXEnabled ? Math.random() < 0.5 : Math.random() < 0.333;
        // Are we using mostly positive unknowns?
        const usePosUnknown = negXEnabled ? Math.random() < 0.5 : false;
  
        // x "offset": number of x's that need to be subtracted from both sides
        let xOffset = 0;
        if (xOnBothSides) {
            if (coeff === 3 && negXEnabled) {
                xOffset = - Math.ceil(Math.random() * 2);  // -1 or -2
            }
            else if (coeff === 2) {
                xOffset = (negXEnabled && Math.random() < 0.5) ? -1 : 1;
            }
            else if (coeff === 1) {
                xOffset = Math.ceil(Math.random() * 2); // 1 or 2
            }
        }

        createWeightsForEquation(
            mainSideLeft ? leftSide : rightSide, 
            mainSideLeft ? rightSide : leftSide, 
            usePosUnknown ? UNKNOWN : NEG_UNKNOWN, 
            coeff, 
            xOffset);
    }
    
    generateEquation(leftSide, rightSide);
    rearrangeWeights();

});

go("game");