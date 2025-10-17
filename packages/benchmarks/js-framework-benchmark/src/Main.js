"use strict";

function _random(max) {
  return (Math.random() * max) | 0;
}

const rowTemplate = document.createElement("tr");
rowTemplate.innerHTML =
  "<td class='col-md-1'></td><td class='col-md-4'><a></a></td><td class='col-md-1'><a><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></a></td><td class='col-md-6'></td>";

class Store {
  constructor() {
    this.data = [];
    this.selected = null;
    this.id = 1;
  }
  buildData(count = 1000) {
    const adjectives = [
      "pretty", "large", "big", "small", "tall", "short", "long", "handsome",
      "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful",
      "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap",
      "expensive", "fancy",
    ];
    const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
    const nouns = [
      "table", "chair", "house", "bbq", "desk", "car", "pony", "cookie",
      "sandwich", "burger", "pizza", "mouse", "keyboard",
    ];
    const data = new Array(count);
    for (let i = 0; i < count; i++) {
      data[i] = {
        id: this.id++,
        label:
          adjectives[_random(adjectives.length)] +
          " " +
          colours[_random(colours.length)] +
          " " +
          nouns[_random(nouns.length)],
      };
    }
    return data;
  }
  updateData(mod = 10) {
    for (let i = 0; i < this.data.length; i += 10) {
      this.data[i].label += " !!!";
    }
  }
  delete(id) {
    const idx = this.data.findIndex((d) => d.id === id);
    this.data.splice(idx, 1);
    return this;
  }
  run() {
    this.data = this.buildData();
    this.selected = null;
  }
  add() {
    this.data = this.data.concat(this.buildData(1000));
  }
  update() {
    this.updateData();
  }
  select(id) {
    this.selected = id;
  }
  runLots() {
    this.data = this.buildData(10000);
    this.selected = null;
  }
  clear() {
    this.data = [];
    this.selected = null;
  }
  swapRows() {
    if (this.data.length > 998) {
      const tmp = this.data[1];
      this.data[1] = this.data[998];
      this.data[998] = tmp;
    }
  }
}

// WeakMap for faster ID lookups (STX optimization)
const rowIdMap = new WeakMap();
const idRowMap = new Map();

function getParentId(elem) {
  while (elem) {
    if (elem.tagName === "TR") {
      return rowIdMap.get(elem);
    }
    elem = elem.parentNode;
  }
  return undefined;
}

class Main {
  constructor() {
    this.store = new Store();
    this.select = this.select.bind(this);
    this.delete = this.delete.bind(this);
    this.add = this.add.bind(this);
    this.run = this.run.bind(this);
    this.update = this.update.bind(this);
    this.rows = [];
    this.data = [];
    this.selectedRow = undefined;

    document.getElementById("main").addEventListener("click", (e) => {
      if (e.target.matches("#add")) {
        e.stopPropagation();
        this.add();
      } else if (e.target.matches("#run")) {
        e.stopPropagation();
        this.run();
      } else if (e.target.matches("#update")) {
        e.stopPropagation();
        this.update();
      } else if (e.target.matches("#runlots")) {
        e.stopPropagation();
        this.runLots();
      } else if (e.target.matches("#clear")) {
        e.stopPropagation();
        this.clear();
      } else if (e.target.matches("#swaprows")) {
        e.stopPropagation();
        this.swapRows();
      }
    });

    document.getElementById("tbody").addEventListener("click", (e) => {
      e.stopPropagation();
      let p = e.target;
      while (p && p.tagName !== "TD") {
        p = p.parentNode;
      }
      if (!p) return;

      if (p.parentNode.childNodes[1] === p) {
        const id = getParentId(e.target);
        const idx = this.data.findIndex((row) => row.id === id);
        if (idx >= 0) this.select(idx);
      } else if (p.parentNode.childNodes[2] === p) {
        const id = getParentId(e.target);
        const idx = this.data.findIndex((row) => row.id === id);
        if (idx >= 0) this.delete(idx);
      }
    });

    this.tbody = document.getElementById("tbody");
    this.table = document.getElementsByTagName("table")[0];
  }

