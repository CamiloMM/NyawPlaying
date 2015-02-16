
function byId(id) { return document.getElementById(id); }
function log(message) { if (console && console.log) console.log(message); }

$(function() {
    var url = 'http://localhost:20402/playlists';
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState >= 2) {
            log('readyState=' + httpRequest.readyState + ", status=" + httpRequest.status);
        } else {
            log('readyState=' + httpRequest.readyState);
        }
        if (httpRequest.readyState == 4) {
            if (httpRequest.status == 0) {
                byId('receive-status').textContent = 'failed';
                byId('parse-status').textContent = 'skipped';
            } else if (httpRequest.status == 200) {
                byId('receive-status').textContent = 'passed';
                byId('receive-message').textContent = httpRequest.responseText;
                
                var data = JSON.parse(httpRequest.responseText);
                byId('parse-status').textContent = 'passed';
                byId('parse-message').textContent = JSON.stringify(data);
                
                var playlists = data.playlists;
                var parent = byId('playlists');
                for (n = 0; n < playlists.length; ++n) {
                    var child = document.createElement('li');
                    var playlist = playlists[n];
                    child.textContent = playlist.name + (playlist.active ? ' [active]' : '') + (playlist.playing ? ' [playing]' : '');
                    parent.appendChild(child);
                }
            }
        }
    };
    httpRequest.open('GET', url, true);
    httpRequest.setRequestHeader('ContentType', 'application/json; charset=utf-8');
    httpRequest.setRequestHeader('Accept', 'application/json; charset=utf-8');
    httpRequest.send();
    byId('send-status').textContent = 'passed';
    
    if (true && typeof(EventSource) !== 'undefined') {
        var eventSource = new EventSource('http://localhost:20402/playlists/events');
        var eventCount = 0;
        eventSource.onopen = function(event) {
            var item = document.createElement('li');
            item.innerHTML = '[open]';
            byId('events').appendChild(item);
            eventCount++;
            if (eventCount > 10) {
                eventSource.close();
            }
        }
        eventSource.onmessage = function(event) {
            var item = document.createElement('li');
            item.innerHTML = '[message] ' + event.type + ':' + event.data;
            byId('events').appendChild(item);
            eventCount++;
            if (eventCount > 10) {
                eventSource.close();
            }
        };
        eventSource.addEventListener('test', function(event) {
            var item = document.createElement('li');
            item.innerHTML = '[test] type = ' + JSON.stringify(event.type) + ', data = ' + JSON.stringify(event.data) + ', lastEventId = ' + event.lastEventId;
            byId('events').appendChild(item);
            eventCount++;
            if (eventCount > 10) {
                eventSource.close();
            }
        });
        eventSource.onerror = function(event) {
            var item = document.createElement('li');
            var readyState = eventSource.readyState;
            item.innerHTML = '[error] ' + ((readyState == 0) ? 'CONNECTING' : ((readyState == 1) ? 'OPEN' : ((readyState == 2) ? 'CLOSED' : readyState)));
            byId('events').appendChild(item);
            eventCount++;
            if (eventCount > 10) {
                eventSource.close();
            }
        }
    }
});

$(function() {
    if (true && typeof(EventSource) !== 'undefined') {
        var eventSource = new EventSource('http://localhost:20402/playback/events');
        eventSource.onopen = function(event) {
            log('onopen');
            byId('playback-state').textContent = 'Waiting for server...';
        }
        eventSource.onmessage = function(event) {
            log('onmessage');
            byId('playback-state').textContent = ''+event.data;
            byId('playback-info').innerHTML = '';
            var data = JSON.parse(event.data);
            var span = document.createElement('span');
            if (data.track != null) {
                var artists = data.track.artist;
                for (var index = 0; index < artists.length; ++index) {
                    var artist = artists[index];
                    if (index > 0) {
                        var fillerSpan = document.createElement('span');
                        fillerSpan.textContent = ', ';
                        span.appendChild(fillerSpan);
                    }
                    var artistSpan = document.createElement('a');
                    artistSpan.href = "";
                    artistSpan.textContent = artist;
                    span.appendChild(artistSpan);
                }
            }
            byId('playback-info').appendChild(span);
        }
        eventSource.onerror = function(event) {
            log('onerror');
            byId('playback-state').textContent = 'Connecting to server...';
        }
    }
});
