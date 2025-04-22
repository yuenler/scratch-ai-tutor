// Constants for fields, blocks, and inputs
const FIELDS = {
  "_mouse_": "mouse-pointer",
  "_random_": "random position",
  "PAN": "pan left/right",
};

const BLOCKS = {
  // Motion
  "motion_movesteps": ["move {} steps", ["STEPS"]],
  "motion_turnright": ["turn right {} degrees", ["DEGREES"]],
  "motion_turnleft": ["turn left {} degrees", ["DEGREES"]],
  "motion_goto": ["go to {}", ["TO"]],
  "motion_gotoxy": ["go to x: {} y: {}", ["X", "Y"]],
  "motion_glideto": ["glide {} secs to {}", ["SECS", "TO"]],
  "motion_glidesecstoxy": ["glide {} secs to x: {} y: {}", ["SECS", "X", "Y"]],
  "motion_pointindirection": ["point in direction {}", ["DIRECTION"]],
  "motion_pointtowards": ["point towards {}", ["TOWARDS"]],
  "motion_changexby": ["change x by {}", ["DX"]],
  "motion_setx": ["set x to {}", ["X"]],
  "motion_changeyby": ["change y by {}", ["DY"]],
  "motion_sety": ["set y to {}", ["Y"]],
  "motion_ifonedgebounce": ["if on edge, bounce", []],
  "motion_setrotationstyle": ["set rotation style [{} v]", [["STYLE", {}]]],

  // Looks
  "looks_sayforsecs": ["say {} for {} seconds", ["MESSAGE", "SECS"]],
  "looks_say": ["say {}", ["MESSAGE"]],
  "looks_thinkforsecs": ["think {} for {} seconds", ["MESSAGE", "SECS"]],
  "looks_think": ["think {}", ["MESSAGE"]],
  "looks_switchcostumeto": ["switch costume to {}", ["COSTUME"]],
  "looks_nextcostume": ["next costume", []],
  "looks_switchbackdropto": ["switch backdrop to {}", ["BACKDROP"]],
  "looks_nextbackdrop": ["next backdrop", []],
  "looks_changesizeby": ["change size by {}", ["CHANGE"]],
  "looks_setsizeto": ["set size to {} %", ["SIZE"]],
  "looks_changeeffectby": ["change [{} v] effect by {}", [["EFFECT", {}], "CHANGE"]],
  "looks_seteffectto": ["set [{} v] effect to {}", [["EFFECT", {}], "VALUE"]],
  "looks_cleargraphiceffects": ["clear graphic effects", []],
  "looks_show": ["show", []],
  "looks_hide": ["hide", []],
  "looks_gotofrontback": ["go to [{} v] layer", [["FRONT_BACK", {}]]],
  "looks_goforwardbackwardlayers": ["go [{} v] {} layers", [["FORWARD_BACKWARD", {}], "NUM"]],

  // Sound
  "sound_playuntildone": ["play sound {} until done", ["SOUND_MENU"]],
  "sound_play": ["start sound {}", ["SOUND_MENU"]],
  "sound_stopallsounds": ["stop all sounds", []],
  "sound_changeeffectby": ["change [{} v] effect by {}", [["EFFECT", FIELDS], "VALUE"]],
  "sound_seteffectto": ["set [{} v] effect to {}", [["EFFECT", FIELDS], "VALUE"]],
  "sound_cleareffects": ["clear sound effects", []],
  "sound_changevolumeby": ["change volume by {}", ["VOLUME"]],
  "sound_setvolumeto": ["set volume to {} %", ["VOLUME"]],

  // Events
  "event_whenflagclicked": ["when flag clicked", []],
  "event_whenkeypressed": ["when [{} v] key pressed", [["KEY_OPTION", {}]]],
  "event_whenthisspriteclicked": ["when this sprite clicked", []],
  "event_whenbackdropswitchesto": ["when backdrop switches to [{} v]", [["BACKDROP", {}]]],
  "event_whengreaterthan": ["when [{} v] > {}", [["WHENGREATERTHANMENU", FIELDS], "VALUE"]],
  "event_whenbroadcastreceived": ["when I receive [{} v]", [["BROADCAST_OPTION", {}]]],
  "event_whenstageclicked": ["when stage clicked", []],

  // Broadcast
  "event_broadcast": ["broadcast {}", ["BROADCAST_INPUT"]],
  "event_broadcastandwait": ["broadcast {} and wait", ["BROADCAST_INPUT"]],

  // Control
  "control_wait": ["wait {} seconds", ["DURATION"]],
  "control_repeat": ["repeat {}", ["TIMES"]],
  "control_if": ["if {} then", ["CONDITION"]],
  "control_if_else": ["if {} then", ["CONDITION"]],
  "control_forever": ["forever", []],
  "control_repeat_until": ["repeat until {}", ["CONDITION"]],
  "control_stop": ["stop [{} v]", [["STOP_OPTION", {}]]],
  "control_start_as_clone": ["when I start as a clone", []],
  "control_create_clone_of": ["create clone of {}", ["CLONE_OPTION"]],
  "control_delete_this_clone": ["delete this clone", []],
  "control_wait_until": ["wait until {}", ["CONDITION"]],

  // Sensing
  "sensing_askandwait": ["ask {} and wait", ["QUESTION"]],
  "sensing_setdragmode": ["set drag mode [{} v]", [["DRAG_MODE", FIELDS]]],
  "sensing_resettimer": ["reset timer", []],

  // Variables
  "data_variable": ["({})", ["VARIABLE"]],
  "data_setvariableto": ["set [{} v] to {}", [["VARIABLE", FIELDS], "VALUE"]],
  "data_changevariableby": ["change [{} v] by {}", [["VARIABLE", FIELDS], "VALUE"]],
  "data_hidevariable": ["hide variable [{} v]", [["VARIABLE", FIELDS]]],
  "data_showvariable": ["show variable [{} v]", [["VARIABLE", FIELDS]]],

  // Lists
  "data_listcontents": ["<[{} v] contains {} >", [["LIST", FIELDS], "ITEM"]],
  "data_addtolist": ["add {} to [{} v]", ["ITEM", ["LIST", FIELDS]]],
  "data_deleteoflist": ["delete {} of [{} v]", ["INDEX", ["LIST", FIELDS]]],
  "data_deletealloflist": ["delete all of [{} v]", [["LIST", FIELDS]]],
  "data_insertatlist": ["insert {} at {} of [{} v] ", ["ITEM", "INDEX", ["LIST", FIELDS]]],
  "data_replaceitemoflist": ["replace item {} of [{} v] with {}", ["INDEX", ["LIST", FIELDS], "ITEM"]],
  "data_hidelist": ["show list [{} v]", [["LIST", FIELDS]]],
  "data_showlist": ["hide list [{} v]", [["LIST", FIELDS]]],

  // My Blocks
  "procedures_definition": ["define {}", ["custom_block"]],
  "procedures_call": customBlock,

  // Pen
  "pen_clear": ["erase all", []],
  "pen_stamp": ["stamp", []],
  "pen_penDown": ["pen down", []],
  "pen_penUp": ["pen up", []],
  "pen_setPenColorToColor": ["set pen color to {}", ["COLOR"]],
  "pen_changePenColorParamBy": ["change pen ({} v) by {}", ["COLOR_PARAM", "VALUE"]],
  "pen_setPenColorParamTo": ["set pen ({} v) to {}", ["COLOR_PARAM", "VALUE"]],
  "pen_changePenSizeBy": ["change pen size by {}", ["SIZE"]],
  "pen_setPenSizeTo": ["set pen size to {}", ["SIZE"]],
  "pen_changePenHueBy": ["change pen color by {}", ["HUE"]],

  // Music
  "music_playDrumForBeats": ["play drum ({} v) for {} beats", ["DRUM", "BEATS"]],
  "music_restForBeats": ["rest for {} beats", ["BEATS"]],
  "music_playNoteForBeats": ["play note ({}) for {} beats", ["NOTE", "BEATS"]],
  "music_setInstrument": ["set instrument to ({} v)", ["INSTRUMENT"]],
  "music_setTempo": ["set tempo to {}", ["TEMPO"]],
  "music_changeTempo": ["change tempo by {}", ["TEMPO"]],

  // Video
  "videoSensing_whenMotionGreaterThan": ["when video motion > {}", ["REFERENCE"]],
  "videoSensing_videoToggle": ["turn video ({} v)", ["VIDEO_STATE"]],
  "videoSensing_setVideoTransparency": ["set video transparency to {}", ["TRANSPARENCY"]],

  // Text to Speech
  "text2speech_speakAndWait": ["speak {}::tts", ["WORDS"]],
  "text2speech_setVoice": ["set voice to ({} v)::tts", ["VOICE"]],
  "text2speech_setLanguage": ["set language to ({} v)::tts", ["LANGUAGE"]],
};

