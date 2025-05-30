export const defaultASM = `.rsp 

.create "dmem", 0x0000
  SHIFT_CONST: .db 0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01
  .align 2
.close

.create "imem", 0x1000
  # force $v00 to be zero
  vxor $v00, $v00, $v00
  # setup shift registers
  lpv $v31, 0($zero)
  vmudl $v30, $v31, $v31[7]
  ori $t0, $zero, 0x1234
  
  LOOP:
    vadd $v01, $v01, $v30[1]
    jal SOME_FUNC
    vadd $v02, $v02, $v30
    
    vmadn $v12, $v01, $v30[7]
    vmadn $v14, $v01, $v30[7]
    vmadn $v16, $v01, $v30[7]
    vmadn $v18, $v01, $v30[7]
    vmadn $v20, $v01, $v30[7]
    
    sqv $v02, 32($zero)
    vmudh $v03, $v02, $v30
  j LOOP
  addiu $t0, $t0, 0x12

  
  SOME_FUNC:
    addiu $t1, $t0, 2
    andi $a0, $t1, 0b111100
    andi $at, $t1, 0xFFFE
    bnez $at, POST_RESET
    sw $t1, 0x60($a0)
      
      addiu $a1, $a1, 1
      vxor $v02, $v00, $v00
      
    POST_RESET:
    jr $ra
    sll $t2, $t1, 1
.close
`;