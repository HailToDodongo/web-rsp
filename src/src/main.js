import { REGS_SCALAR, REGS_VECTOR} from 'rsp-wasm';
import {assemble} from 'armips';
import { rspInit, rspStep } from './emu.js';
import { createEditor } from './editor.js';
import { defaultASM } from './defaultASM.js';
import { HexEditor } from './hexEditor.js';

let editor;
let elemLog;
let inpPC;
let inpCycle;
let rsp;
let hexEditDMEM;
let hexEditIMEM;

const log = (msg) => {
  elemLog.innerText += msg + "\n";
  elemLog.scrollTop = elemLog.scrollHeight;
}

const hex32 = value => value.toString(16).toUpperCase().padStart(8, '0');
const hex16 = value => value.toString(16).toUpperCase().padStart(4, '0');

const inputsSU = [];
const inputsVU = [];


window.step = async (steps) => {
  //const t = performance.now();
  rsp = rspStep(steps);
  inpPC.value = hex16(rsp.getPC());
  inpCycle.value = rsp.getCycles() / 3;

  // Update UI (SU registers)
  for(let i=0; i<32; i++) {
    const val = rsp.getGPR(i);
    const inp = inputsSU[i];
    const oldVal = inp.value;
    inp.value = val ? hex32(val) : "";
    inp.setAttribute("data-new", oldVal !== inp.value ? '1' : '0');
  }

  // Update UI (VU registers)
  for(let i=0; i<40; i++) {
    const vpr = rsp.getVPR(i);
    for(let j=0; j<8; j++) {
      const inp = inputsVU[i*8+j];
      const oldVal = inp.value;
      inp.value = vpr[j] ? hex16(vpr[j]) : "";
      inp.setAttribute("data-new", oldVal !== inp.value ? '1' : '0');
    }
  }

  // Update UI (DMEM)
  hexEditDMEM.render();
  /*if(steps) {
    const elapsed = performance.now() - t;
    log(`${steps} Step | ${elapsed.toFixed(2)} ms`);
  }*/
};

window.build = async () => {
  elemLog.innerText = "";
  let asm = editor.getValue();
  asm = asm.replaceAll("#", "//");

  log("Compiling...");
  const files = await assemble(asm, {
    log: (msg) => log(msg),
    error: (msg) => log("Error: " + msg),
  });
  log("Done!");

  if(!files["imem"] || !files["dmem"]) {
    log("Error: Missing imem or dmem in output files.");
    return;
  }
  rsp = await rspInit(files["imem"], files["dmem"]);
  step(0);

  hexEditIMEM.render();
};

async function main()
{
  elemLog = document.getElementById('log');
  editor = createEditor("inputASM", defaultASM, 0);

  inpPC = document.getElementById('regPC');
  inpCycle = document.getElementById('regCycle');
  const rspRegsSU = document.getElementById('rspRegsSU');
  const rspRegsVU = document.getElementById('rspRegsVU');
  
  for(let i=0; i<4; i++) {
    const cont = document.createElement('div');    
    for(let j=0; j<8; j++) {
      let idx = i*8+j;
      const regName = document.createElement('span');
      regName.innerText = idx == 0 ? "zr" : REGS_SCALAR[idx].substring(1);
      regName.className = 'typeSU';
      cont.appendChild(regName);

      const regSU = document.createElement('input');
      regSU.placeholder = "00000000";
      regSU.value = "";
      regSU.onchange = (ev) => {
        const val = parseInt(ev.target.value, 16) || 0;
        rsp.setGPR(idx, val >>> 0);
        step(0);
      };
      inputsSU.push(regSU);
      cont.appendChild(regSU);
    }
    rspRegsSU.appendChild(cont);
  }

  for(let i=0; i<40;) {
    const cont = document.createElement('div');

    for(let col=0; col<2; ++col) {
      const regName = REGS_VECTOR[i].substring(1);
      const name = document.createElement('span');
      name.className = i < 32 ? 'typeVU' : 'typeCTRL';
      name.innerText = regName;
      cont.appendChild(name);

      for(let j=0; j<8; j++) {
        const regVU = document.createElement('input');
        regVU.placeholder = "0000";
        regVU.value = "";
        regVU.onchange = ((regVU, i, j) => {
          const old = rsp.getVPR(i);
          old[j] = parseInt(regVU.value, 16) || 0;
          rsp.setVPR(i, old);
          step(0);
        }).bind(undefined, regVU, i, j)
        inputsVU.push(regVU);
        cont.appendChild(regVU);
      }
      ++i;
    }
    rspRegsVU.appendChild(cont);
  }
  
  hexEditDMEM = new HexEditor(document.querySelector("#dmem canvas"));
  hexEditIMEM = new HexEditor(document.querySelector("#imem canvas"));

  await build();

  hexEditDMEM.setRSP(rsp, true);
  hexEditDMEM.render();

  hexEditIMEM.setRSP(rsp, false);
  hexEditIMEM.render();

  const footerName = document.querySelector('#footerName');

  const footerAnim = () => {
    let charIdx = 0;
    let intId;
    const CHARSL = ['<---->', '<●--->', '<-●-->', '<--●->', '<---●>'];
    const CHARSR = ['<---->', '<---●>', '<--●->', '<-●-->', '<●--->'];

    intId = setInterval(() => { 
      const cl = CHARSL[(charIdx) % CHARSL.length];
      const cr = CHARSR[(charIdx) % CHARSR.length];

      footerName.innerText = cl+" WebRSP "+cr;
      ++charIdx;
      if(charIdx > (CHARSL.length * 4)) {
        clearInterval(intId);
        setTimeout(footerAnim, 10000);
      }
    }, 300);
  }
  footerAnim()
}

window.addEventListener('load', async () => {
  try {
    await main();
  } catch (err) {
    console.error('Error during execution:', err);
  }
});