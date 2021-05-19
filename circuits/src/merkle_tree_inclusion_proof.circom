include "./util/splicer.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom"

template MerkleTreeInclusionProof(WIDTH, DEPTH) {
    signal input element;
    signal input branch_index[DEPTH];
    signal input siblings[DEPTH][WIDTH - 1];
    signal output root;

    component splicers[DEPTH];
    component hashers[DEPTH];

    for (var i = 0; i < DEPTH; i++) {
        splicers[i] = Splicer(WIDTH - 1);
        hashers[i] = Poseidon(WIDTH);

        splicers[i].item <== i == 0 ? element : hashers[i - 1].out;
        splicers[i].index <== branch_index[i];
        for (var j = 0; j < WIDTH - 1; j++) {
            splicers[i].in[j] <== siblings[i][j];
        }
        for (var j = 0; j < WIDTH; j++) {
            hashers[i].inputs[j] <== splicers[i].out[j];
        }
    }

    root <== hashers[DEPTH - 1].out;
}
