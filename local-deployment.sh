set -o allexport
source .env
set +o allexport

# get funds from native hh test addresses
npx hardhat --network external impersonate-and-fund --decimal 1000000000 --to $TEST_ADDRESS \
&& npx hardhat --network external impersonate-and-fund --decimal 100000000 --impersonate no --to $DEPLOY_ADDRESS --token 0x0000000000000000000000000000000000000000 \
&& npx hardhat --network external impersonate-and-fund --decimal 100000000 --impersonate no --to $TEST_ADDRESS --token 0x0000000000000000000000000000000000000000 \
&& MNEMONIC=$DEPLOY_MNEMONIC npx hardhat --network external deploy
