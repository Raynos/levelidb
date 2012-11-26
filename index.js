var IDBWrapper = require("idb-wrapper")
    , extend = require("xtend")
    , mapAsync = require("map-async")
    , EventEmitter = require("events").EventEmitter
    , ReadStream = require("read-stream")
    , EndStream = require("end-stream")
    , encoding = require("./lib/encoding")
    , makeStreamData = encoding.makeStreamData
    , toKeyBuffer = encoding.toKeyBuffer
    , toValueBuffer = encoding.toValueBuffer
    , toKeyEncoding = encoding.toKeyEncoding
    , toValueEncoding = encoding.toValueEncoding

    , defaultOptions = {
        encoding: 'utf8'
        , keys: true
        , values: true
    }

module.exports = idbup

function idbup(path, defaults, callback) {
    var db = extend(new EventEmitter(), {
            put: onOpen(put)
            , del: onOpen(del)
            , get: onOpen(get)
            , batch: onOpen(batch)
            , readStream: readStream
            , writeStream: writeStream
            , keyStream: keyStream
            , valueStream: valueStream
            , open: open
            , close: close
            , isOpen: isOpen
            , isClosed: isClosed
        })
        , idb
        , status = "new"

    if (typeof defaults === "function") {
        callback = defaults
        defaults = {}
    }

    defaults = extend({}, defaultOptions, defaults || {})

    open(callback)

    return db

    function put(key, value, options, callback) {
        callback = getCallback(options, callback)
        options = getOptions(options, callback)
        var _key = toKeyBuffer(key, options)
            , _value = toValueBuffer(value, options)

        idb.put({
            value: _value
            , id: _key
        }, function () {
            db.emit("put", key, value)
            callback && callback(null)
        }, callback || emit)
    }

    function del(key, options, callback) {
        callback = getCallback(options, callback)
        options = getOptions(options, callback)
        var _key = toKeyBuffer(key, options)

        idb.remove(_key, function () {
            db.emit("del", key)
            callback && callback(null)
        }, callback || emit)
    }

    function get(key, options, callback) {
        callback = getCallback(options, callback)
        options = getOptions(options, callback)
        key = toKeyBuffer(key, options)

        idb.get(key, function (result) {
            callback && callback(null
                , toValueEncoding(result, options), key)
        }, callback || emit)
    }

    function batch(arr, options, callback) {
        callback = getCallback(options, callback)
        options = getOptions(options, callback)

        mapAsync(arr, function (record, callback) {
            if (record.type === "put") {
                put(record.key, record.value
                    , options, callback)
            } else if (record.type === "del") {
                del(record.key, options, callback)
            }
        }, function (err) {
            if (err) {
                if (callback) {
                    return callback(err)
                }

                return db.emit("error", err)
            }

            db.emit("batch", arr)
            callback && callback()
        })
    }

    function readStream(options) {
        options = getOptions(options)
        var start = options.start
            , end = options.end
            , range = null

        var queue = ReadStream()
            , stream = queue.stream

        onReady(_open)

        return stream

        function _open() {
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

    function open(callback) {
        if (status === "opening") {
            db.on("ready", callback)
        } else if (status === "opened") {
            close(_open)
        } else {
            _open()
        }

        function _open(err) {
            if (err) {
                return callback(err)
            }

            status = "opening"

            idb = new IDBWrapper(extend({
                storeName: path
            }, defaults), function () {
                status = "opened"
                callback && callback(null, db)
                db.emit("ready")
            })
        }
    }

    function close(callback) {
        if (status === "opened") {
            _close()
        } else if (status === "opening") {
            db.on("ready", _close)
        } else if (status === "closed") {
            callback && callback()
        } else if (status === "new") {
            var err = new Error("cannot close unopened db")
            if (callback) {
                return callback(err)
            }
            db.emit("error", err)
        }

        function _close() {
            idb.db.close()
            idb = null
            status = "closed"
            db.emit("closed")
            callback && callback()
        }
    }

    function isOpen() {
        return status === "opened"
    }

    function isClosed() {
        return status === "closed"
    }

    function getOptions(options) {
        if (typeof options === "string") {
            options = { encoding: options }
        }
        return extend({}, defaults, options || {})
    }

    function emit(err) {
        db.emit("error", err)
    }

    function onReady(callback) {
        if (status === "opened") {
            callback()
        } else {
            db.on("ready", callback)
        }
    }

    function onOpen(operation) {
        return function opened() {
            var args = arguments

            onReady(function () {
                operation.apply(null, args)
            })
        }
    }
}

function getCallback(options, callback) {
    if (typeof options === "function") {
        return options
    }
    return callback
}
