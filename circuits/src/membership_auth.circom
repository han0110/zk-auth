include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/babyjub.circom";
include "../../node_modules/circomlib/circuits/pedersen.circom";
include "../../node_modules/circomlib/circuits/eddsamimcsponge.circom";
include "../../node_modules/circomlib/circuits/sha256/sha256.circom";
include "./util/baby_mul_8.circom"
include "./util/log2.circom";
include "./merkle_tree_inclusion_proof.circom";

template CalculateIdentityCommitment(IDENTITY_PK_SIZE_IN_BITS, NULLIFIER_TRAPDOOR_SIZE_IN_BITS) {
    signal input identity_pk[IDENTITY_PK_SIZE_IN_BITS];
    signal input identity_nullifier[NULLIFIER_TRAPDOOR_SIZE_IN_BITS];
    signal input identity_trapdoor[NULLIFIER_TRAPDOOR_SIZE_IN_BITS];

    signal output out;

    // identity commitment is a pedersen hash of (identity_pk, identity_nullifier, identity_trapdoor), each element padded up to 256 bits
    component identity_commitment = Pedersen(3 * 256);
    for (var i = 0; i < 256; i++) {
        if (i < IDENTITY_PK_SIZE_IN_BITS) {
            identity_commitment.in[i] <== identity_pk[i];
        } else {
            identity_commitment.in[i] <== 0;
        }

        if (i < NULLIFIER_TRAPDOOR_SIZE_IN_BITS) {
            identity_commitment.in[i + 256] <== identity_nullifier[i];
            identity_commitment.in[i + 2 * 256] <== identity_trapdoor[i];
        } else {
            identity_commitment.in[i + 256] <== 0;
            identity_commitment.in[i + 2 * 256] <== 0;
        }
    }

    out <== identity_commitment.out[0];
}

template CalculateNullifier(NULLIFIER_TRAPDOOR_SIZE_IN_BITS, CHALLENGE_SIZE_IN_BITS, WIDTH, DEPTH) {
    signal input challenge;
    signal input identity_nullifier[NULLIFIER_TRAPDOOR_SIZE_IN_BITS];
    signal input identity_branch_index[DEPTH];

    signal output nullifiers_hash;

    component challenge_bits = Num2Bits(CHALLENGE_SIZE_IN_BITS);
    challenge_bits.in <== challenge;

    var PATH_INDEX_SIZE_IN_BIT = log2Ceil(WIDTH)
    var PATH_SIZE_IN_BITS = PATH_INDEX_SIZE_IN_BIT * DEPTH;
    var NULLIFIERS_HASHER_BITS = NULLIFIER_TRAPDOOR_SIZE_IN_BITS + CHALLENGE_SIZE_IN_BITS + PATH_SIZE_IN_BITS;
    if (NULLIFIERS_HASHER_BITS < 512) {
        NULLIFIERS_HASHER_BITS = 512;
    }
    assert(NULLIFIERS_HASHER_BITS <= 512);

    component nullifiers_hasher = Sha256(NULLIFIERS_HASHER_BITS);
    for (var i = 0; i < NULLIFIER_TRAPDOOR_SIZE_IN_BITS; i++) {
        nullifiers_hasher.in[i] <== identity_nullifier[i];
    }

    for (var i = 0; i < CHALLENGE_SIZE_IN_BITS; i++) {
        nullifiers_hasher.in[NULLIFIER_TRAPDOOR_SIZE_IN_BITS + i] <== challenge_bits.out[i];
    }

    component index_bits[DEPTH];
    for (var i = 0; i < DEPTH; i++) {
        index_bits[i] = Num2Bits(PATH_INDEX_SIZE_IN_BIT);
        index_bits[i].in <== identity_branch_index[i]
        for (var j = 0; j < PATH_INDEX_SIZE_IN_BIT; j++) {
            nullifiers_hasher.in[NULLIFIER_TRAPDOOR_SIZE_IN_BITS + CHALLENGE_SIZE_IN_BITS + i * PATH_INDEX_SIZE_IN_BIT + j] <== index_bits[i].out[j];
        }
    }

    for (var i = (NULLIFIER_TRAPDOOR_SIZE_IN_BITS + CHALLENGE_SIZE_IN_BITS + PATH_SIZE_IN_BITS); i < NULLIFIERS_HASHER_BITS; i++) {
        nullifiers_hasher.in[i] <== 0;
    }

    component nullifiers_hash_num = Bits2Num(253);
    for (var i = 0; i < 253; i++) {
        nullifiers_hash_num.in[i] <== nullifiers_hasher.out[i];
    }

    nullifiers_hash <== nullifiers_hash_num.out;
}

