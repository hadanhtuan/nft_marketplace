// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {//A modifier that can prevent reentrancy during certain functions.
    // Variables
    uint256 public itemCount;

    struct Item {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        uint256 startPrice;
        address payable seller;
        bool isSold;
        bool isStarted;
        uint256 endAt;
        address payable highestBidder;
        uint256 highestBid;
        address[] bidderAddress;
        mapping(address => uint256) bids; 
    }

    // itemId -> Item
    mapping(uint256 => Item) public items;


    //https://ethereum.stackexchange.com/questions/40396/can-somebody-please-explain-the-concept-of-event-indexing
    event Offered(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller,
        bool isSold,
        bool isStarted,
        uint256 endAt,
        uint256 highestBid
    );
    event StartAuction(
        bool isStarted
    );
    event Bid(
        uint256 itemId,
        address indexed highestBidder,
        uint highestBid
    );

    // Make item to offer on the marketplace
    function makeItem(IERC721 _nft, uint256 _tokenId, uint256 _startPrice) external nonReentrant {
        require(_startPrice > 0, "Price must be greater than zero");
        // increment itemCount

        // transfer nft  Transfers a specific NFT (tokenId) from one account (from) to another (to).
        _nft.transferFrom(msg.sender, address(this), _tokenId);


        itemCount++;

        Item storage it = items[itemCount];

        it.itemId = itemCount;
        it.nft = _nft;
        it.tokenId = _tokenId;
        it.startPrice = _startPrice;
        it.seller = payable(msg.sender);
        it.isSold = false;
        it.isStarted = false;
        it.endAt = 0;
        it.highestBidder = payable(address(0));
        it.highestBid = 0;


        emit Offered(itemCount, address(_nft), _tokenId, _startPrice, msg.sender, items[itemCount].isSold, items[itemCount].isStarted, items[itemCount].endAt, 
        items[itemCount].highestBid);
    }

    function startAuction(uint _itemId, uint256 _endAt) external nonReentrant {
        items[_itemId].isStarted = true;
        items[_itemId].endAt = block.timestamp + _endAt;

        emit StartAuction(items[_itemId].isStarted);
    }

    function stopAuction(uint _itemId) external nonReentrant {
        items[_itemId].isStarted = false;
    }

    function bid(uint256 _itemId) external payable{
        Item storage item = items[_itemId];

        requir _itemId <=e(!item.isSold, "item already sold");
        require(item.isStarted, "not started");
        require(block.timestamp < item.endAt, "auction ended");
        require(_itemId > 0 && itemCount, "item doesn't exist");
        require( msg.value + item.bids[msg.sender] >= item.highestBid, "not enough eth to bid");   //bug: item.highestBid = 0

        if (item.highestBidder != address(0)) {
            item.bids[item.highestBidder] = item.highestBid;                      
            item.bidderAddress.push(item.highestBidder);
        }

        item.highestBidder = payable(msg.sender);
        item.highestBid = msg.value;

        emit Bid(
            _itemId,
            item.highestBidder,
            item.highestBid
        );
    }

    function getBid(uint _itemId, address addr) public view returns(uint) {
        return items[_itemId].bids[addr];
    }

    function getBidderAddress(uint _itemId, uint index) public view returns(address) {
        return items[_itemId].bidderAddress[index];
    }

    // function withdraw(uint256 _itemId) external nonReentrant {
    //     Item storage item = items[_itemId];

    //     require(item.bids[msg.sender]>0, "already withdraw");

    //     uint256 balance = item.bids[msg.sender];
    //     item.bids[msg.sender] = 0;

    //     payable(msg.sender).transfer(balance);
    //     //emit
    // }

    function endAuction(uint256 _itemId) external nonReentrant {
        Item storage item = items[_itemId];
        // require(item.isStarted, "not started");  //bug logic
        // require(block.timestamp >= item.endAt, "not ended");
       
        if (item.highestBidder != address(0)) {
            item.seller.transfer(item.highestBid);
            // transfer nft to buyer
            item.nft.transferFrom(address(this), item.highestBidder, item.tokenId);
            item.isSold = true;

            for(uint i=0; i<item.bidderAddress.length; i++) {
                address currAddress = item.bidderAddress[i]; 

                if(item.bids[currAddress] > 0) {
                    uint256 balance = item.bids[currAddress];
                    item.bids[currAddress] = 0;
                    payable(currAddress).transfer(balance);
                }
            }
        }

        item.isStarted = false;

        //emit
    }
}
