// All browsers except Internet Explorer, fuck him http://caniuse.com/#feat=eventsource

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
            callback(event, null);
        }
    }

    connect(function(err, playback) {
        if (err) return console.error(err);
        if (!playback) { console.log('open'); return $('#info').text('Waiting...'); }
        $('#info').text(JSON.stringify(playback));
    });
});
