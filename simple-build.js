var NwBuilder = require('node-webkit-builder');

// To be honest, I'm not happy enough with node-webkit-builder.
// Its resulting builds aren't fast enough. But it's simple to use.

var nw = new NwBuilder({
    files: [
        'app/**/**',
        'node_modules/**/**',
        'icon.png',
        'package.json'
    ],
    platforms: ['win32'],
    winIco: "icon.ico"
});

console.log('Building started...')

nw.build().then(function () {
    console.log('Build complete successfully.');
}).catch(function (error) {
    console.error(error);
});
