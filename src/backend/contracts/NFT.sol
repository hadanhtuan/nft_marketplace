// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {  //  https://coin98.net/erc721-la-gi
    uint public tokenCount;
    constructor() ERC721("DApp NFT", "DAPP"){}

    function mint(string memory _tokenURI) external returns(uint) {
        tokenCount ++;
        _safeMint(msg.sender, tokenCount);//Internal function to safely mint a new token
        _setTokenURI(tokenCount, _tokenURI);
        return(tokenCount);
    }
}   