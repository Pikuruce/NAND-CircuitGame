const svg = document.getElementById('circuit');

class GameMap {
    constructor(svg) {
        this.svg = svg;
        this.elements = [];
        this.wires = [];
        this.draggingObj = null;
        this.tempWire = null;
        this.fromObj = null;
        this.offsetX = 0;
        this.offsetY = 0;

        this.difficulty = 0;


        this.initSet = [];
        this.setGoal = [];
        this.baseTime = 0
        this.Score = 0;
        this.counter = 0;

        const params = new URLSearchParams(window.location.search);
        this.difficulty = parseInt(params.get("difficulty"), 10);

        switch (this.difficulty){
            case 0:
                this.initSet.push({type: "power", x: 100, y: 200});
                this.initSet.push({type: "power", x: 100, y: 400});
                this.initSet.push({type: "end", x: 500, y: 300});
                this.setGoal = [false, false, false, true];
                this.baseTime = 60;
            break;
            case 1:
                this.initSet.push({type: "power", x: 100, y: 200});
                this.initSet.push({type: "power", x: 100, y: 400});
                this.initSet.push({type: "end", x: 500, y: 300});
                this.setGoal = [false, true, true, true];
                this.baseTime = 120;
            break;
            case 2:
                this.initSet.push({type: "power", x: 100, y: 200});
                this.initSet.push({type: "power", x: 100, y: 400});
                this.initSet.push({type: "end", x: 500, y: 300});
                this.setGoal = [false, true, true, false];
                this.baseTime = 180;
            break;
            case 99:
                this.initSet.push({type: "power", x: 100, y: 200});
                this.initSet.push({type: "power", x: 100, y: 300});
                this.initSet.push({type: "power", x: 100, y: 400});
                this.initSet.push({type: "end", x: 500, y: 300});
                this.setGoal = [false, false, false, true, false, true, true, true];
                this.baseTime = 500;
            break;
        }
        this.initSet.forEach(el => {
            switch (el.type){
                case "power":
                    this.elements.push(new this.#Power(el.x, el.y));
                break;
                case "end":
                    this.elements.push(new this.#End(el.x, el.y));
                break;
            }
        });

        this.createAssignmentTable(this.initSet.length - 1, this.setGoal);
        this.startTime = Date.now();

        // イベント処理
        this.svg.addEventListener("mousedown", (e) => {
            e.preventDefault();

            this.fromObj = this.getAllConnectors().find(c => c.info.el === e.target);
            

            this.draggingObj = this.elements.find(el => el.info.el === e.target);
            if (this.draggingObj) {
                this.offsetX = e.offsetX - this.draggingObj.info.x;
                this.offsetY = e.offsetY - this.draggingObj.info.y;
            }

            if (this.fromObj) {
                const fromPos = this.getConnectorPosition(this.fromObj);
                this.tempWire = document.createElementNS("http://www.w3.org/2000/svg", "line");
                this.tempWire.setAttribute("x1", fromPos.x);
                this.tempWire.setAttribute("y1", fromPos.y);
                this.tempWire.setAttribute("x2", fromPos.x);
                this.tempWire.setAttribute("y2", fromPos.y);
                this.tempWire.setAttribute("stroke", "gray");
                this.tempWire.setAttribute("stroke-width", "3");
                this.tempWire.setAttribute("stroke-opacity", "0.5");
                this.svg.appendChild(this.tempWire);
            }
        });

        this.svg.addEventListener("mousemove", (e) => {
            if (this.draggingObj) {
                const newX = e.offsetX - this.offsetX;
                const newY = e.offsetY - this.offsetY;
                const dx = newX - this.draggingObj.info.x;
                const dy = newY - this.draggingObj.info.y;

                this.draggingObj.info.x = newX;
                this.draggingObj.info.y = newY;

                if (this.draggingObj.info.type === "nand") {
                    this.draggingObj.info.el.setAttribute("x", newX - 30);
                    this.draggingObj.info.el.setAttribute("y", newY - 20);
                } else {
                    this.draggingObj.info.el.setAttribute("cx", newX);
                    this.draggingObj.info.el.setAttribute("cy", newY);
                }

                if (this.draggingObj.info.label) {
                    this.draggingObj.info.label.setAttribute("x", this.draggingObj.info.x);
                    this.draggingObj.info.label.setAttribute("y", this.draggingObj.info.y - 25);
                }

                this.getConnectors(this.draggingObj).forEach(conn => {
                    conn.info.x += dx;
                    conn.info.y += dy;
                    conn.info.el.setAttribute("cx", conn.info.x);
                    conn.info.el.setAttribute("cy", conn.info.y);
                });

                
                this.wires.forEach(wire => {
                    const connectors = this.getConnectors(this.draggingObj);
                    connectors.forEach(conn => {
                        if (wire.info.from === conn) {
                            wire.info.el.setAttribute("x1", conn.info.x);
                            wire.info.el.setAttribute("y1", conn.info.y);
                        }
                        if (wire.info.to === conn) {
                            wire.info.el.setAttribute("x2", conn.info.x);
                            wire.info.el.setAttribute("y2", conn.info.y);
                        }
                    });
                });
            }
            if (this.tempWire) {
                this.tempWire.setAttribute("x2", e.offsetX);
                this.tempWire.setAttribute("y2", e.offsetY);
            }
        });

        this.svg.addEventListener("mouseup", (e) => {
            if (this.fromObj != null) {
                const toObj = this.getNearestConnector(e.offsetX, e.offsetY);
                if (toObj && this.fromObj !== toObj) this.wires.push(new this.#Wire(this.fromObj, toObj, this));
                this.fromObj = null;
            } else if (this.draggingObj != null) {
                this.draggingObj = null;
            }
            if (this.tempWire) {
                this.svg.removeChild(this.tempWire);
                this.tempWire = null;
            }
        });

        this.svg.addEventListener("contextmenu", (e) => e.preventDefault());

        this.svg.addEventListener('dragover', e => e.preventDefault());

        this.svg.addEventListener('drop', e => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            if (type === 'nand') {
                const rect = svg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.elements.push(new this.#NAND(x, y));
            }
        });
    }

    #Wire = class {
        constructor(from, to, game) {
            if (game.wires.some(w => w.info.from === from && w.info.to === to)) return;
            if (from.info.role.startsWith("input") && to.info.role === "output") {
                [from, to] = [to, from];
            }
            if (from.info.role !== "output" || !to.info.role.startsWith("input")) return;
            
            if (from.info.type == "power" && to.info.type == "end") return;

            if (to.info.role === "input") {
                const alreadyConnected = game.wires.some(w => w.info.to === to);
                if (alreadyConnected) {
                    alert("海老屋サーバには1本だけワイヤーを接続できます。");
                    return;
                }
            }

            const fromPos = game.getConnectorPosition(from);
            const toPos = game.getConnectorPosition(to);

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", fromPos.x);
            line.setAttribute("y1", fromPos.y);
            line.setAttribute("x2", toPos.x);
            line.setAttribute("y2", toPos.y);
            line.classList.add("wire");

            line.addEventListener("click", (e) => {
                e.stopPropagation();
                svg.removeChild(line);
                game.wires = game.wires.filter(w => w.info.el !== line);
            });

            svg.appendChild(line);
            this.info = {el: line, from, to, value: false};
        }
    }

    #Power = class {
        constructor(x, y) {
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

            const output = new GameMap.Connector(x, y, "output");
            this.info = {el: circle, type: "power", x, y, output, label};
        }
    }

    #End = class {
        constructor(x, y) {
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

            const input = new GameMap.Connector(x, y, "input");
            this.info = {el: circle, type: "end", x, y, input, label};
        }
    }

