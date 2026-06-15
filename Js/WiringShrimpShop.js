const svg = document.getElementById('circuit');
let elements = [];
let wires = [];
let draggingObj = null;
let tempWire = null;
let fromObj = null;
let offsetX = 0;
let offsetY = 0;
let difficulty = 1;


let initSet = [];
let setGoal = [];
let baseTime = 0
let Score = 0;
let counter = 0;

//const params = new URLSearchParams(window.location.search);
//difficulty = parseInt(params.get("difficulty"), 10);

switch (difficulty){
    case 0:
        initSet.push({type: "power", x: 100, y: 200});
        initSet.push({type: "power", x: 100, y: 400});
        initSet.push({type: "end", x: 500, y: 300});
        setGoal = [false, false, false, true];
        baseTime = 60;
        break;
    case 1:
        initSet.push({type: "power", x: 100, y: 200});
        initSet.push({type: "power", x: 100, y: 400});
        initSet.push({type: "end", x: 500, y: 300});
        setGoal = [false, true, true, true];
        baseTime = 120;
        break;
    case 2:
        initSet.push({type: "power", x: 100, y: 200});
        initSet.push({type: "power", x: 100, y: 400});
        initSet.push({type: "end", x: 500, y: 300});
        setGoal = [false, true, true, false];
        baseTime = 180;
        break;
    case 99:
        initSet.push({type: "power", x: 100, y: 200});
        initSet.push({type: "power", x: 100, y: 300});
        initSet.push({type: "power", x: 100, y: 400});
        initSet.push({type: "end", x: 500, y: 300});
        setGoal = [false, false, false, true, false, true, true, true];
        baseTime = 500;
        break;
}
// 初期配置
initSeting();
createAssignmentTable(initSet.length - 1, setGoal);
const startTime = Date.now();


function initSeting(){
    initSet.forEach(el => {
    switch (el.type){
        case "power":
            createPower(el.x, el.y);
        break;
        case "end":
            createEnd(el.x, el.y);
        break;
    }
});
}

// 各部品の生成
function createPower(x, y) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 20);
    circle.classList.add("power");
    circle.dataset.type = "power";
    svg.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y - 25);
    label.setAttribute("text-anchor", "middle");
    label.textContent = "電源";
    svg.appendChild(label);

    const output = createConnector(x, y, "output");
    const power = {el: circle, type: "power", x, y, output, label};
    
    elements.push(power);
}

function createNAND(x, y) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x - 30);
    rect.setAttribute("y", y - 20);
    rect.setAttribute("width", 60);
    rect.setAttribute("height", 40);
    rect.classList.add("nand");
    rect.dataset.type = "nand";
    svg.appendChild(rect);

    // 入力A
    const inputA = createConnector(x - 30, y - 10, "inputA");
    // 入力B
    const inputB = createConnector(x - 30, y + 10, "inputB");
    // 出力
    const output = createConnector(x + 30, y, "output");

    const nand = {el: rect, type: "nand", x, y, inputA, inputB, output};
    elements.push(nand);
}

function createEnd(x, y) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 20);
    circle.classList.add("end");
    circle.dataset.type = "end";
    svg.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y - 25);
    label.setAttribute("text-anchor", "middle");
    label.textContent = "海老屋サーバ";
    svg.appendChild(label);

    const input = createConnector(x, y, "input");
    const end = {el: circle, type: "end", x, y, input, label};

    elements.push(end);
}

function createWire(from, to) {
    if (wires.some(w => w.from === from && w.to === to)) return;
    if (from.role.startsWith("input") && to.role === "output") {
        [from, to] = [to, from];
    }
    if (from.role !== "output" || !to.role.startsWith("input")) return;
    
    if (from.type == "power" && to.type == "end") return;

    if (to.role === "input") {
        const alreadyConnected = wires.some(w => w.to === to);
        if (alreadyConnected) {
            alert("海老屋サーバには1本だけワイヤーを接続できます。");
            return;
        }
    }

    const fromPos = getConnectorPosition(from);
    const toPos = getConnectorPosition(to);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", fromPos.x);
    line.setAttribute("y1", fromPos.y);
    line.setAttribute("x2", toPos.x);
    line.setAttribute("y2", toPos.y);
    line.classList.add("wire");


    line.addEventListener("click", (e) => {
        e.stopPropagation();
        svg.removeChild(line);
        wires = wires.filter(w => w.el !== line);
    });

    svg.appendChild(line);
    wires.push({el: line, from, to, value: false});
}

