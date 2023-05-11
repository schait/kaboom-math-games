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

let score = 0;

const algebraBox = document.createElement("div");
document.body.appendChild(algebraBox);
algebraBox.classList.add("algebra")

scene("game", () => {

    let solution = Math.floor(Math.random() * 13) - 6;
    let leftSide = [];
    let rightSide = [];
    let objectsToAdd = [];
    let objectsToRemove = new Set();
    let objectsToCombine = new Set();
    let pointer = false;
    let showScaleBox = false;
    let removeMode = false;
    let combineMode = false;
    let balanced = 0; // 1 for right side heavier, -1 for left side heavier

    let algView = "";

    // scale
    let balanceScale = add([
        rect(SCALE_WIDTH, SCALE_HEIGHT),
        outline(4),
        pos(FULCRUM_X, SCALE_Y),
        origin("bot"),
        area(),
        solid(),
        color(127, 200, 255),
    ]);

    // box around scale (when adding weights)
    let scaleBox = add([
        rect(SCALE_WIDTH, WEIGHT_HEIGHT + SCALE_HEIGHT + 10),
        pos(SCALE_LEFT_EDGE, SCALE_Y),
        origin("botleft"),
        area(),
        solid(),
        opacity(0)
    ])

    function sumWeightsOnSide(side) {
        const values = side.map(o => o.value)
        return values.reduce((a, b) => a + b, 0)
    }

    function generateAlgExpression() {
        let leftCounts = [];
        let rightCounts = [];
        let [currentValue, currentCount] = [null, 0];
        let eqns = ["", ""]
        for (const signifier of ["left", "right"]) {
            const side = signifier === "left" ? leftSide : rightSide;
            let counts = signifier === "left" ? leftCounts : rightCounts;
            let i = signifier === "left" ? 0 : 1;
            for (const obj of side) {
                // count should only come into play for unknowns. 
                // Even if there are two 3's together, it should display as + 3 + 3
                if (obj.abstractValue === currentValue && 
                    (obj.abstractValue == UNKNOWN || obj.abstractValue == NEG_UNKNOWN)) 
                {
                    currentCount++;
                }
                else {
                    // new term
                    if (currentValue !== null) {
                        counts.push([currentValue, currentCount])
                    }
                    currentValue = obj.abstractValue;
                    currentCount = 1;
                }
            }
            if (currentValue !== null) {
                counts.push([currentValue, currentCount])
            }
            currentValue = null;
            currentCount = 0;
            for (const [value, count] of counts) {
                if (value === UNKNOWN) {
                    eqns[i] = eqns[i] + (count === 1 ? "+ x " : `+ ${count}x `);
                }
                else if (value === NEG_UNKNOWN) {
                    eqns[i] = eqns[i] + (count === 1 ? "- x " : `- ${count}x `);
                }
                else if (value < 0) {
                    eqns[i] = eqns[i] + `- ${-value} `;
                }
                else {
                    eqns[i] = eqns[i] + `+ ${value} `;
                }
                console.log(eqns[i]);
            }
            eqns[i] = eqns[i].trim();
            if (eqns[i].startsWith("+ ")) {
                eqns[i] = eqns[i].substring(2);  // remove leading "+" if there is one.
            }
        }
        return `${eqns[0]} = ${eqns[1]}`
    }

    /** WEIGHTS & UNKNOWNS */
    // newObj property is false by default
    // but "left" or "right" for objectsToAdd before they are added to scale

    function createUnknown(isPosUnknown, xPos=100, yPos=DEFAULT_Y, newObj=false) {
        let arr = [
            sprite(isPosUnknown ? "pos_unknown" : "neg_unknown"),
            pos(xPos, yPos),
            origin("center"),
            scale(1.0667),
            text(isPosUnknown ? "\n ?\n" : "\n -?\n", {size: 32}),
            solid(),
            area(),
            "weight",
            "unknown",
            {
              value: isPosUnknown ? solution : -solution,
              isUnknown: true,
              newObj: newObj,
              abstractValue: isPosUnknown ? UNKNOWN : NEG_UNKNOWN
            }
        ]
        return add(arr);
    }

    function createWeight(value, xPos=100, yPos=DEFAULT_Y, newObj=false) {
        let arr = [
            sprite(value >= 0 ? "rectangle" : "balloon"),
            pos(xPos, yPos),
            origin("center"),
            text(`\n ${value}\n`, {size: 32}),
            solid(),
            area(),
            "weight",
            "knownWeight",
            {
              value: value,
              isUnknown: false,
              newObj: newObj,
              abstractValue: value
            }
        ];
        return add(arr);
    }

    // Rearrange weights for more even spacing.
    function rearrangeWeights() {
        let leftUnknowns = leftSide.filter(w => w.isUnknown);
        let leftWeights = leftSide.filter(w => !w.isUnknown);
        let rightUnknowns = rightSide.filter(w => w.isUnknown);
        let rightWeights = rightSide.filter(w => !w.isUnknown);
        let leftSpacing = leftSide.length < 5 ? 20 : 5;
        let rightSpacing = rightSide.length < 5 ? 20 : 5;
        let x_coord = SCALE_LEFT_EDGE + WEIGHT_WIDTH / 2;

        // Arrange objects on left side, unknowns first
        for (let u of leftUnknowns) {
            u.pos.x = x_coord;
            x_coord += (WEIGHT_WIDTH + leftSpacing);
        }
        x_coord += (leftSpacing * 2);
        for (let w of leftWeights) {
            w.pos.x = x_coord;
            x_coord += (WEIGHT_WIDTH + leftSpacing);
        }

        // Arrange objects on right side
        // Start from the edge, known weights first, and work toward the center
        // Because we're going right to left we need to reverse the lists
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
        algView = algView + generateAlgExpression() + "<br>";
        algebraBox.innerHTML = algView;
    }

    /** BUTTONS */

    // Second row buttons: Divide, Remove, Combine
    let secondRowButtons = [];
    let buttonColors = [color(255, 87, 51), color(255, 102, 153), color(153, 153, 255), color(0, 255, 204)];
    let texts = ["DIVIDE\nBOTH SIDES", "REMOVE\nOBJECTS", "COMBINE\nOBJECTS", "ENTER\nSOLUTION"]
    let buttonPos = [125, 325, 450, 675];
    for (let i=0; i < 4; i++) {
        secondRowButtons.push(add([
            rect(160, 100),
            outline(2),
            pos(buttonPos[i], i == 3 ? 75 : 125),
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

    // Buttons to add objects
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
    const [divideButton, removeButton, combineButton, solveButton] = secondRowButtons;

    // Confirm Remove text and button (initially hidden)
    let confirmRemoveText = add([
        text("Select weights to remove, then click OK.", {size: 24, transform: () => ({color: BLACK})}),
        pos(50, 225),
        origin("left"),
        opacity(0)
    ]);

    let confirmRemoveButton = add([
        rect(160, 100),
        pos(650, 223),
        origin("left"),
        area(),
        solid(),
        text("  OK  ", {size: 24, transform: () => ({color: BLACK})}),
        opacity(0),
        "confirmRemoveButton"
    ]);

    // Confirm Combine text and button (initially hidden)

    let confirmCombineText = add([
        text(
            "Select weights to combine, then click OK.\nAll weights must be on one side. Cannot combine unknowns.", 
            {size: 24, transform: () => ({color: BLACK})}),
        pos(50, 225),
        origin("left"),
        opacity(0)
    ]);

    let confirmCombineButton = add([
        rect(160, 100),
        pos(655, 213),
        origin("left"),
        area(),
        solid(),
        text("  OK  ", {size: 24, transform: () => ({color: BLACK})}),
        opacity(0),
        "confirmCombineButton"
    ]);

    /** HOVER HANDLING */

    onHover("button", (c) => {
        pointer = true;
    })

    onHover("weight", (c) => {
        if (removeMode || combineMode) {
            pointer = true;  // in remove mode, clicking a weight marks it for removal
        }
    })

    onHover("confirmRemoveButton", (c) => {
        if (removeMode) {
            pointer = true;  // button is only visible in remove mode
        }
    })

    onHover("confirmCombineButton", (c) => {
        if (combineMode) {
            pointer = true;  // button is only visible in combine mode
        }
    })

    /**  REMOVE OBJECTS HANDLING  */ 

    removeButton.onClick(() => {
        // Activate Remove Mode
        removeMode = !removeMode;
        combineMode = false;
        // Show Confirm Remove text and button
        confirmRemoveText.opacity = 1 - confirmRemoveText.opacity;
        confirmRemoveButton.opacity = 1 - confirmRemoveButton.opacity;
        confirmRemoveButton.outline = removeMode ? {"color": BLACK, "width": 2} : null;

        // Destroy any objects to add
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        objectsToAdd = [];
    })

    confirmRemoveButton.onClick(() => {
        // Confirm Remove button is only visible in remove mode, so do nothing if removeMode == false
        if (removeMode) {
            // Copy left side and right side, in case scale becomes unbalanced and we have to reset 
            let leftCopy = [...leftSide];
            let rightCopy = [...rightSide];
            for (const obj of objectsToRemove) {
                // If obj is on left side, remove it from left copy
                let lIndex = leftCopy.indexOf(obj);
                if (lIndex > -1) {
                    leftCopy.splice(lIndex, 1);
                }
                else {
                    // If obj is on right side, remove it from right copy
                    let rIndex = rightCopy.indexOf(obj);
                    if (rIndex > -1) {
                        rightCopy.splice(rIndex, 1);
                    }
                }
            }

            let sumLeft = sumWeightsOnSide(leftCopy);
            let sumRight = sumWeightsOnSide(rightCopy);
            if (sumLeft === sumRight) {
                // balanced, so destroy the objectsToRemove and set each side to the copy with weights removed
                for (const obj of objectsToRemove) {
                    destroy(obj);
                }
                leftSide = leftCopy;
                rightSide = rightCopy;
                rearrangeWeights();
            }
            else if (sumRight > sumLeft) {
                balanced = 1;
            }
            else {
                balanced = -1;
            }
            removeMode = false;
        }
    })

    onClick("weight", (w) => {
        // In Remove Mode, clicking a weight should add it to objectsToRemove
        // (or if it's there already, remove it)
        if (removeMode) {
            if (objectsToRemove.has(w)) {
                objectsToRemove.delete(w);
            }
            else {
                objectsToRemove.add(w);
            }
            console.log(objectsToRemove);
        }
        else if (combineMode) {
            if (objectsToCombine.has(w)) {
                objectsToCombine.delete(w);
            }
            else {
                objectsToCombine.add(w);
            }
            console.log(objectsToCombine);
        }
    })

    /** COMBINE OBJECTS HANDLING */

    combineButton.onClick(() => {
        // Activate Combine Mode
        combineMode = !combineMode;
        removeMode = false;
        // Show Confirm Combine text and button
        confirmCombineText.opacity = 1 - confirmCombineText.opacity;
        confirmCombineButton.opacity = 1 - confirmCombineButton.opacity;
        confirmCombineButton.outline = combineMode ? {"color": BLACK, "width": 2} : null;

        // Destroy any objects to add
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        objectsToAdd = [];
    })

    confirmCombineButton.onClick(() => {
        // Confirm Combine button is only visible in combine mode, so do nothing if combineMode == false
        if (combineMode) {
            // Copy left side and right side, in case scale becomes unbalanced and we have to reset 
            let leftCopy = [...leftSide];
            let rightCopy = [...rightSide];
            let allOnLeft = true;
            let allOnRight = true;
            let totalValue = 0;

            for (const obj of objectsToCombine) {
                if (obj.isUnknown) {
                    alert("Cannot combine unknowns!");
                    combineMode = false;
                    return
                }
                let lIndex = leftCopy.indexOf(obj);
                if (lIndex > -1) {
                    allOnRight = false;
                    leftCopy.splice(lIndex, 1);
                }
                else {
                    let rIndex = rightCopy.indexOf(obj);
                    if (rIndex > -1) {
                        allOnLeft = false;
                        rightCopy.splice(rIndex, 1);
                    }
                }
                totalValue += obj.value;
                console.log("Obj value is", obj.value);
                console.log("Total value is", totalValue);
            }
            if (allOnLeft) {
                leftSide = leftCopy;
                for (const obj of objectsToCombine) {
                    destroy(obj);
                }
                if (totalValue != 0) {
                    leftSide.push(createWeight(totalValue))
                }
                rearrangeWeights();
            }
            else if (allOnRight) {
                rightSide = rightCopy;
                for (const obj of objectsToCombine) {
                    destroy(obj);
                }
                if (totalValue != 0) {
                    rightSide.push(createWeight(totalValue))
                }
                rearrangeWeights();
            }
            else {
                alert("Cannot combine. Weights must all be on one side.")
            }
            combineMode = false;
        }
    })

    /** ADD OBJECTS HANDLING */

    addXButton.onClick(() => {
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        removeMode = false;
        combineMode = false;
        const mouseY = mousePos().y;
        // Add two objectsToAdd that will follow the mouse pointer
        // Set "newObj" property to "left" and "right"
        objectsToAdd = [
            createUnknown(true, SCALE_LEFT_EDGE + SCALE_WIDTH/4, mouseY, "left"),
            createUnknown(true, FULCRUM_X + SCALE_WIDTH/4, mouseY, "right")
        ];
        
    })

    addNegXButton.onClick(() => {
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        removeMode = false;
        combineMode = false;
        const mouseY = mousePos().y;
        // Add two objectsToAdd that will follow the mouse pointer
        // Set "newObj" property to "left" and "right"
        objectsToAdd = [
            createUnknown(false, SCALE_LEFT_EDGE + SCALE_WIDTH/4, mouseY, "left"),
            createUnknown(false, FULCRUM_X + SCALE_WIDTH/4, mouseY, "right")
        ];
    })

    addWeightButton.onClick(() => {
        for (const obj of objectsToAdd) {
            destroy(obj);
        }
        removeMode = false;
        combineMode = false;
        const value = Number(prompt("Choose a value from 1 to 9"));
        if (isNaN(value) || value < 1 || value > 9) {
            alert("Invalid value!")
        }
        else {
            const mouseY = mousePos().y;
            // Add two objectsToAdd that will follow the mouse pointer
            // Set "newObj" property to "left" and "right"
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
        removeMode = false;
        combineMode = false;
        const value = Number(prompt("Choose a value from -1 to -9"));
        if (isNaN(value) || value > -1 || value < -9) {
            alert("Invalid value!")
        }
        else {
            const mouseY = mousePos().y;
            // Add two objectsToAdd that will follow the mouse pointer
            // Set "newObj" property to "left" and "right"
            objectsToAdd = [
                createWeight(value, SCALE_LEFT_EDGE + SCALE_WIDTH/4, mouseY, "left"),
                createWeight(value, FULCRUM_X + SCALE_WIDTH/4, mouseY, "right")
            ];
        }
    })

    onUpdate("weight", (obj) => {
        // If "newObj" property is false (default), weights are fixed on the scale.
        // If it is "left" or "right", update weight position to follow the mouse pointer.
        if (obj.newObj) {
            const mouse_pos = mousePos();
            obj.pos.y = mouse_pos.y;

            // Get mouse x position (but if mouse x is outside scale, use edge of scale)
            const posOnScale = Math.max(
                SCALE_LEFT_EDGE,
                Math.min(mouse_pos.x, SCALE_RIGHT_EDGE - WEIGHT_WIDTH))

            if (obj.newObj === 'left') {
                if (mouse_pos.y < 150) {
                    // don't follow the pointer if y < 150 so that buttons don't get covered up
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
                    // don't follow the pointer if y < 150 so that buttons don't get covered up
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
                // mouse is over the scale, so show scale box and enable clicking it to add the weights
                showScaleBox = true;
                pointer = true;
            }
        }
    })

    // If objectsToAdd is not empty, clicking the scale box adds weights to the scale.
    scaleBox.onClick(() => {
        if (objectsToAdd.length > 0) {
            // Insert the new left weight in the leftSide list, at index based on its x position
            let i = 0;
            while (leftSide[i] && leftSide[i].pos.x < objectsToAdd[0].pos.x) {
                i++;
            }
            leftSide.splice(i, 0, objectsToAdd[0]);
            console.log("Inserting on left side at index", i);
            console.log(leftSide.map(o => o.value))

            // Insert the new left weight in the leftSide list, at index based on its x position
            i = 0;
            while (rightSide[i] && rightSide[i].pos.x < objectsToAdd[1].pos.x) {
                i++;
            }
            rightSide.splice(i, 0, objectsToAdd[1]);
            console.log("Inserting on right side at index", i);
            console.log(rightSide.map(o => o.value));

            // Set y value and set newObj = false to fix weights on scale
            objectsToAdd[0].pos.y = DEFAULT_Y;
            objectsToAdd[0].newObj = false;
            objectsToAdd[1].pos.y = DEFAULT_Y;
            objectsToAdd[1].newObj = false;
            objectsToAdd = [];

            rearrangeWeights();  // space out weights more evenly
        }
    })

    /** DIVIDE BOTH SIDES */

    divideButton.onClick(() => {
        removeMode = false;
        combineMode = false;
        for (const obj of objectsToAdd) {
            destroy(obj);
        }

        const quotient = Number(prompt("Choose a value from 1 to 6"));
        if (isNaN(quotient) || quotient < 1 || quotient > 6) {
            alert("Invalid value!")
            return
        }
        let newLeftSide = [];
        let toDestroy = [];
        let newRightSide = [];
        let leftWeights = leftSide.filter(w => !w.isUnknown);
        let rightWeights = rightSide.filter(w => !w.isUnknown);

        for (const signifier of ["left", "right"]) {
            const side = signifier === "left" ? leftSide : rightSide;
            let posUnknowns = side.filter(w => w.isUnknown && w.value == solution);
            let negUnknowns = side.filter(w => w.isUnknown && w.value == -solution);
            let weights = signifier === "left" ? leftWeights : rightWeights;

            // Make sure everything is divisible by the quotient
            if (posUnknowns.length % quotient !== 0) {
                alert(`Cannot divide ${len(posUnknowns)} black unknowns on ${signifier} side by ${quotient}.`);
                return;
            }
            if (negUnknowns.length % quotient !== 0) {
                alert(`Cannot divide ${len(posUnknowns)} white unknowns on ${signifier} side by ${quotient}.`);
                return;
            }
            for (const wt of weights) {
                if (wt.value % quotient !== 0) {
                    alert(`Cannot divide ${wt.value} on ${signifier} side by ${quotient}.`);
                    return;
                }
            }

            // Put together the new leftSide/rightSide and also a list of weights to destroy
            let newSide = signifier === "left" ? newLeftSide : newRightSide;
            for (let i = 0; i < posUnknowns.length; i++) {
                if (i % quotient === 0) {
                    newSide.push(posUnknowns[i]);
                }
                else {
                    toDestroy.push(posUnknowns[i]);
                }
            }
            for (let i = 0; i < negUnknowns.length; i++) {
                if (i % quotient === 0) {
                    newSide.push(negUnknowns[i]);
                }
                else {
                    toDestroy.push(negUnknowns[i]);
                }
            }
        }
        // Everything is divisible, so actually destroy the objects and do the division
        for (const wt of leftWeights) {
            toDestroy.push(wt);
            newLeftSide.push(createWeight(wt.value / quotient, wt.pos.x, wt.pos.y))
        }
        for (const wt of rightWeights) {
            toDestroy.push(wt);
            newRightSide.push(createWeight(wt.value / quotient, wt.pos.x, wt.pos.y))
        }
        console.log("Ready to divide!");
        console.log(newLeftSide.map(o => o.value));
        console.log(newRightSide.map(o => o.value))
        
        leftSide = newLeftSide;
        rightSide = newRightSide;
        for (const wt of toDestroy) {
            destroy(wt);
        }
        rearrangeWeights();
    })

    /** SOLUTION */

    solveButton.onClick(() => {
        const answer = prompt("Enter the value of the BLACK unknown, x.\n" +
                        "(If you have a value for the white unknown,\n enter that value with the sign flipped.)")
        if (answer === "") {
            return
        }
        else if (Number(answer) === solution) {
            alert("Correct!");
            score += 100;
            go("game");
        }
        else {
            alert("Incorrect!");
            score -= 50;
            console.log(score);
        }
    })

    onUpdate(() => {
        if (balanceScale.angle) {
            score -= 50;
            console.log(score);
            alert("Scale is no longer balanced!\n" + 
                "You can only remove objects from one side of the scale if their weights total 0,\n" +
                "or if you remove an equal amount of weight from the other side.\n" +
                "Please try again!")
            for (const obj of objectsToRemove) {
                obj.opacity = 1;  // show objects to remove again
            }
            // reset scale and objectsToRemove
            balanced = 0;
            balanceScale.angle = 0;
            objectsToRemove.clear();
        }
        else if (balanced != 0) {
            balanceScale.angle = balanced > 0 ? 15 : -15;
            for (const obj of objectsToRemove) {
                obj.opacity = 0;  // temporarily hide objects to remove
            }
        }
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

        // score
        drawText({
            text: "Score: " + score,
            size: 32,
            color: BLACK,
            pos: vec2(FULCRUM_X + 200, SCALE_Y + 60),
            origin: "left"
          })

        // button click
        if (pointer) {
            cursor("pointer");
        }
        else {
            cursor("default");
        }
        pointer = false;

        // scale box
        if (showScaleBox) {
            scaleBox.outline = {"color": RED, "width": 4};
        }
        else {
            scaleBox.outline = null;
        }
        showScaleBox = false;

        if (!removeMode) {
            // disable/hide remove mode buttons and text
            if (balanced === 0) {
                // only clear these if balanced (if not, we need to put them back)
                objectsToRemove.clear();
            }
            confirmRemoveText.opacity = 0;
            confirmRemoveButton.opacity = 0;
            confirmRemoveButton.outline = null;
        }
        if (!combineMode) {
            // disable/hide combine mode buttons and text
            objectsToCombine.clear();
            confirmCombineText.opacity = 0;
            confirmCombineButton.opacity = 0;
            confirmCombineButton.outline = null;
        }

        // pink X to indicate all weights to remove
        for (let w of objectsToRemove) {
            drawLine({
                p1: vec2(w.pos.x - WEIGHT_WIDTH/2, w.pos.y - WEIGHT_HEIGHT/2),
                p2: vec2(w.pos.x + WEIGHT_WIDTH/2, w.pos.y + WEIGHT_HEIGHT/2),
                width: 5,
                color: rgb(255, 0, 255),
            })
            drawLine({
                p1: vec2(w.pos.x + WEIGHT_WIDTH/2, w.pos.y - WEIGHT_HEIGHT/2),
                p2: vec2(w.pos.x - WEIGHT_WIDTH/2, w.pos.y + WEIGHT_HEIGHT/2),
                width: 5,
                color: rgb(255, 0, 255),
            })
        }

        // blue check to indicate all weights to remove
        for (let w of objectsToCombine) {
            drawLine({
                p1: vec2(w.pos.x + WEIGHT_WIDTH/2, w.pos.y - WEIGHT_HEIGHT/2),
                p2: vec2(w.pos.x, w.pos.y + WEIGHT_HEIGHT/2),
                width: 5,
                color: rgb(80, 160, 255),
            })
            drawLine({
                p1: vec2(w.pos.x - WEIGHT_WIDTH/2, w.pos.y),
                p2: vec2(w.pos.x, w.pos.y + WEIGHT_HEIGHT/2),
                width: 5,
                color: rgb(80, 160, 255),
            })
        }
    });

    /** EQUATION LOGIC */ 

    function randomInRange(minVal, maxVal) {
        return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    }

    // Create weights for the equation and add them to leftSide and rightSide lists
    function createWeightsForEquation(mainSide, otherSide, unknown, coeff, xOffset) {
        // unknowns on main side
        for (let i = 0; i < coeff + xOffset; i++) {
            mainSide.push(createUnknown(unknown > 0, 50 + i*50));
        }
        
        // unknowns on other side
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

        // Generate a pair of addends (one on each side) 
        // that will make the equation true given the solution.
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

    // Generate a randomized algebra equation
    // leftSide and rightSide lists are modified
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