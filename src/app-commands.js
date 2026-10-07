// The command registry: every action a control, key or touch can request maps to one handler.
import {homeCommands} from './cmd-home.js';
import {cameraCommands} from './cmd-camera.js';
import {storyCommands} from './cmd-story.js';
import {activitiesCommands} from './cmd-activities.js';
import {houseCommands} from './cmd-house.js';
import {saveCommands} from './cmd-save.js';

const handlers=Object.assign({},homeCommands,cameraCommands,storyCommands,activitiesCommands,houseCommands,saveCommands);
const BEFORE_ENTRY=['home-play','home-reload','home-sound','home-language','sound'];

function runCommand(app,action,value,origin='control'){
 if(!app.session.entered&&!BEFORE_ENTRY.includes(action))return;
 return handlers[action]?.(app,value,origin);
}

export function installCommands(app){app.dispatch=(action,value,origin='control')=>runCommand(app,action,value,origin)}
