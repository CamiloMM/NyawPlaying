var $ = require('jquery');

$(function() {
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
                playback.percent = p.length ? +(p.position / p.length * 100).toFixed(2) : 0;
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
});

// Converts seconds to M:SS format
function asTime(seconds) {
    seconds = Math.floor(seconds);
    var min = Math.floor(seconds / 60);
    var sec = seconds % 60
    return min + ':' + (sec < 10 ? '0' + sec : sec);
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