const INPUTS = {
  // Motion
  "motion_goto_menu": ["({} v)", [["TO", FIELDS]]],
  "motion_glideto_menu": ["({} v)", [["TO", FIELDS]]],
  "motion_pointtowards_menu": ["({} v)", [["TOWARDS", FIELDS]]],
  "motion_xposition": ["(x position)", []],
  "motion_yposition": ["(y position)", []],
  "motion_direction": ["(direction)", []],

  // Looks
  "looks_costume": ["({} v)", [["COSTUME", {}]]],
  "looks_backdrops": ["({} v)", [["BACKDROP", {}]]],
  "looks_costumenumbername": ["(costume [{} v])", [["NUMBER_NAME", {}]]],
  "looks_backdropnumbername": ["(backdrop [{} v])", [["NUMBER_NAME", {}]]],
  "looks_size": ["(size)", []],

  // Sound
  "sound_sounds_menu": ["[{} v]", [["SOUND_MENU", { attrs: ["preservecase"] }]]],
  "sound_volume": ["(volume)", []],

  // Control
  "control_create_clone_of_menu": ["({} v)", [["CLONE_OPTION", FIELDS]]],

  // Sensing
  "sensing_mousedown": ["<mouse down?>", []],
  "sensing_touchingobject": ["<touching [{} v]?>", ["TOUCHINGOBJECTMENU"]],
  "sensing_touchingobjectmenu": ["{}", [["TOUCHINGOBJECTMENU", FIELDS]]],
  "sensing_touchingcolor": ["<touching color {}?>", ["COLOR"]],
  "sensing_coloristouchingcolor": ["<color {} is touching {}?>", ["COLOR", "COLOR2"]],
  "sensing_distanceto": ["(distance to [{} v])", ["DISTANCETOMENU"]],
  "sensing_distancetomenu": ["{}", [["DISTANCETOMENU", FIELDS]]],
  "sensing_keypressed": ["<key [{} v] pressed?>", ["KEY_OPTION"]],
  "sensing_keyoptions": ["{}", [["KEY_OPTION", FIELDS]]],
  "sensing_mousex": ["(mouse x)", []],
  "sensing_mousey": ["(mouse y)", []],
  "sensing_loudness": ["(loudness)", []],
  "sensing_timer": ["(timer)", []],
  "sensing_of": ["([{} v] of {})", [["PROPERTY", FIELDS], "OBJECT"]],
  "sensing_of_object_menu": ["[{} v]", [["OBJECT", FIELDS]]],
  "sensing_current": ["(current [{} v])", [["CURRENTMENU", FIELDS]]],
  "sensing_dayssince2000": ["(days since 2000)", []],
  "sensing_username": ["(username)", []],
  "sensing_answer": ["(answer)", []],

  // Operators
  "operator_add": ["({} + {})", ["NUM1", "NUM2"]],
  "operator_subtract": ["({} - {})", ["NUM1", "NUM2"]],
  "operator_equals": ["<{} = {}>", ["OPERAND1", "OPERAND2"]],
  "operator_random": ["(pick random {} to {})", ["FROM", "TO"]],
  "operator_gt": ["<{} > {}>", ["OPERAND1", "OPERAND2"]],
  "operator_lt": ["<{} < {}>", ["OPERAND1", "OPERAND2"]],
  "operator_and": ["<{} and {}>", ["OPERAND1", "OPERAND2"]],
  "operator_round": ["(round {})", ["NUM"]],
  "operator_mathop": ["([{} v] of {} )", [["OPERATOR", FIELDS], "NUM"]],
  "operator_or": ["<{} or {}>", ["OPERAND1", "OPERAND2"]],
  "operator_not": ["<not {}>", ["OPERAND"]],
  "operator_join": ["(join {} {})", ["STRING1", "STRING2"]],
  "operator_letter_of": ["(letter {} of {})", ["LETTER", "STRING"]],
  "operator_length": ["(length of {})", ["STRING"]],
  "operator_contains": ["< {} contains {}?>", ["STRING1", "STRING2"]],
  "operator_mod": ["({} mod {})", ["NUM1", "NUM2"]],
  "operator_multiply": ["({} * {})", ["NUM1", "NUM2"]],
  "operator_divide": ["({} / {})", ["NUM1", "NUM2"]],

  // List
  "data_itemoflist": ["(item {} of [{} v])", ["INDEX", ["LIST", FIELDS]]],
  "data_itemnumoflist": ["(item # of {} in [{} v])", ["ITEM", ["LIST", FIELDS]]],
  "data_lengthoflist": ["(length of [{} v])", [["LIST", FIELDS]]],
  "data_listcontainsitem": ["<[{} v] contains {}?>", [["LIST", FIELDS], "ITEM"]],

  // My Blocks
  "procedures_prototype": customBlock,
  "argument_reporter_boolean": ["<{}>", [["VALUE", {}]]],
  "argument_reporter_string_number": ["({})", [["VALUE", {}]]],

  // Pen
  "pen_menu_colorParam": ["{}", [["colorParam", FIELDS]]],

  // Music
  "music_menu_DRUM": ["{}", [["DRUM", FIELDS]]],
  "note": ["{}", [["NOTE", FIELDS]]],
  "music_menu_INSTRUMENT": ["{}", [["INSTRUMENT", FIELDS]]],
  "music_getTempo": ["(tempo)", []],

  // Video
  "videoSensing_menu_VIDEO_STATE": ["{}", [["VIDEO_STATE", FIELDS]]],
  "videoSensing_videoOn": ["(video ({} v) on ({} v))", ["ATTRIBUTE", "SUBJECT"]],
  "videoSensing_menu_ATTRIBUTE": ["{}", [["ATTRIBUTE", FIELDS]]],
  "videoSensing_menu_SUBJECT": ["{}", [["SUBJECT", FIELDS]]],

  // Text to Speech
  "text2speech_menu_voices": ["{}", [["voices", FIELDS]]],
  "text2speech_menu_languages": ["{}", [["languages", FIELDS]]],

  // Translate
  "translate_menu_languages": ["{}", [["languages", FIELDS]]],
  "translate_getViewerLanguage": ["(language::translate)", []],
  "translate_getTranslate": ["(translate {} to ({} v)::translate)", ["WORDS", "LANGUAGE"]],
};

