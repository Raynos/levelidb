var toEncoding = require("./toEncoding")

module.exports = toKeyEncoding

function toKeyEncoding(data, options) {
    return toEncoding(data && data.id
        , options.keyEncoding || options.encoding)
}
