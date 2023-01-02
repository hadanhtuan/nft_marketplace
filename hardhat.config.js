require("@nomiclabs/hardhat-waffle");
require('dotenv').config()

module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test"
  },
  networks: {
    goerli: {
      url: process.env.REACT_APP_ALC_URL,
      accounts: [process.env.REACT_APP_ALC_PRI_KEY],
      saveDeployments: true,
      allowUnlimitedContractSize: true
    },
  },
};
