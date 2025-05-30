export class HexEditor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.getter = null;
    this.byteCount = 4096; // default size
    this.bytesPerRow = 16;
    this.rowCount = this.byteCount / this.bytesPerRow;
    
    this.cellWidth = 26;
    this.cellHeight = 20;
    this.xOffset = 74;
    this.yOffset = 20;

    this.lastWidth = 0;
    this.lastHeight = 0;
    this.lastPixelSize = 0;
    this.isFirstDraw = true;
    this.rowWasZero = [];
    for(let i = 0; i < this.rowCount; i++) {
      this.rowWasZero[i] = false;
    }

    this.strAllZeros = '';
    for(let i = 0; i < this.bytesPerRow; i++) {
      this.strAllZeros += '00 ';
      if((i + 1) % 8 === 0) {
        this.strAllZeros += ' ';
      }
    }

    this.input = document.createElement('input');
    this.input.style.position = 'absolute';
    this.input.style.display = 'none';
    this.input.style.zIndex = '10';
    this.input.maxLength = 2;
    this.input.className = 'memInput';
    document.body.appendChild(this.input);

    canvas.parentNode.addEventListener('scroll', () => {
      this.input.style.display = 'none'; 
      this.editIndex = undefined; // Reset edit index on scroll
    });
    

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        let offset = 0;
        if(e.key === 'Tab') {
          offset = e.shiftKey ? -1 : 1; // Shift + Tab goes to previous, Tab goes to next
        }
        this.commitEdit(offset);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.input.style.display = 'none';
      }
    });
    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  setRSP(rsp, isDMEM) {
    this.rsp = rsp;
    /** @type {DataView} */
    this.dataView = isDMEM ? rsp.DMEM : rsp.IMEM;
    /** @type {DataView} */
    this.isDMEM = isDMEM;
  }

  render() {
    if (!this.rsp) return;
    this.input.style.display = 'none';
    
    const width = this.canvas.getBoundingClientRect().width;
    const height = this.rowCount * 20;
    const ratio = window.devicePixelRatio;
    
    if(width != this.lastWidth || height != this.lastHeight || this.lastPixelSize != window.devicePixelRatio) {
      this.lastWidth = width;
      this.lastHeight = height;
      this.lastPixelSize = window.devicePixelRatio;

      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
      this.canvas.style.width = width + "px";
      this.canvas.style.height = height + "px";
      this.canvas.getContext("2d").scale(ratio, ratio);
      this.isFirstDraw = true;
    }
    
    const ctx = this.ctx;
    if(this.isFirstDraw) {
      ctx.clearRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
      this.rowWasZero.fill(false); // Reset row zero state on first draw
    }

    ctx.font = "14px proto";
    ctx.fillStyle = "#eee";
    ctx.textAlign = "left";

    let posY = this.yOffset;
    let addr = 0;
    for(let row=0; row<this.rowCount; row++) 
    {
      let posX = 8;
      if(this.isFirstDraw) {
        ctx.fillStyle = this.isDMEM ? "rgb(214, 87, 80)" : "rgb(181, 181, 181)";
        ctx.fillRect(0, posY - 15, 68, (this.cellHeight-2));
        const addrTxt = "0x" + (addr).toString(16).padStart(4, '0').toUpperCase();
        ctx.fillStyle = "#000";
        ctx.fillText(addrTxt, posX, posY);  
      }

      posX = this.xOffset;

      const word0 = this.dataView.getUint32(addr+0);
      const word1 = this.dataView.getUint32(addr+4);
      const word2 = this.dataView.getUint32(addr+8);
      const word3 = this.dataView.getUint32(addr+12);
      addr += 16;
      
      let allZero = word0 === 0 && word1 === 0 && word2 === 0 && word3 === 0;

      ctx.fillStyle = "#666";

      const needsClear = !allZero || !this.rowWasZero[row];
      if(needsClear) {
        ctx.clearRect(this.xOffset, posY - 14, this.canvas.width / window.devicePixelRatio, this.cellHeight);
      }

      if(allZero) {
        if(!this.rowWasZero[row]) {
          ctx.fillText(this.strAllZeros, posX, posY);
          this.rowWasZero[row] = true;
        }
      } else {
        const values = [
          word0 & 0xFF, (word0 >> 8) & 0xFF, (word0 >> 16) & 0xFF, (word0 >> 24) & 0xFF,
          word1 & 0xFF, (word1 >> 8) & 0xFF, (word1 >> 16) & 0xFF, (word1 >> 24) & 0xFF,
          word2 & 0xFF, (word2 >> 8) & 0xFF, (word2 >> 16) & 0xFF, (word2 >> 24) & 0xFF,
          word3 & 0xFF, (word3 >> 8) & 0xFF, (word3 >> 16) & 0xFF, (word3 >> 24) & 0xFF
        ];

        this.rowWasZero[row] = false;
        let strZero = '';
        let strNum = '';

        for(let i = 0; i < this.bytesPerRow; i++) 
        {
          const val = values[i];
          if(val === 0) {
            strZero += '00 ';
            strNum += '   ';
          } else {
            strZero += '   ';
            const hex = val.toString(16).padStart(2, '0').toUpperCase()
            strNum += hex + ' ';
          }

          if((i+1) % 8 == 0) {
            strNum += ' ';
            strZero += ' ';
          }
        }

        ctx.fillText(strZero, posX, posY);
        ctx.fillStyle = "#FFF";
        ctx.fillText(strNum, posX, posY);
      } 

      posY += this.cellHeight;
    }
    this.isFirstDraw = false;
  }

  posToAddress(mouseX, mouseY) {
    const rect = this.canvas.getBoundingClientRect();
    mouseX = mouseX - rect.left - (this.xOffset);
    mouseY = mouseY - rect.top - 1;

    let spacing = Math.floor(mouseX / (this.cellWidth * 8)) * 9;
    mouseX -= spacing; // Remove spacing for every 8th column

    const col = Math.floor(mouseX / this.cellWidth);
    const row = Math.floor(mouseY / this.cellHeight);
    if(col < 0 || row < 0 || col >= this.bytesPerRow)return -1;
    
    const index = row * this.bytesPerRow + col;
    return index;
  }

  addressToPos(address) {
    if (address < 0 || address >= this.byteCount) return null;

    const rect = this.canvas.getBoundingClientRect();
    const row = Math.floor(address / this.bytesPerRow);
    const col = address % this.bytesPerRow;
    let posX = this.xOffset + col * this.cellWidth;
    let spacing = Math.floor(col / 8) * 9;
    posX += spacing; // Add spacing for every 8th column
    let posY = row * this.cellHeight + 3;

    return { x: rect.left + posX, y: rect.top + posY };
  }

  openEdit(address) {
    if (address < 0 || address >= this.byteCount) return;

    const pos = this.addressToPos(address);
    if(!pos)return;

    this.editIndex = address;
    const val = this.isDMEM
      ? this.rsp.dmemReadU8(address)
      : this.rsp.imemReadU8(address);

    this.input.value = val.toString(16).padStart(2, '0').toUpperCase();
    this.input.style.left = `${pos.x}px`;
    this.input.style.top = `${pos.y}px`;
    this.input.style.display = 'block';
    this.input.focus();
    this.input.select();
  }
  
  onClick(e) {
    if (this.input.style.display === 'block') {
      this.commitEdit();
    }
    const index = this.posToAddress(e.clientX, e.clientY);
    if(index < 0)return;
    this.openEdit(index);
  }

  commitEdit(goToNext = 0) {
    if (this.editIndex === undefined) return;

    const val = parseInt(this.input.value, 16);
    if (!isNaN(val)) {
      if(this.isDMEM) {
        this.rsp.dmemWriteU8(this.editIndex, val & 0xFF);
      } else {
        this.rsp.imemWriteU8(this.editIndex, val & 0xFF);
      }
    }
    if(goToNext != 0) {
      this.render();
      this.openEdit(this.editIndex+goToNext);
    } else {
      this.render();
    }
  }
}
