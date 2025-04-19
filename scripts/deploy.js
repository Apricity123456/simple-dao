const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory("YangShangyuToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  console.log(`YangShangyuToken deployed to: ${token.target}`);

  const DAO = await hre.ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(token.target);
  await dao.waitForDeployment();
  console.log(`DAO deployed to: ${dao.target}`);

  const [deployer] = await hre.ethers.getSigners();
  const mintTx = await token.mint(deployer.address, hre.ethers.parseEther("1000"));
  await mintTx.wait();
  console.log(`Minted 1000 GT to ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
