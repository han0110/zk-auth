include "./util/splicer.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom"

template MerkleTreeInclusionProof(WIDTH, DEPTH) {
    signal input leaf;
    signal input leaf_indexes[DEPTH];
    signal input leaf_neighbors[DEPTH][WIDTH - 1];
    signal output root;

    component splicers[DEPTH];
    component hashers[DEPTH];

    for (var i = 0; i < DEPTH; i++) {
        splicers[i] = Splicer(WIDTH - 1);
        hashers[i] = Poseidon(WIDTH);

        splicers[i].item <== i == 0 ? leaf : hashers[i - 1].out;
        splicers[i].index <== leaf_indexes[i];
        for (var j = 0; j < WIDTH - 1; j++) {
            splicers[i].in[j] <== leaf_neighbors[i][j];
        }
        for (var j = 0; j < WIDTH; j++) {
            hashers[i].inputs[j] <== splicers[i].out[j];
        }
    }

    root <== hashers[DEPTH - 1].out;
}
