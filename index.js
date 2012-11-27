var IDBWrapper = require("idb-wrapper")
    , extend = require("xtend")
    , mapAsync = require("map-async")
    , EventEmitter = require("events").EventEmitter
    , toKeyBuffer = require("level-encoding/toKeyBuffer")
    , toValueBuffer = require("level-encoding/toValueBuffer")
    , toValueEncoding = require("level-encoding/toValueEncoding")
    , Streams = require("./stream")
    , getCallback = require("./utils/getCallback")
    , getOptions = require("./utils/getOptions")

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

    extend(db, Streams(onReady, db, defaults))

    open(callback)

    return db

    function put(key, value, options, callback) {
        callback = getCallback(options, callback)
        options = getOptions(defaults, options)
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
        options = getOptions(defaults, options)
        var _key = toKeyBuffer(key, options)

        idb.remove(_key, function () {
            db.emit("del", key)
            callback && callback(null)
        }, callback || emit)
    }

    function get(key, options, callback) {
        callback = getCallback(options, callback)
        options = getOptions(defaults, options)
        key = toKeyBuffer(key, options)

        idb.get(key, function (result) {
            callback && callback(null
                , toValueEncoding(result, options), key)
        }, callback || emit)
    }

    function batch(arr, options, callback) {
        callback = getCallback(options, callback)
        options = getOptions(defaults, options)
        var _arr = arr.map(function (item) {
            var result = {}
                , key = toKeyBuffer(item.key, options)

            if (item.type === "del") {
                result.type = "remove"
            } else if (item.type === "put") {
                result.type = "put"
                result.value = {
                    value: toValueBuffer(item.value, options)
                    , id: key
                }
            }

            result.key = key

            return result
        })

        idbBatch.call(idb, _arr, function () {
            db.emit("batch", arr)
            callback && callback()
        }, callback || emit)
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
                db.emit("ready", idb)
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


    function emit(err) {
        db.emit("error", err)
    }

    function onReady(callback) {
        if (status === "opened") {
            callback(idb)
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

    // IDBWrapper batch implementation inlined.
    // Waiting for pull request
    function idbBatch(arr, onSuccess, onError) {
      onError || (onError = function (error) {
        console.error('Could not apply batch.', error);
      });
      onSuccess = onSuccess || noop;
      var batchTransaction = this.db.transaction(
        [this.storeName] , this.consts.READ_WRITE);
      var count = arr.length;
      var called = false;

      arr.forEach(function (operation) {
        var type = operation.type;
        var key = operation.key;
        var value = operation.value;

        if (type === "remove") {
          var deleteRequest = batchTransaction
            .objectStore(this.storeName).delete(key);
          deleteRequest.onsuccess = function (event) {
            count--;
            if (count === 0 && !called) {
              called = true;
              onSuccess();
            }
          };
          deleteRequest.onerror = function (err) {
            batchTransaction.abort();
            if (!called) {
              called = true;
              onError(err);
            }
          };
        } else if (type === "put") {
          if (typeof value[this.keyPath] === 'undefined' &&
            !this.features.hasAutoIncrement
          ) {
            value[this.keyPath] = this._getUID()
          }
          var putRequest = batchTransaction
            .objectStore(this.storeName).put(value)
          putRequest.onsuccess = function (event) {
            count--;
            if (count === 0 && !called) {
              called = true;
              onSuccess();
            }
          };
          putRequest.onerror = function (err) {
            batchTransaction.abort();
            if (!called) {
              called = true;
              onError(err);
            }
          };
        }
      }, this);
    }

    function noop() {}
}