function createConnector(x, y, role) {
    const connector = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    connector.setAttribute("cx", x);
    connector.setAttribute("cy", y);
    connector.setAttribute("r", 5);
    connector.classList.add("connector", role);
    connector.dataset.role = role;
    svg.appendChild(connector);
    return {el: connector, x, y, role};
}


// イベント処理
svg.addEventListener("mousedown", (e) => {
    e.preventDefault();

    fromObj = getAllConnectors().find(c => c.el === e.target);
    

    draggingObj = elements.find(el => el.el === e.target);
    if (draggingObj) {
        offsetX = e.offsetX - draggingObj.x;
        offsetY = e.offsetY - draggingObj.y;
    }

    if (fromObj) {
        const fromPos = getConnectorPosition(fromObj);
        tempWire = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tempWire.setAttribute("x1", fromPos.x);
        tempWire.setAttribute("y1", fromPos.y);
        tempWire.setAttribute("x2", fromPos.x);
        tempWire.setAttribute("y2", fromPos.y);
        tempWire.setAttribute("stroke", "gray");
        tempWire.setAttribute("stroke-width", "3");
        tempWire.setAttribute("stroke-opacity", "0.5");
        svg.appendChild(tempWire);
    }
});

svg.addEventListener("mousemove", (e) => {
    if (draggingObj) {
        const newX = e.offsetX - offsetX;
        const newY = e.offsetY - offsetY;
        const dx = newX - draggingObj.x;
        const dy = newY - draggingObj.y;

        draggingObj.x = newX;
        draggingObj.y = newY;

        if (draggingObj.type === "nand") {
            draggingObj.el.setAttribute("x", newX - 30);
            draggingObj.el.setAttribute("y", newY - 20);
        } else {
            draggingObj.el.setAttribute("cx", newX);
            draggingObj.el.setAttribute("cy", newY);
        }

        if (draggingObj.label) {
            draggingObj.label.setAttribute("x", draggingObj.x);
            draggingObj.label.setAttribute("y", draggingObj.y - 25);
        }

        getConnectors(draggingObj).forEach(conn => {
            conn.x += dx;
            conn.y += dy;
            conn.el.setAttribute("cx", conn.x);
            conn.el.setAttribute("cy", conn.y);
        });

        
        wires.forEach(wire => {
            const connectors = getConnectors(draggingObj);
            connectors.forEach(conn => {
                if (wire.from === conn) {
                    wire.el.setAttribute("x1", conn.x);
                    wire.el.setAttribute("y1", conn.y);
                }
                if (wire.to === conn) {
                    wire.el.setAttribute("x2", conn.x);
                    wire.el.setAttribute("y2", conn.y);
                }
            });
        });
    }
    if (tempWire) {
        tempWire.setAttribute("x2", e.offsetX);
        tempWire.setAttribute("y2", e.offsetY);
    }
});

svg.addEventListener("mouseup", (e) => {
    if (fromObj != null) {
        const toObj = getNearestConnector(e.offsetX, e.offsetY);
        if (toObj && fromObj !== toObj) createWire(fromObj, toObj);
        fromObj = null;
    } else if (draggingObj != null) {
        draggingObj = null;
    }
    if (tempWire) {
        svg.removeChild(tempWire);
        tempWire = null;
    }
});

function getNearestConnector(x, y, maxDist = 20) {
    let nearest = null;
    let minDist = maxDist;
    getAllConnectors().forEach(conn => {
        const dx = conn.x - x;
        const dy = conn.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist <= minDist) {
            nearest = conn;
            minDist = dist;
        }
    });
    return nearest;
}

function getConnectorPosition(conn) {
    return {
        x: parseFloat(conn.el.getAttribute("cx")),
        y: parseFloat(conn.el.getAttribute("cy"))
    };
}

function getAllConnectors() {
    return elements.flatMap(el => {
        if (el.type === "nand") return [el.inputA, el.inputB, el.output];
        if (el.type === "power") return [el.output];
        if (el.type === "end") return [el.input];
        return [];
    });
}

function getConnectors(obj) {
    if (obj.type === "nand") return [obj.inputA, obj.inputB, obj.output];
    if (obj.type === "power") return [obj.output];
    if (obj.type === "end") return [obj.input];
    return [];
}

function evaluateOnce(powerStates) {
    
    getAllConnectors().forEach(c => c.value = false);

    const powers = elements.filter(el => el.type === "power");
    powers.forEach((el, idx) => el.output.value = powerStates[idx]);

    let updated;
    let loopCount = 0;
    const MAX_LOOP = 1000;

    do {
        updated = false;

        
        wires.forEach(wire => {
            if (wire.from.role === "output") {
                const val = wire.from.value;
                if (wire.to.value !== val) {
                    wire.to.value = val;
                    updated = true;
                }
            }
        });

        
        elements.forEach(el => {
            if (el.type === "nand") {
                const a = el.inputA.value;
                const b = el.inputB.value;
                const out = !(a && b);
                if (el.output.value !== out) {
                    el.output.value = out;
                    updated = true;
                }
            }
        });

        loopCount++;
        if (loopCount > MAX_LOOP) {
            break;
        }
    } while (updated);

    return elements.some(el => el.type === "end" && el.input.value);
}