    #NAND = class {
        constructor(x, y) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x - 30);
            rect.setAttribute("y", y - 20);
            rect.setAttribute("width", 60);
            rect.setAttribute("height", 40);
            rect.classList.add("nand");
            rect.dataset.type = "nand";
            svg.appendChild(rect);

            // 入力A
            const inputA = new GameMap.Connector(x - 30, y - 10, "inputA");
            // 入力B
            const inputB = new GameMap.Connector(x - 30, y + 10, "inputB");
            // 出力
            const output = new GameMap.Connector(x + 30, y, "output");

            this.info = {el: rect, type: "nand", x, y, inputA, inputB, output};
        }
    }

    static Connector = class {
        constructor(x, y, role) {
            const body = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            body.setAttribute("cx", x);
            body.setAttribute("cy", y);
            body.setAttribute("r", 5);
            body.classList.add("connector", role);
            body.dataset.role = role;
            svg.appendChild(body);
            this.info = {el: body, x, y, role};
        }
    }

    getNearestConnector(x, y, maxDist = 20) {
        let nearest = null;
        let minDist = maxDist;
        this.getAllConnectors().forEach(conn => {
            const dx = conn.info.x - x;
            const dy = conn.info.y - y;
            const dist = Math.hypot(dx, dy);
            if (dist <= minDist) {
                nearest = conn;
                minDist = dist;
            }
        });
        return nearest;
    }

    getConnectorPosition(conn) {
        return {
            x: parseFloat(conn.info.el.getAttribute("cx")),
            y: parseFloat(conn.info.el.getAttribute("cy"))
        };
    }

    getAllConnectors() {
        return this.elements.flatMap(el => {
            if (el.info.type === "nand") return [el.info.inputA, el.info.inputB, el.info.output];
            if (el.info.type === "power") return [el.info.output];
            if (el.info.type === "end") return [el.info.input];
            return [];
        });
    }

    getConnectors(obj) {
        if (obj.info.type === "nand") return [obj.info.inputA, obj.info.inputB, obj.info.output];
        if (obj.info.type === "power") return [obj.info.output];
        if (obj.info.type === "end") return [obj.info.input];
        return [];
    }

    evaluateOnce(powerStates) {
        
        this.getAllConnectors().forEach(c => c.info.value = false);

        const powers = this.elements.filter(el => el.info.type === "power");
        powers.forEach((el, idx) => el.info.output.info.value = powerStates[idx]);

        let updated;
        let loopCount = 0;
        const MAX_LOOP = 1000;

        do {
            updated = false;

            
            this.wires.forEach(wire => {
                if (wire.info.from.info.role === "output") {
                    const val = wire.info.from.info.value;
                    if (wire.info.to.info.value !== val) {
                        wire.info.to.info.value = val;
                        updated = true;
                    }
                }
            });

            
            this.elements.forEach(el => {
                if (el.info.type === "nand") {
                    const a = el.info.inputA.info.value;
                    const b = el.info.inputB.info.value;
                    const out = !(a && b);
                    if (el.info.output.info.value !== out) {
                        el.info.output.info.value = out;
                        updated = true;
                    }
                }
            });

            loopCount++;
            if (loopCount > MAX_LOOP) {
                break;
            }
        } while (updated);

        return this.elements.some(el => el.info.type === "end" && el.info.input.info.value);
    }

    evaluateWithPowerPattern() {
        const powers = this.elements.filter(e => e.info.type === "power");
        const n = powers.length;
        let results = [];
        let successList = [];

        for (const pattern of this.generatePatterns(n)) {
            const success = this.evaluateOnce(pattern);
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

        if (this.arraysEqual(successList, this.setGoal)){
            const endTime = (Date.now() - this.startTime) / 1000;
            this.Score = Math.ceil(this.baseTime / endTime * 100);
            alert("クリア！\n今回のスコアは" + this.Score);
            location.href = location.pathname + "?difficulty=0";
        }
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, index) => val === arr2[index]);
    }

    createNANDBox() {
        const palette = document.getElementById('palette');
        const nandBox = document.querySelector('.nand-box');
        palette.appendChild(nandBox);

        nandBox.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', 'nand');
        });
    }

    * generatePatterns(n) {
    for (let i = 0; i < (1 << n); i++) {
        const pattern = [];
        for (let j = 0; j < n; j++) {
        pattern.push(Boolean(i & (1 << j)));
        }
        yield pattern;
    }
    }

    showResult() {
        this.evaluateWithPowerPattern();
        document.getElementById('result-model').style.display = 'block';
        document.getElementById('closeButton').style.display = 'inline-block';
    }

    createAssignmentTable(n, goal){
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
}

let game = new GameMap(svg);

document.getElementById("runButton").addEventListener("click", () => {
    game.showResult();
});

document.querySelector('.nand-box').addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'nand');
});

document.getElementById("startGame").addEventListener("click", () => {
    
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    game.elements = [];
    game.wires = [];

    const difficultySelect = document.getElementById("difficulty");
    switch (difficultySelect.value) {
        case "easy":
            location.href = location.pathname + "?difficulty=0";
            break;
        case "normal":
            location.href = location.pathname + "?difficulty=1";
            break;
        case "hard":
            location.href = location.pathname + "?difficulty=2";
            break;
    }
});

document.getElementById("showAssignment").addEventListener("click", () => {
    game.counter++;

    if (game.counter > 50){
        location.href = location.pathname + "?difficulty=99";
    }
});