// Custom block helper (for My Blocks)
function customBlock(block) {
  // Replace %s and %b with {} placeholders
  let proccode = block.mutation.proccode.replace(/%s/g, "{}").replace(/%b/g, "{}");
  // Find all %s and %b occurrences
  const placeholders = [...proccode.matchAll(/%[sb]/g)].map(m => m[0]);
  const inputs = JSON.parse(block.mutation.argumentids);
  for (let i = 0; i < inputs.length; i++) {
    const input_id = inputs[i];
    if (!(input_id in block.inputs)) {
      block.inputs[input_id] =
        placeholders[i] === "%s" ? [1, [10, ""]] : [1, ["BOOL", ""]];
    }
  }
  return [proccode, inputs];
}

// --- Helper Functions ---

// Fetch project JSON data from a Scratch URL.
async function getProjectFromUrl(url, providedToken = null) {
  const match = url.match(/scratch\.mit\.edu\/projects\/(\d+)(\/)?/);
  if (!match) return null;
  const projectId = match[1];

  let token = providedToken;
  
  // Only fetch token if not provided
  if (!token) {
    console.log(`No token provided for project ${projectId}, fetching...`);
    // First, get project details to obtain the token.
    try {
      // Add browser-like headers to avoid rate limiting - matching actual browser headers
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://scratch.mit.edu/',
        'sec-ch-ua': '"Not:A-Brand";v="24", "Chromium";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-site',
        'dnt': '1',
        'upgrade-insecure-requests': '1'
      };
      
      const res1 = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`, { 
        headers,
        credentials: 'omit' // Don't send cookies - we don't have them in the server environment
      });
      const details = await res1.json();

      // Check if project is not shared
      if (details.code === 'NotFound' && details.message === '') {
        console.log(`Project ${projectId} is not shared`);
        console.log(details);
        return { project: null, token: null, error: "Project is not shared. The user needs to share their Scratch project to use this feature." };
      }

      token = details.project_token;
      
      if (!token) {
        console.log(`Failed to get token for project ${projectId}`);
        console.log(details);
        return { project: null, token: null, error: "Failed to get token" };
      }
    } catch (error) {
      console.error(`Error fetching project token for ${projectId}:`, error);
      return { project: null, token: null, error: error };
    }
  } else {
    console.log(`Using provided token for project ${projectId}`);
  }

  // Then, get the full project JSON using the token.
  try {
    const res2 = await fetch(`https://projects.scratch.mit.edu/${projectId}?token=${token}`);
    const project = await res2.json();
    return { project, token };
  } catch (error) {
    console.error(`Error fetching project data for ${projectId}:`, error);
    return { project: null, token: null, error: error };
  }
}

