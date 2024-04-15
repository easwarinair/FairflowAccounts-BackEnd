function removeBigInts(arr) {
    return arr.filter(element => typeof element !== 'bigint');
}

module.exports = {removeBigInts}