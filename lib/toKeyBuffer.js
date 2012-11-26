var toBuffer = require("./toBuffer")

module.exports = toKeyBuffer

function toKeyBuffer(key, options) {
    return toBuffer(key, options.keyEncoding || options.encoding)
}

