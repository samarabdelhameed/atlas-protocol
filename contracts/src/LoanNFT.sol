// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoanNFT
 * @notice NFT representing IP-backed loans
 * @dev Each loan is represented as an NFT that can be transferred
 */
contract LoanNFT is ERC721, Ownable {
    
    uint256 private _nextTokenId;
    
    // Mapping from token ID to loan ID
    mapping(uint256 => uint256) public tokenIdToLoanId;
    mapping(uint256 => uint256) public loanIdToTokenId;
    
    // Events
    event LoanNFTMinted(uint256 indexed tokenId, uint256 indexed loanId, address indexed borrower);
    event LoanNFTBurned(uint256 indexed tokenId, uint256 indexed loanId);
    
    constructor() ERC721("Atlas Loan NFT", "ALOAN") Ownable(msg.sender) {
        _nextTokenId = 1;
    }
    
    /**
     * @notice Mint a new loan NFT
     * @param to Address to mint to (borrower)
     * @param loanId The loan ID this NFT represents
     * @return tokenId The minted token ID
     */
    function mint(address to, uint256 loanId) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        
        tokenIdToLoanId[tokenId] = loanId;
        loanIdToTokenId[loanId] = tokenId;
        
        emit LoanNFTMinted(tokenId, loanId, to);
        
        return tokenId;
    }
    
    /**
     * @notice Burn a loan NFT (when loan is repaid or liquidated)
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) external onlyOwner {
        uint256 loanId = tokenIdToLoanId[tokenId];
        
        delete tokenIdToLoanId[tokenId];
        delete loanIdToTokenId[loanId];
        
        _burn(tokenId);
        
        emit LoanNFTBurned(tokenId, loanId);
    }
    
    /**
     * @notice Get loan ID from token ID
     * @param tokenId The token ID
     * @return loanId The loan ID
     */
    function getLoanId(uint256 tokenId) external view returns (uint256 loanId) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenIdToLoanId[tokenId];
    }
    
    /**
     * @notice Get token ID from loan ID
     * @param loanId The loan ID
     * @return tokenId The token ID
     */
    function getTokenId(uint256 loanId) external view returns (uint256 tokenId) {
        tokenId = loanIdToTokenId[loanId];
        require(tokenId != 0, "Loan NFT does not exist");
        return tokenId;
    }
    
    /**
     * @notice Check if loan NFT exists
     * @param loanId The loan ID
     * @return exists True if NFT exists
     */
    function exists(uint256 loanId) external view returns (bool) {
        uint256 tokenId = loanIdToTokenId[loanId];
        return tokenId != 0 && ownerOf(tokenId) != address(0);
    }
    
    /**
     * @notice Get total supply of loan NFTs
     * @return supply Total supply
     */
    function totalSupply() external view returns (uint256 supply) {
        return _nextTokenId - 1;
    }
}
