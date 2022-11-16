import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { providers, Contract, utils } from "ethers";
import styles from "../styles/Home.module.css"
import Web3Modal from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();
  // somehow creates reference to web3modal..idk how 

  const  getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokensMinted.toString());
    } catch (error) {
      console.error(error)
    }
  }

  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      });
      await txn.wait();

      window.alert("You successfully minted a CryptoDev!")

    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
  
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
  
      const txn = await nftContract.mint({
        value: utils.parseEther("0.01")
      });
      await txn.wait();
  
      window.alert("You successfully minted a CryptoDev!")
  
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const getOwner = async () => {
    try {

      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch(error) {
      console.error(error.message)
    }
  }

  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.startPresale();
      await txn.wait();
      setPresaleStarted(true);
 
    } catch(error) {
      console.error(error);
    }
    setLoading(false);
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      // get instance of nft-contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // access function in smart contract
      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch(error) {
      console.error(error);
      return false;
    }

  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      // get instance of nft-contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );

      setPresaleEnded(hasPresaleEnded);

    } catch (error) {
      console.error(error);
    }
  }

  const connectWallet = async() => {
    try {
        await getProviderOrSigner();
        setWalletConnected(true);
    } catch(error) {
        console.error(error);
    }
  }
  
  const getProviderOrSigner = async(needSigner = false) => {
    // This line will pop open Metamask and tries to gain access
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    // If user is not connected with goerli, make them connect to goerli
    if (chainId !== 5) {
      window.alert("Please switch to the Goerli Network");
      throw new Error("Incorrect network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider
  }

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if(presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    //Track in real time number of minted NFTs
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5 * 1000)

    // Track in real time the status of presale (started, ended)
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000)

  }

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      onPageLoad();
    }
  }, []);

  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet
        </button>
      );
    }

    if (loading) {
      return <span className={styles.description}>Loading...</span>
    }

    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      )
    }

    if (!presaleStarted) {
      return (
        <div>
          <span className={styles.description}>Presale has not started yet. Come back later!</span>
        </div>
      )
    }

    if (presaleStarted && !presaleEnded) {
      return(
        <div>
          <span className={styles.description}>
            Presale has started! If your address is whitelisted, 
            you can mint a CryptoDev!
          </span>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint
          </button>
        </div>
      )
    }

    if (presaleEnded) {
      return(
        <div>
          <span className={styles.description}>
            Presale has ended.
            You can mint a CryptoDev in public sale, 
            if any remain.
          </span>
          <button className={styles.button} onClick={publicMint}>
            Public Mint
          </button>
        </div>
      )
    }

    
  }
 
  return (
 
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>

      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
        <span className={styles.description}>
          Its an NFT collection for developers in Crypto.
        </span>
        <br></br>
        <br></br>
        <span>
          {numTokensMinted}/20 have been minted already!
        </span>
       
        {renderBody()}
      </div>
      
        
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>
      

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  
  )
}
