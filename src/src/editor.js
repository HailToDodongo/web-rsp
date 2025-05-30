
import {edit as aceEdit} from "ace-builds";
import modeMIPS from 'ace-builds/src-min-noconflict/mode-mips';

import "ace-builds/src-min-noconflict/ext-searchbox.js";
import "ace-builds/src-min-noconflict/theme-chaos";
import "ace-builds/src-min-noconflict/mode-mips";

export function createEditor(id, source, line = 0)
{
    const editor = aceEdit(id);
    const mode = new modeMIPS.Mode();
    
    editor.setTheme("ace/theme/chaos");
    editor.setOptions({
      fontFamily: "proto",
      fontSize: "13px"
    });
    editor.session.setMode(mode);
    editor.session.setOptions({
      tabSize: 2,
      useSoftTabs: true,
      newLineMode: 'unix',
    });
    editor.setValue(source);
    editor.clearSelection();

    editor.gotoLine(line, 0, false);
    setTimeout(() => editor.scrollToLine(line, false, false, () => {}), 10);

    return editor;
}
