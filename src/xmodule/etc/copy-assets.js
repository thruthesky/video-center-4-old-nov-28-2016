var fs = require('fs-extra')

var dependencies = [
    ['src/xmodule/x-assets','www/x-assets']
];

dependencies.forEach(function(value) {
    fs.copy(value[0],value[1]);
});