# Wiring Shrimp Shop

## Overview

**Wiring Shrimp Shop** is a puzzle game in which players build logic circuits using only **NAND gates**.

The objective is to connect the power sources, NAND gates, and the destination server so that the circuit satisfies the target truth table for every possible input pattern.

---

## Features

* Drag and drop NAND gates onto the workspace
* Connect components by dragging between connectors
* Move gates after placement
* Remove wires by clicking them
* Automatic evaluation of all input patterns
* Score based on completion time
* Multiple difficulty levels

---

## How to Play

1. Drag a **NAND gate** from the palette onto the circuit board.
2. Connect the output and input connectors with wires.
3. Build a circuit that matches the target truth table.
4. Press **Execute** to evaluate the circuit.
5. If every input pattern produces the expected output, you clear the stage.

---

## Controls

| Action         | Description       |
| -------------- | ----------------- |
| Drag & Drop    | Place a NAND gate |
| Drag Component | Move a component  |
| Drag Connector | Create a wire     |
| Click Wire     | Delete a wire     |

---

## Technologies

* HTML5
* CSS3
* JavaScript (ES6)
* SVG

---

## Circuit Evaluation

The circuit is evaluated using a simple signal propagation algorithm.

1. Initialize every connector to `false`.
2. Apply the selected power input pattern.
3. Propagate signals through all wires.
4. Update the outputs of every NAND gate.
5. Repeat until no signal changes.
6. Compare the output with the target truth table.

All `2ⁿ` input combinations are automatically generated and tested.

---

## Score

The score is calculated from the completion time.

```text
Score = ceil(baseTime / elapsedTime × 100)
```

Higher scores are awarded for faster solutions.

---

## Project Structure

```text
WiringShrimpShop/
├── WiringShrimpShop.html
├── CSS/
├── Js/
├── img/
└── README.md
```

---

## Future Improvements

* Additional logic gates
* More puzzle stages
* Circuit save/load
* Hint system
* Better circuit validation
