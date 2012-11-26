module.exports = toBuffer

function toBuffer(data, encoding) {
    if (encoding === "json") {
        data = JSON.stringify(data)
    } else if (data !== undefined && data !== null) {
        data = String(data)
    }

    return data
}
