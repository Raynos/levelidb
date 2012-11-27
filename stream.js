var ReadStream = require("read-stream")
    , EndStream = require("end-stream")
    , extend = require("xtend")
    , getOptions = require("./utils/getOptions")
    , toKeyBuffer = require("level-encoding/toKeyBuffer")
    , makeStreamData = require("level-encoding/makeStreamData")

module.exports = Streams

function Streams(onReady, db, defaults) {
    return {
        readStream: readStream
        , writeStream: writeStream
        , keyStream: keyStream
        , valueStream: valueStream
    }

    function readStream(options) {
        options = getOptions(defaults, options)
        var start = options.start
            , end = options.end
            , range = null
            , queue = ReadStream()
            , stream = queue.stream

        onReady(_open)

        return stream

        function _open(idb) {
            if (start || end) {
                range = idb.makeKeyRange({
                    lower: toKeyBuffer(start, options)
                    , upper: toKeyBuffer(end, options)
                })
            }

            idb.iterate(function onItem(value) {
                queue.push(makeStreamData(value, options))
            }, extend({
                keyRange: range
                , order: options.reverse ? "DESC" : "ASC"
                , onEnd: queue.end
                , onError: emit
            }, options))
        }
    }

    function writeStream(options) {
        options = options || {}

        return EndStream(function write(chunk, callback) {
            db.put(chunk.key, chunk.value, options, callback)
        })
    }

    function keyStream(options) {
        return readStream(extend(options || {}, {
            keys: true
            , values: false
        }))
    }

    function valueStream(options) {
        return readStream(extend(options || {}, {
            keys: false
            , values: true
        }))
    }

    function emit(err) {
        db.emit("error", err)
    }
}
