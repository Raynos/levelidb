var toKeyEncoding = require("./toKeyEncoding")
    , toValueEncoding = require("./toValueEncoding")

module.exports = makeStreamData

function makeStreamData(data, options) {
    if (options.keys && options.values) {
        return {
            key: toKeyEncoding(data, options)
            , value: toValueEncoding(data, options)
        }
    } else if (options.keys) {
        return toKeyEncoding(data, options)
    } else if (options.values) {
        return toValueEncoding(data, options)
    } else {
        return null
    }
}