template MembershipAuth(WIDTH, DEPTH) {
    // challenge
    signal input challenge;

    // identity
    signal private input identity_pk[2];
    signal private input identity_nullifier;
    signal private input identity_trapdoor;

    // identity merkle tree inclusion proof
    signal private input identity_branch_index[DEPTH];
    signal private input identity_siblings[DEPTH][WIDTH - 1];

    // signature on challenge with identity_pk
    signal private input auth_sig_r[2];
    signal private input auth_sig_s;

    // merkle tree root
    signal output root;

    // sha256(identity_nullifier || challenge)
    signal output nullifiers_hash;

    // constants
    var IDENTITY_PK_SIZE_IN_BITS = 254;
    var NULLIFIER_TRAPDOOR_SIZE_IN_BITS = 248;
    var CHALLENGE_SIZE_IN_BITS = 232;

    // baby check identity_pk
    component verify_identity_pk_on_curve = BabyCheck();
    verify_identity_pk_on_curve.x <== identity_pk[0];
    verify_identity_pk_on_curve.y <== identity_pk[1];

    // baby check auth_sig_r
    component verify_auth_sig_r_on_curve = BabyCheck();
    verify_auth_sig_r_on_curve.x <== auth_sig_r[0];
    verify_auth_sig_r_on_curve.y <== auth_sig_r[1];

    // mulitply 8 becasue signature scheme does
    component baby_mul_8 = BabyMul8();
    baby_mul_8.x <== identity_pk[0];
    baby_mul_8.y <== identity_pk[1];

    // num to bits
    component identity_nullifier_bits = Num2Bits(NULLIFIER_TRAPDOOR_SIZE_IN_BITS);
    identity_nullifier_bits.in <== identity_nullifier;
    component identity_trapdoor_bits = Num2Bits(NULLIFIER_TRAPDOOR_SIZE_IN_BITS);
    identity_trapdoor_bits.in <== identity_trapdoor;
    component identity_pk_x_bits = Num2Bits_strict();
    identity_pk_x_bits.in <== baby_mul_8.xout;

    // calculate identity commitment
    component identity_commitment = CalculateIdentityCommitment(IDENTITY_PK_SIZE_IN_BITS, NULLIFIER_TRAPDOOR_SIZE_IN_BITS);
    for (var i = 0; i < IDENTITY_PK_SIZE_IN_BITS; i++) {
        identity_commitment.identity_pk[i] <== identity_pk_x_bits.out[i];
    }
    for (var i = 0; i < NULLIFIER_TRAPDOOR_SIZE_IN_BITS; i++) {
        identity_commitment.identity_nullifier[i] <== identity_nullifier_bits.out[i];
        identity_commitment.identity_trapdoor[i] <== identity_trapdoor_bits.out[i];
    }

    // calculate merkle tree root
    component tree = MerkleTreeInclusionProof(WIDTH, DEPTH);
    tree.element <== identity_commitment.out;
    for (var i = 0; i < DEPTH; i++) {
        tree.branch_index[i] <== identity_branch_index[i];
        for (var j = 0; j < WIDTH - 1; j++) {
            tree.siblings[i][j] <== identity_siblings[i][j];
        }
    }
    root <== tree.root;

    // calculate nullifiers
    component nullifiers_hasher = CalculateNullifier(NULLIFIER_TRAPDOOR_SIZE_IN_BITS, CHALLENGE_SIZE_IN_BITS, WIDTH, DEPTH);
    nullifiers_hasher.challenge <== challenge;
    for (var i = 0; i < NULLIFIER_TRAPDOOR_SIZE_IN_BITS; i++) {
        nullifiers_hasher.identity_nullifier[i] <== identity_nullifier_bits.out[i];
    }
    for (var i = 0; i < DEPTH; i++) {
        nullifiers_hasher.identity_branch_index[i] <== identity_branch_index[i];
    }
    nullifiers_hash <== nullifiers_hasher.nullifiers_hash;

    // verify signature
    component sig_verifier = EdDSAMiMCSpongeVerifier();
    sig_verifier.enabled <== 1;
    sig_verifier.Ax <== identity_pk[0];
    sig_verifier.Ay <== identity_pk[1];
    sig_verifier.R8x <== auth_sig_r[0];
    sig_verifier.R8y <== auth_sig_r[1];
    sig_verifier.S <== auth_sig_s;
    sig_verifier.M <== challenge;
}
