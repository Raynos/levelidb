var toEncoding = require("./toEncoding")

module.exports = toValueEncoding

function toValueEncoding(data, options) {
    return toEncoding(data && data.value
        , options.valueEncoding || options.encoding)
}
