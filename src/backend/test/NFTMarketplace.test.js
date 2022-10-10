//A Provider in ethers is a read-only abstraction to access the blockchain data.
//Nested arrays inside structs are not included in the generated ABI

const { expect } = require("chai"); 

const toWei = (num) => ethers.utils.parseEther(num.toString()) // eth -> wei 
  //    Parse the etherString representation of ether into a BigNumber instance of the amount of wei 1eth = 1.000.000.000 wei
const fromWei = (num) => ethers.utils.formatEther(num)  // wei -> eth

describe("NFTMarketplace", function () {

  let NFT;
  let nft;
  let Marketplace;
  let marketplace
  let deployer;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addrs;
  let URI = "sample URI"

  beforeEach(async function () {  //beforeEach()được chạy trước mỗi thử nghiệm trong một describe
    // Get the ContractFactories and Signers here.
    NFT = await ethers.getContractFactory("NFT");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [deployer, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners(); //return an array with 20 signers

    // To deploy our contracts
    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy();
  });

  describe("Deployment", function () {

    it("Should track name and symbol of the nft collection", async function () {
      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      const nftName = "DApp NFT"
      const nftSymbol = "DAPP"
      expect(await nft.name()).to.equal(nftName);
      expect(await nft.symbol()).to.equal(nftSymbol);
    });

    // it("Should track feeAccount and feePercent of the marketplace", async function () {
    //   expect(await marketplace.feeAccount()).to.equal(deployer.address);
    //   expect(await marketplace.feePercent()).to.equal(feePercent);
    // });
  });

  describe("Minting NFTs", function () {

    it("Should track each minted NFT", async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);
      // addr2 mints an nft
      await nft.connect(addr2).mint(URI)
      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  })  

  describe("Making marketplace items", function () { 
    let startPrice = 1
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
    })


    it("Should track newly created item, transfer NFT from seller to marketplace and emit Offered event", async function () {
      // addr1 offers their nft at a price of 1 ether
      await expect(marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(startPrice)))
        .to.emit(marketplace, "Offered")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(startPrice),
          addr1.address,
          false,
          false,
          0,
          0
        )
      // Owner of NFT should now be the marketplace
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      // Item count should now equal 1
      expect(await marketplace.itemCount()).to.equal(1)
      // Get item from items mapping then check fields to ensure they are correct
      const item = await marketplace.items(1)
      expect(item.itemId).to.equal(1)
      expect(item.nft).to.equal(nft.address)
      expect(item.tokenId).to.equal(1)
      expect(item.startPrice).to.equal(toWei(startPrice))
      expect(item.isSold).to.equal(false)
    });

    it("Should fail if price is set to zero", async function () {
      await expect(
        marketplace.connect(addr1).makeItem(nft.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });

  });

  describe("Start auction", function () { 
    let startPrice = 1
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
      expect(await marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(startPrice)))
    })


    it("Should start auction", async function () {

      await expect (marketplace.connect(addr1).startAuction(1, 1000)).to.emit(marketplace, "StartAuction").withArgs(true);
      const item = await marketplace.items(1)
      expect(item.isStarted).to.equal(true)
    });
  })


  describe("Bid item", function () {
    let price = 1
 
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend tokens
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
      // addr1 makes their nft a marketplace item.
      await marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(price))
      await marketplace.connect(addr1).startAuction(1, 100000);      
    })
    it("Should update highest bidder as address 4 and highest bid as toWei(4)", async function() {
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.emit(marketplace, "Bid").withArgs(1, addr2.address, toWei(2));
      await expect(marketplace.connect(addr3).bid(1, {value: toWei(3)})).to.emit(marketplace, "Bid").withArgs(1, addr3.address, toWei(3));
      await expect(marketplace.connect(addr4).bid(1, {value: toWei(4)})).to.emit(marketplace, "Bid").withArgs(1, addr4.address, toWei(4));
      const item = await marketplace.items(1)
      expect(+fromWei(item.highestBid)).to.equal(4)
      expect(item.highestBidder).to.equal(addr4.address)
    })

    it("Should re-update highest bidder as address 2 and highest bid as toWei(5)", async function() {
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.emit(marketplace, "Bid").withArgs(1, addr2.address, toWei(2));
      await expect(marketplace.connect(addr3).bid(1, {value: toWei(3)})).to.emit(marketplace, "Bid").withArgs(1, addr3.address, toWei(3));
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(5)})).to.emit(marketplace, "Bid").withArgs(1, addr2.address, toWei(5));
      const item = await marketplace.items(1)
      expect(+fromWei(item.highestBid)).to.equal(5)
      expect(item.highestBidder).to.equal(addr2.address)
    })

    it("Should not update addr2 as highest bidder and check balance of addr2", async function() {
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.emit(marketplace, "Bid").withArgs(1, addr2.address, toWei(2));
      const addr2Balance1 = await addr2.getBalance()
      await expect(marketplace.connect(addr3).bid(1, {value: toWei(5)})).to.emit(marketplace, "Bid").withArgs(1, addr3.address, toWei(5));
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.be.revertedWith("not enough eth to bid");
      const addr2Balance2 = await addr2.getBalance()
      const item = await marketplace.items(1)
      expect(+fromWei(item.highestBid)).to.equal(5)
      expect(item.highestBidder).to.equal(addr3.address)
      expect(await marketplace.getBid(1, addr2.address)).to.equal(toWei(2))
      expect((+fromWei(addr2Balance1)).toFixed(1)).to.equal((+fromWei(addr2Balance2)).toFixed(1))
    })

    it("Should fail if add3 bid lower than addr2", async function() {
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.emit(marketplace, "Bid").withArgs(1, addr2.address, toWei(2));
      await expect(marketplace.connect(addr3).bid(1, {value: toWei(1)})).to.be.revertedWith("not enough eth to bid");
    })

    it("Should update addr2 and addr3 in bids mapping and bidder address", async function() {
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.emit(marketplace, "Bid").withArgs(1, addr2.address, toWei(2));
      await expect(marketplace.connect(addr3).bid(1, {value: toWei(3)})).to.emit(marketplace, "Bid").withArgs(1, addr3.address, toWei(3));
      await expect(marketplace.connect(addr4).bid(1, {value: toWei(4)})).to.emit(marketplace, "Bid").withArgs(1, addr4.address, toWei(4));

      expect(await marketplace.getBid(1, addr2.address)).to.equal(toWei(2))
      expect(await marketplace.getBidderAddress(1, 0)).to.equal(addr2.address)
      expect(await marketplace.getBid(1, addr3.address)).to.equal(toWei(3))
      expect(await marketplace.getBidderAddress(1, 1)).to.equal(addr3.address)
    })

    it("Should not bid if aution not start", async function() {
      await marketplace.connect(addr1).stopAuction(1);      
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.be.revertedWith("not started");
    })

    it("Should not bid if aution timeout", async function() {
      await marketplace.connect(addr1).startAuction(1, 1);    //time out in 1 sec  
      await expect(marketplace.connect(addr2).bid(1, {value: toWei(2)})).to.be.revertedWith("auction ended");
    })
  });

  describe("End Auction", function() {

    let price = 1
 
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend tokens
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
      // addr1 makes their nft a marketplace item.
      await marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(price))
      await marketplace.connect(addr1).startAuction(1, 100000);      
    })

    // it("Should require auction start", async function() {
    //   await expect(marketplace.end(1)).to.be.revertedWith("not ended");
    // })
    
    it("Should transform NFT to highest bidder and trans ETH to seller", async function() {
      const sellerInitalEthBal = await addr1.getBalance()
      await marketplace.connect(addr2).bid(1, {value: toWei(2)});
      await marketplace.endAuction(1); 
      
      const sellerFinalEthBal = await addr1.getBalance()
      const item = await marketplace.items(1)
      expect(await nft.ownerOf(1)).to.equal(addr2.address) // trans nft to highest bidder
      expect(+fromWei(item.highestBid)+ +fromWei(sellerInitalEthBal)).to.equal(+fromWei(sellerFinalEthBal)) // trans eth to seller
      expect(+fromWei(item.highestBid)).to.equal(2)
    })

    it("Should transform ETH to all bidder", async function() {
      const addr2InitalEthBal = await addr2.getBalance()
      const addr3InitalEthBal = await addr3.getBalance()
      await marketplace.connect(addr2).bid(1, {value: toWei(2)});
      await marketplace.connect(addr3).bid(1, {value: toWei(5)});
      await marketplace.connect(addr4).bid(1, {value: toWei(7)});
      
      await marketplace.endAuction(1); 
      
      const addr2FinalEthBal = await addr2.getBalance()
      const addr3FinalEthBal = await addr3.getBalance()

      const item = await marketplace.items(1)

      expect(await nft.ownerOf(1)).to.equal(addr4.address) // trans nft to highest bidder
      expect((+fromWei(addr2InitalEthBal)).toFixed(2)).to.equal((+fromWei(addr2FinalEthBal)).toFixed(2)) // trans eth back to addr2
      expect((+fromWei(addr3InitalEthBal)).toFixed(2)).to.equal((+fromWei(addr3FinalEthBal)).toFixed(2)) // trans eth back to addr3
    })

  })
})
