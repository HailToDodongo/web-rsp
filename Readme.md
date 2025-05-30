# WebRSP

Interactive RSP emulator based on Ares.<br>
This features both an assembler and emulator.<br>

Internally this uses two other projects:
- RSP-WASM: https://github.com/HailToDodongo/rsp-wasm
- armips-WASM: https://github.com/HailToDodongo/armips_wasm

## Build

Make sure your have at at least NodeJS 20 installed.<br>
After checkout, run:
```
npm install
```

To start a webserver, run:
```
npm run start
```

For a final build, run:
```
npm run build
```

# License

© 2025 - Max Bebök (HailToDodongo)

WebRSP is licensed under the MIT License, see the LICENSE file for more information.

## External
Original RSP code from ares: https://github.com/ares-emulator/ares <br>
Using this WASM wrapper: https://github.com/HailToDodongo/rsp-wasm

Assembler using a WASM port of armips: https://github.com/HailToDodongo/armips_wasm