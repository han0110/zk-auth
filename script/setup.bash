#!/bin/bash

main() {
  R1CS_PATH="./circuits/build/membership_auth_2_20.r1cs"
  [[ ! -f $R1CS_PATH ]] && echo "please run \`yarn build\` first" && exit 1

  KEY_DIR="./key"
  [[ ! -d $KEY_DIR ]] && mkdir $KEY_DIR

  node -e "
    require('./packages/circuit-util/lib/setup.js')
      .default('$R1CS_PATH', '$KEY_DIR')
      .then(() => process.exit(0))
      .catch(console.error)
  "
}

main
