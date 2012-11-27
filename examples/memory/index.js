var levelidb = require("../..")
    , uuid = require("node-uuid")

    , BINARY_UNITS= [1024, 'Ki', 'Mi', 'Gi', 'Ti'
        , 'Pi', 'Ei', 'Zi', 'Yo']

var db = levelidb("/tmp/memory-test", {
    createIfMissing: true
    , encoding: "json"
})

var stream = db.writeStream()
    , str = "0"
    , counter = 0
    , total = 0

setInterval(function () {
    str += uuid()
    var length = str.length

    console.log("writing", unitify(str.length))

    for (var i = 0; i < 1000; i++) {
        total += length
        stream.write({
            key: ++counter
            , value: str
        })
    }

    console.log("total", unitify(total))
}, 10)

function unitify(n) {
    for (var i= BINARY_UNITS.length; i-->1;) {
        var unit= Math.pow(BINARY_UNITS[0], i);
        if (n>=unit) {
            return Math.floor(n/unit)+BINARY_UNITS[i];
        }
    }
    return n; // no prefix, single units
}