  run() {
    this.removeAllRows();
    this.store.clear();
    this.rows = [];
    this.data = [];
    idRowMap.clear();
    this.store.run();
    this.appendRows();
    this.unselect();
  }

  add() {
    this.store.add();
    this.appendRows();
  }

  update() {
    this.store.update();
    for (let i = 0; i < this.data.length; i += 10) {
      this.rows[i].childNodes[1].childNodes[0].firstChild.nodeValue = this.store.data[i].label;
    }
  }

  unselect() {
    if (this.selectedRow !== undefined) {
      this.selectedRow.className = "";
      this.selectedRow = undefined;
    }
  }

  select(idx) {
    this.unselect();
    this.store.select(this.data[idx].id);
    this.selectedRow = this.rows[idx];
    this.selectedRow.className = "danger";
  }

  recreateSelection() {
    const old_selection = this.store.selected;
    const sel_idx = this.store.data.findIndex((d) => d.id === old_selection);
    if (sel_idx >= 0) {
      this.store.select(this.data[sel_idx].id);
      this.selectedRow = this.rows[sel_idx];
      this.selectedRow.className = "danger";
    }
  }

  delete(idx) {
    this.store.delete(this.data[idx].id);
    const row = this.rows[idx];
    if (row) {
      idRowMap.delete(this.data[idx].id);
      row.remove();
    }
    this.rows.splice(idx, 1);
    this.data.splice(idx, 1);
    this.unselect();
    this.recreateSelection();
  }

  removeAllRows() {
    this.tbody.textContent = "";
  }

  runLots() {
    this.removeAllRows();
    this.store.clear();
    this.rows = [];
    this.data = [];
    idRowMap.clear();
    this.store.runLots();
    this.appendRows();
    this.unselect();
  }

  clear() {
    this.store.clear();
    this.rows = [];
    this.data = [];
    idRowMap.clear();
    this.removeAllRows();
    this.unselect();
  }

  swapRows() {
    if (this.data.length > 998) {
      this.store.swapRows();
      this.data[1] = this.store.data[1];
      this.data[998] = this.store.data[998];

      this.tbody.insertBefore(this.rows[998], this.rows[2]);
      this.tbody.insertBefore(this.rows[1], this.rows[999]);

      const tmp = this.rows[998];
      this.rows[998] = this.rows[1];
      this.rows[1] = tmp;
    }
  }

  appendRows() {
    const rows = this.rows;
    const s_data = this.store.data;
    const data = this.data;
    const tbody = this.tbody;

    const startIdx = rows.length;
    const fragment = document.createDocumentFragment();

    for (let i = startIdx; i < s_data.length; i++) {
      const tr = this.createRow(s_data[i]);
      rows[i] = tr;
      data[i] = s_data[i];
      fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);
  }

  createRow(data) {
    const tr = rowTemplate.cloneNode(true);
    const td1 = tr.firstChild;
    const a2 = td1.nextSibling.firstChild;

    // Use WeakMap for ID tracking (STX optimization)
    rowIdMap.set(tr, data.id);
    idRowMap.set(data.id, tr);

    td1.textContent = data.id;
    a2.textContent = data.label;

    return tr;
  }
}

const mainInstance = new Main();

// Expose functions for benchmark runner
if (typeof window !== 'undefined') {
  window.benchmarkFunctions = {
    run: () => mainInstance.run(),
    runLots: () => mainInstance.runLots(),
    add: () => mainInstance.add(),
    update: () => mainInstance.update(),
    clear: () => mainInstance.clear(),
    swapRows: () => mainInstance.swapRows(),
    select: (id) => {
      const idx = mainInstance.data.findIndex(row => row.id === id);
      if (idx >= 0) mainInstance.select(idx);
    },
    remove: (id) => {
      const idx = mainInstance.data.findIndex(row => row.id === id);
      if (idx >= 0) mainInstance.delete(idx);
    }
  };
}
