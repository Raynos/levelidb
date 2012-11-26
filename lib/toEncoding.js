module.exports = toEncoding

function toEncoding(value, encoding) {
    if (encoding === "json" && typeof value === "string") {
        return JSON.parse(value)
    }

    return value
}