// Generate scratchblocks scripts from a project.
function generateScratchblocks(project) {
  const targets = project.targets;
  const targetScripts = [];

  for (const target of targets) {
    const scripts = [];
    
    // Get all scripts for this target
    for (const blockId in target.blocks) {
      const block = target.blocks[blockId];
      const isStart =
        typeof block === "object" &&
        block.parent === null &&
        block.opcode in BLOCKS;
      if (isStart) {
        const script = generateScript(blockId, target.blocks);
        scripts.push(script);
      }
    }
    
    // Only add targets that have scripts
    if (scripts.length > 0) {
      targetScripts.push({
        type: target.isStage ? "Stage" : "Sprite",
        name: target.name,
        scripts: scripts
      });
    }
  }
  
  return targetScripts;
}

// Recursively generate a script starting from a block.
function generateScript(blockId, blocks, blockIds, findBlock = true) {
  if (!blockIds) {
    blockIds = Object.keys(blocks);
  }
  if (blockIds.indexOf(blockId) === -1) {
    return null;
  }
  const block = blocks[blockId];
  const opcode = block.opcode;
  let script = null;

  if (opcode in BLOCKS) {
    const blockStructure = BLOCKS[opcode];
    let name, inputs;
    if (typeof blockStructure === "function") {
      [name, inputs] = blockStructure(block);
    } else {
      [name, inputs] = blockStructure;
    }
    const label = formatBlock(blockId, blocks, name, inputs);
    script = { label };
  } else if (opcode in INPUTS && block.parent !== null && findBlock) {
    blockIds.push(block.parent);
    return generateScript(block.parent, blocks, blockIds);
  } else {
    throw new Error(`MISSING handler for ${opcode}`);
  }

  // Handle next block
  if (block.next && blockIds.indexOf(block.next) !== -1) {
    script.next = generateScript(block.next, blocks, blockIds);
  }

  // Handle sub-stacks
  if (block.inputs && block.inputs.SUBSTACK) {
    const substackId = block.inputs.SUBSTACK[1];
    script.substack = generateScript(substackId, blocks, blockIds);
  }
  if (block.inputs && block.inputs.SUBSTACK2) {
    const substackId2 = block.inputs.SUBSTACK2[1];
    script.substack2 = generateScript(substackId2, blocks, blockIds);
  }

  return script;
}

