// compute log 2 of (n + 2) (up to 32-bit)
// reference: https://graphics.stanford.edu/~seander/bithacks.html#IntegerLog
function log2(n) {
    var ret;
    var rsh;

    ret = (n > 0xFFFF) << 4; n = n >> ret;
    rsh = (n > 0xFF  ) << 3; n = n >> rsh; ret = ret | rsh;
    rsh = (n > 0xF   ) << 2; n = n >> rsh; ret = ret | rsh;
    rsh = (n > 0x3   ) << 1; n = n >> rsh; ret = ret | rsh;
                                           ret = ret | (n >> 1);

    return ret;
}

function log2Ceil(n) {
    return log2(n) + (n & (n - 1) ? 1 : 0);
}
