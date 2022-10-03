const main = async () => {
  // const NFTFactory = await ethers.getContractFactory("NFT");
  // const NFTContract = await NFTFactory.deploy();

  // await NFTContract.deployed();

  // console.log("NFT address: ", NFTContract.address);

  const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
  const MarketplaceContract = await MarketplaceFactory.deploy(1);

  await MarketplaceContract.deployed();

  console.log("Marketplace address: ", MarketplaceContract.address);
};


function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();