function evaluateWithPowerPattern() {
    const powers = elements.filter(e => e.type === "power");
    const n = powers.length;
    let results = [];
    let successList = [];

    for (const pattern of generatePatterns(n)) {
        const success = evaluateOnce(pattern);
        successList.push(success);
        results.push({pattern, success});
    }

    
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    const table = document.createElement("table");
    table.id = "result_table";
    table.style.borderCollapse = "collapse";

    const header = document.createElement("tr");
    for (let i = 0; i < n; i++) {
        const th = document.createElement("th");
        th.textContent = `P${i+1}`;
        th.style.border = "1px solid black";
        th.style.padding = "4px";
        header.appendChild(th);
    }
    const th = document.createElement("th");
    th.textContent = "結果";
    th.style.border = "1px solid black";
    th.style.padding = "4px";
    header.appendChild(th);
    table.appendChild(header);

    results.forEach(r => {
        const row = document.createElement("tr");
        r.pattern.forEach(p => {
            const td = document.createElement("td");
            td.textContent = p ? "1" : "0";
            td.style.border = "1px solid black";
            td.style.padding = "4px";
            row.appendChild(td);
        });
        const td = document.createElement("td");
        td.textContent = r.success ? "true" : "false";
        td.style.border = "1px solid black";
        td.style.padding = "4px";
        td.style.color = r.success ? "green" : "red";
        row.appendChild(td);
        table.appendChild(row);
    });

    resultDiv.appendChild(table);

    if (arraysEqual(successList, setGoal)){
        const endTime = (Date.now() - startTime) / 1000;
        Score = Math.ceil(baseTime / endTime * 100);
        alert("クリア！\n今回のスコアは" + Score + "\nゲームを終了します");
        window.location.href = "../../index.html";
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
}

svg.addEventListener("contextmenu", (e) => e.preventDefault());

document.getElementById("runButton").addEventListener("click", () => {
    showResult();
});



document.querySelector('.nand-box').addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'nand');
});

svg.addEventListener('dragover', e => e.preventDefault());

svg.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (type === 'nand') {
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createNAND(x, y);
    }
});

function createNANDBox() {
    const palette = document.getElementById('palette');
    const nandBox = document.querySelector('.nand-box');
    palette.appendChild(nandBox);

    nandBox.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'nand');
    });
}

document.getElementById("resetButton").addEventListener("click", () => {
    
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    elements = [];
    wires = [];

    initSeting();
});

function* generatePatterns(n) {
  for (let i = 0; i < (1 << n); i++) {
    const pattern = [];
    for (let j = 0; j < n; j++) {
      pattern.push(Boolean(i & (1 << j)));
    }
    yield pattern;
  }
}

function showResult() {
    evaluateWithPowerPattern();
    document.getElementById('result-model').style.display = 'block';
    document.getElementById('closeButton').style.display = 'inline-block';
}

function createAssignmentTable(n, goal){
    let table = document.getElementById("assignmentTable");
    table.style.borderCollapse = "collapse";
    const header = document.createElement("tr");
    for (let i = 0; i < n; i++) {
        const th = document.createElement("th");
        th.textContent = `P${i+1}`;
        th.style.border = "1px solid black";
        th.style.padding = "4px";
        header.appendChild(th);
    }
    const th = document.createElement("th");
    th.textContent = "結果";
    th.style.border = "1px solid black";
    th.style.padding = "4px";
    header.appendChild(th);
    table.appendChild(header);
    for (let i = 0; i < (1 << n); i++){
        const section = document.createElement("tr");
        for (let j = 0 ; j < n; j++){
            const el = document.createElement("td");
            el.textContent = `${i >> j & 1}`;
            el.style.border = "1px solid black";
            el.style.padding = "4px";
            section.appendChild(el);
        }
        const result = document.createElement("td");
        result.textContent = String(goal[i]);
        result.style.border = "1px solid black";
        result.style.padding = "4px";
        result.style.color = goal[i] ? "green" : "red";
        section.appendChild(result);
        table.appendChild(section);
    }
}

document.getElementById("showAssignment").addEventListener("click", () => {
    counter++;

    if (counter > 50){
        location.href = location.pathname + "?difficulty=99";
    }
});
