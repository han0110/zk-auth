include "../../../node_modules/circomlib/circuits/comparators.circom";
include "../../../node_modules/circomlib/circuits/mux2.circom";
include "./log2.circom";

template Splicer(INPUT_LEN) {
    var OUTPUT_LEN = INPUT_LEN + 1;

    signal input in[INPUT_LEN];
    signal input item;
    signal input index;
    signal output out[OUTPUT_LEN];

    component mux2[OUTPUT_LEN];
    component lt[OUTPUT_LEN];
    component eq[OUTPUT_LEN];
    for (var i = 0; i < OUTPUT_LEN; i++) {
        mux2[i] = Mux2();
        lt[i] = LessThan(log2_ceil(INPUT_LEN + 1));
        eq[i] = IsEqual();
        lt[i].in[0] <== i;
        lt[i].in[1] <== index;
        eq[i].in[0] <== i;
        eq[i].in[1] <== index;

        // s will be one of
        // - [0, 0] -> i > index -> select c[0] (in[i-1])
        // - [1, 0] -> i < index -> select c[1] (in[i])
        // - [0, 1] -> i = index -> select c[2] (item)
        mux2[i].s[0] <== lt[i].out;
        mux2[i].s[1] <== eq[i].out;
        mux2[i].c[0] <== i == 0         ? 0 : in[i - 1]; // 0 never greater than index
        mux2[i].c[1] <== i == INPUT_LEN ? 0 : in[i];     // fill with 0 if index greater than INPUT_LEN
        mux2[i].c[2] <== item;
        mux2[i].c[3] <== 0; // unreacheable

        out[i] <== mux2[i].out;
    }
}
