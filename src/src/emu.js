import {createRSP} from 'rsp-wasm';

let rsp;

export async function rspInit(imem, dmem) {
  if(!rsp) {
    rsp = await createRSP();
  }
  rsp.fn.rsp_init();
  rsp.fn.rsp_set_halted(0);
  
  // Load into emulator (swap BE to LE)
  const imemView = new DataView(imem.buffer);
  for(let i=0; i<imem.byteLength; i += 4) {
    rsp.IMEM.setUint32(i, imemView.getUint32(i, false), true);
  }
  
  const dmemView = new DataView(dmem.buffer);
  for(let i=0; i<dmem.byteLength; i += 4) {
    rsp.DMEM.setUint32(i, dmemView.getUint32(i, false), true);
  }
  return rsp;
}

export function rspStep(steps = 1) {  
  if(steps > 0)rsp.step(steps);
  return rsp;
}
