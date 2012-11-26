module.exports = getCallback

function getCallback(options, callback) {
    if (typeof options === "function") {
        return options
    }
    return callback
}
