var toBuffer = require("./toBuffer")

module.exports = toValueBuffer

function toValueBuffer(value, options) {
    return toBuffer(value
        , options.valueEncoding || options.encoding)
}
