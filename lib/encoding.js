module.exports = {
    makeStreamData: makeStreamData
    , toKeyBuffer: toKeyBuffer
    , toValueBuffer: toValueBuffer
    , toKeyEncoding: toKeyEncoding
    , toValueEncoding: toValueEncoding
}

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

function toBuffer(data, encoding) {
    if (encoding === "json") {
        data = JSON.stringify(data)
    } else if (data !== undefined && data !== null) {
        data = String(data)
    }

    return data
}

function toKeyBuffer(key, options) {
    return toBuffer(key, options.keyEncoding || options.encoding)
}

function toValueBuffer(value, options) {
    return toBuffer(value
        , options.valueEncoding || options.encoding)
}

function toEncoding(value, encoding) {
    if (encoding === "json" && typeof value === "string") {
        return JSON.parse(value)
    }

    return value
}

function toKeyEncoding(data, options) {
    return toEncoding(data && data.id
        , options.keyEncoding || options.encoding)
}

function toValueEncoding(data, options) {
    return toEncoding(data && data.value
        , options.valueEncoding || options.encoding)
}