// Generate the text for an input value.
function generateInput(inputBlock, blocks) {
  const mainInput = inputBlock[1];

  if (typeof mainInput === "string") {
    return generateInputBlock(mainInput, blocks);
  } else if (Array.isArray(mainInput)) {
    const inputType = mainInput[0];
    const inputValue = mainInput[1];
    if ([4, 5, 6, 7, 8, 9, 12, 13].includes(inputType)) {
      return `(${inputValue})`;
    } else if (inputType === 10) {
      return `[${inputValue}]`;
    } else if (inputType === 11) {
      return `(${inputValue} v)`;
    } else if (inputType === "BOOL") {
      return `<${inputValue}>`;
    }
  }
  throw new Error(`Missing handler for input type ${typeof mainInput}`);
}

// Generate the text from an input reporter block.
function generateInputBlock(blockId, blocks) {
  const block = blocks[blockId];
  const opcode = block.opcode;
  if (opcode in INPUTS) {
    const blockStructure = INPUTS[opcode];
    let name, inputs;
    if (typeof blockStructure === "function") {
      [name, inputs] = blockStructure(block);
    } else {
      [name, inputs] = blockStructure;
    }
    const inputBlock = formatBlock(blockId, blocks, name, inputs);
    return inputBlock;
  }
  throw new Error(`Missing handler for input ${opcode}`);
}

