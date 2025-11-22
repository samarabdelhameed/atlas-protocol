// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILoanNFT
 * @notice Interface for Loan NFT contract
 */
interface ILoanNFT {
    function mint(address to, uint256 loanId) external returns (uint256 tokenId);
    function burn(uint256 tokenId) external;
    function getLoanId(uint256 tokenId) external view returns (uint256 loanId);
    function getTokenId(uint256 loanId) external view returns (uint256 tokenId);
    function exists(uint256 loanId) external view returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
}
