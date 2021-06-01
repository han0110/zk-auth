template BabyMul8() {
    signal input x;
    signal input y;
    signal output xout;
    signal output yout;

    component dbl1 = BabyDbl();
    dbl1.x <== x;
    dbl1.y <== y;
    component dbl2 = BabyDbl();
    dbl2.x <== dbl1.xout;
    dbl2.y <== dbl1.yout;
    component dbl3 = BabyDbl();
    dbl3.x <== dbl2.xout;
    dbl3.y <== dbl2.yout;

    xout <== dbl3.xout;
    yout <== dbl3.yout;
}