// Format a block’s text using its format string and inputs.
function formatBlock(blockId, blocks, name, inputs) {
  const block = blocks[blockId];
  const args = [];
  for (const inputName of inputs) {
    if (typeof inputName === "string") {
      const inputData = block.inputs[inputName];
      const arg = generateInput(inputData, blocks);
      args.push(arg);
    } else if (Array.isArray(inputName)) {
      // inputName is of the form [fieldName, mapping]
      const fieldName = inputName[0];
      const mapping = inputName[1];
      args.push(getFieldName(mapping, block, fieldName));
    } else {
      throw new Error(`unsupported block type ${typeof inputName}`);
    }
  }
  // Replace each '{}' in order with the corresponding argument.
  let formatted = name;
  for (const arg of args) {
    formatted = formatted.replace("{}", arg);
  }
  return formatted;
}

// Get a field’s display value.
function getFieldName(mapping, block, fieldName) {
  const value = String(block.fields[fieldName][0]);
  if (mapping && mapping[value]) {
    return mapping[value];
  } else if (mapping && mapping.attrs && mapping.attrs.includes("preservecase")) {
    return value;
  }
  return value.toLowerCase();
}

// Create the final blocks string with indentation.
function blockString(targetScripts) {
  function indentString(block, indent) {
    if (!block) return "";
    let output = " ".repeat(indent) + block.label + "\n";

    if (block.substack) {
      output += indentString(block.substack, indent + 4);
      if (block.substack2) {
        output += " ".repeat(indent) + "else\n";
        output += indentString(block.substack2, indent + 4);
      }
      output += " ".repeat(indent) + "end\n";
    }
    if (block.next) {
      output += indentString(block.next, indent);
    }
    return output;
  }

  let output = "";
  for (const target of targetScripts) {
    // Add a header for each target with its type and name
    output += `=== ${target.type}: ${target.name} ===\n\n`;
    
    // Add all scripts for this target, each in its own scratchblocks code block
    for (const script of target.scripts) {
      // Start scratchblocks code block
      output += "```scratchblocks\n";
      
      // Add the script
      output += indentString(script, 0);
      
      // End scratchblocks code block
      output += "```\n\n";
    }
  }
  return output;
}

// --- Main Function ---
// This function accepts a Scratch project URL and an optional token, and returns a Promise resolving to the blocks text and token.
export default async function convertScratchURLToBlocks(url, token = null) {
  try {
    // First attempt with provided token
    let result = await getProjectFromUrl(url, null);     
    
    // If project fetch failed and we were using a provided token, try again without it
    // (the token might have expired)
    // if (!result.project && token) {
    //   console.log("Provided token failed, fetching a new one...");
    //   // wait 1 second to avoid rate limiting
    //   await new Promise(resolve => setTimeout(resolve, 1000));
    //   result = await getProjectFromUrl(url, null);
    // }
    
    if (!result.project) {
      console.error("Failed to download project.");
      return { blocksText: null, token: null, error: result.error };
    }
    
    const scripts = generateScratchblocks(result.project);
    const blocksText = blockString(scripts);
    return { blocksText, token: result.token };
  } catch (error) {
    console.error("Error converting Scratch URL to blocks:", error);
    return { blocksText: null, token: null };
  }
}
