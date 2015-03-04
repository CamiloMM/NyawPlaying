var $      = require('jquery');
var NA     = require('nodealytics');
var gui    = require('nw.gui');
var os     = require('os');
var Window = gui.Window.get();

NA.initialize('UA-29694030-4', 'nw-app');

$(function() {
    $('body').attr('data-style', localStorage.style || 'pink');
    trackStartup();
    
    function connect(callback) {
        var eventSource = new EventSource('http://localhost:14420/playback/events');
        eventSource.onopen = function(event) {
            callback(null, null);
        }
        eventSource.onmessage = function(event) {
            var playback = {};
            var json = JSON.parse(event.data);
            playback.started = json.started;
            playback.paused = json.paused;
            if (json.track) {
                var re = /^(.*?)(\.([^.]*))?$/;
                var t = json.track, p = playback.track = {
                    length   : parseFloat(t.seconds),
                    position : parseFloat(t.seek),
                    artist   : t.artist ? t.artist[0] : '',
                    album    : t.album  ?  t.album[0] : '',
                    title    : t.title  ?  t.title[0] : '',
                    filename : t.filename_ext ? t.filename_ext[0].replace(re, '$1') : '',
                    ext      : t.filename_ext ? t.filename_ext[0].replace(re, '$3') : '',
                };
                playback.percent = p.length ? +(p.position/p.length*100).toFixed(2) : 0;
            } else {
                playback.track = null;
                playback.percent = 0;
            }
            callback(null, playback);
        }
        eventSource.onerror = function(event) {
            console.error('There was an error with the EventSource!');
            callback(event, null);
        }
    }

    connect(function(err, playback) {
        if (err) return console.error(err);
        if (!playback) return console.log('open');
        if (playback.track) {
            var track = playback.track;
            var status = playback.paused ? 'paused' : 'playing';
            $('#program').attr('data-status', status);
            $('#title').text(track.title || parseTitle(track.filename));
            $('#artist').text(track.artist || parseArtist(track.filename));
            $('.progress .time').text(asTime(track.position));
            $('#progress-overlay').width(playback.percent + '%');
        } else {
            $('#program').attr('data-status', 'stopped');
            $('#title, #artist, .progress .time').empty();
            $('#progress-overlay').width('0%');
        }
        updateTitles();
    });
    
    // For some reason the window changes size on restore, to an invalid size even.
    var originalWidth = 480;
    Window.on('restore', function() { Window.resizeTo(originalWidth, 48); });
    $(Window.window).resize(function() { originalWidth = Window.width; });

    // Options panel.
    $('#program').on('contextmenu', function(e) {
        e.preventDefault();
        $('#options').css({visibility: 'visible'});
    });

    $('#options .close').click(function() {
        $('#options').css({visibility: 'hidden'});
    });

    $('#styles .style').click(function() {
        var name = $(this).data('option');
        $('body').attr('data-style', name);
        $('#options').css({visibility: 'hidden'});
        localStorage.style = name;
    });
});

// Get a generic user identifier.
function userId(callback) {
    getIp(function(ip) {
        var ver = 'v'+gui.App.manifest.version;
        var sys = os.type()+' '+os.release();
        var ram = (os.totalmem()/1e9).toFixed(1)+'GB';
        var cpu = os.cpus().length+'@'+(os.cpus()[0].speed/1e3).toFixed(1)+'GHz';
        var upt = asTime(os.uptime()); // Not using it.
        var iam = os.hostname()+' ('+ip+')';
        var stl = '"'+(localStorage.style||'default')+'"';
        callback([ver,sys,ram,cpu,iam,stl].join(', '));
    });
} 

// Tracks app startup.
function trackStartup() {
    userId(function(id) {
        NA.trackEvent('Application', 'Startup', id);
    });
}

// Gets remote IP. Will be '0.0.0.0' when offline.
var ipCache = null;
function getIp(callback) {
    if (ipCache) return callback(ipCache);
    require('http').get('http://api.ipify.org/', function(res) {
        res.on('data', function(ip) { callback(ipCache = ip.toString()); });
    }).on('error', function() { callback('0.0.0.0'); });;
}

// Converts seconds to M:SS format, or H:MM:SS format.
function asTime(seconds) {
    seconds = Math.floor(seconds);
    if (seconds >= 3600) {
        // One hour or more.
        var hrs = seconds / 3600 | 0;
        var min = seconds % 3600 / 60 | 0;
        var sec = seconds % 3600 % 60;
        return [hrs, min < 10 ? '0' + min : min, sec < 10 ? '0' + sec : sec].join(':');
    } else {
        var min = seconds / 60 | 0;
        var sec = seconds % 60;
        return min + ':' + (sec < 10 ? '0' + sec : sec);
    }
}

// These two parse the song's title/artist from a filename like
// "[artist] title", "artist - title" or "title" (no artist).
function parseTitle(filename) {
    return filename.replace(/^(\[[^\]]+\]\s*|[^-]+ -\s+)/, '');
}
function parseArtist(filename) {
    return filename.replace(/^(\[([^\]]+)\])?.*$/, '$2') ||
           filename.replace(/^(([^-]+)( - ))?.*$/, '$2');
}

// Updates title attributes.
function updateTitles() {
    $('#title, #artist, .progress .time').each(function() {
        $(this).attr('title', $(this).text());
    })
}
