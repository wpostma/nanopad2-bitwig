/*

This is Warren Postma's attempted 2022 rework of Factotumo's nanopad2 script.

THis is the main script.

*/

loadAPI(1);

load("NanoPAD2.consts.js");
load("NanoPAD2.object.js");

host.defineController(
    "Korg", "nanoPAD2 2022",
    "1.0", "de945665-7dd6-4615-8294-fc06e4a02c0b"
);

host.defineMidiPorts(1,0);

// set to 1 to enable console logging
var enableDebugLogging = 1;
var launcher=1; 

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
    
    nanoPAD2.updateMode(status, data1, data2);

    // we use note on messages from the nanoPAD2 to control clip launching
    if (status == 0x90) {
        nanoPAD2.updateLastNotePlayed(data1);
        var noteMapping = nanoPAD2.gridLocationForNote(data1);
        log("note number " + data1 + " ON: grid location: row="
            + noteMapping.r + ", col=" + noteMapping.c);
        
        if (launcher) {
            var trackClip = nanoPAD2.playstateForTrack(noteMapping.r);
            if (trackClip == -1) {
                log("launching clip on track " + noteMapping.r + ", clip " + noteMapping.c);
                handlePlay(noteMapping.r, noteMapping.c);
            } else {
                // this track is already playing a clip.  stop playing if the pad pressed matches
                // the playing clip otherwise launch a new clip on the track.
                if (trackClip == noteMapping.c) {
                    log("stopping track " + noteMapping.r + ", clip " + noteMapping.c);
                    handleStop(noteMapping.r, noteMapping.c);
                } else {
                    log("track " + noteMapping.r + " already playing clip " + trackClip
                        + ", launching new clip " + noteMapping.c);
                    handlePlay(noteMapping.r, noteMapping.c);
                }
            }
        }
    }
}


function handlePlay(row, column) {
    if (nanoPAD2.isClipMode()) {
        mainTrackBank.getChannel(row).getClipLauncherSlots().launch(column);
    } else {
        // in scene mode the 1st row (top row in scene 1 on nano) controls scenes in Bitwig
        if (row == 0) {
            log("in scene mode and row 0, launching scene " + column);
            mainTrackBank.launchScene(column);
        } else {
            mainTrackBank.getChannel(row).getClipLauncherSlots().launch(column);
        }
    }
}

function handleStop(row, column) {
    if (nanoPAD2.isClipMode()) {
        mainTrackBank.getChannel(row).getClipLauncherSlots().stop();
    } else {
        // in scene mode the 1st row (top row in scene 1 on nano) controls scenes in Bitwig
        if (row == 0) {
            log("in scene mode and row 0, stopping all clips in scene " + column);
            // in scene mode for a stop we need to stop playback on all channels
            for (var i = 0; i < nanoPAD2.config.NUM_TRACKS; i++) {
                if (nanoPAD2.trackClipHasContent(i, column)) {
                    log("clip " + column + " in track " + i + " has content so stopping");
                    mainTrackBank.getChannel(i).getClipLauncherSlots().stop();
                } else {
                    log("clip " + column + " in track " + i + " doesn't have content so not stopping");
                }
            }
        } else {
            mainTrackBank.getChannel(row).getClipLauncherSlots().stop();
        }
    }   
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