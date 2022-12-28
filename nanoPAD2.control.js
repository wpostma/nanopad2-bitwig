/*

This is Warren Postma's attempted 2022 rework of Factotumo's nanopad2 script.

THis is the main script.

*/

loadAPI(14); // bitwig 4+

load("NanoPAD2.consts.js");
load("NanoPAD2.object.js");

host.defineController(
    "Korg", "nanoPAD2 2022",
    "1.0", "de945665-7dd6-4615-8294-fc06e4a02c0b"
);

host.defineMidiPorts(1,0);

// set to 1 to enable console logging
var enableDebugLogging = 1;


var nanoPAD2;

// TODO: add support for log levels
function init() {

    var firstIn = host.getMidiInPort(0);
    
    firstIn.setMidiCallback(onMidi);
    firstIn.setSysexCallback(onSysex)

    // since we're using the nano note messages for clip launching we don't
    // need them for note inputs
    //var noteInput = firstIn.createNoteInput("");
    //noteInput.setShouldConsumeEvents(false);  

    var config = new Config();

    // we support 8 tracks with 8 scenes
    mainTrackBank = host.createMainTrackBank(config.NUM_TRACKS, 0, config.NUM_SCENES_PER_TRACK);

    nanoPAD2 = new NanoPAD2(host, mainTrackBank, log, config);

    log("init done.");
}

function onMidi(status, data1, data2) {
    log("onMidi(status=" + status + ", data1=" + data1 + ", data2=" + data2 + ")");
    
    nanoPAD2.handleMidi(status, data1, data2);

   
}


function onSysex(data) {
    log("data=" + data);
    // only the scene select button appears to generate sysex messages
    // so we use this to track the currently selected scene on the nano
    nanoPAD2.handleSceneSelect(data);
}

function exit() {
    log("exit.");
}

function log(msg) {
    if (enableDebugLogging) {
        println(msg);
    }
}