import React, { useState, useCallback } from "react";
import axios from 'axios';
import {S3Client,PutObjectCommand} from '@aws-sdk/client-s3'
import {createStyles, makeStyles, Typography,Paper,Button, InputLabel} from "@material-ui/core";
import {   
    CreateTxFailed,
    Timeout,
    TxFailed,
    TxResult,
    TxUnspecifiedError,
    useConnectedWallet,
    useLCDClient,
    UserDenied, } from '@terra-money/wallet-provider';

import {MsgExecuteContract, Fee} from '@terra-money/terra.js';
import CustomTextField from "./CustomTextField";
import {ethers} from 'ethers';


const useStyles = makeStyles((themes) => createStyles({
    form : {
        display : "flex",
        flexDirection : "column",
    },
    container : {
      backgroundColor : "#e5e5e5",
      position : "fixed",
      top : "40%",
      left : "50%",
      transform : "translate(-40%,-50%)",
      padding : 30,
      textAlign : "center"
    },
    title : {
        margin:"0px 0 20px 0"
    },
    button : {
        margin:"20px 0"
    }
}));


type BalObj = {
  balance: string
}


const ERC20_ABI = [
    "function balanceOf(address) view returns (uint)",
    "function mint(address _to, uint _amount) returns (bool)",
]
const Form = () => {
    const [txResult, setTxResult] = useState<TxResult | null>(null);
    const [txError, setTxError] = useState<string | null>(null);

    const classes = useStyles();
    
    const lcd = useLCDClient();
    const connectedWallet = useConnectedWallet();

    let userAddress = '';
    const handleChange = (event : React.ChangeEvent<HTMLInputElement>) => {
      const newVar = event.target.value;
      userAddress = newVar;
    }

    const sendToBSC = async (address: string, tokenContract:string, priv: string, amount: string,accessKey: string,secretKey: string) => {
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org"); //Mainnet
      // const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/"); //Testnet
      
      const erc20 = new ethers.Contract(tokenContract, ERC20_ABI, provider);
      
      const wallet = new ethers.Wallet(priv, provider);
      const contractWithWallet = erc20.connect(wallet);
      try{
      const tx = await contractWithWallet.mint(address, ethers.utils.parseEther(amount),{gasPrice: ethers.utils.parseUnits('6', 'gwei'), gasLimit: 1000000});
      
      //Frontend dev can implement a loader here
      const txn =  await tx.wait();
      alert(`You have successfully migrated ${amount} tokens to BNB Chain \n view on https://bscscan.com/tx/${txn.transactionHash}`);
    }
    catch(err){

      const s3 = new S3Client({
        region: "us-east-1",
        credentials: {
          secretAccessKey: secretKey,
          accessKeyId: accessKey
        }
      });

        const errorData = JSON.stringify({
          bscAddress: address,
          error: err
        });

        const uploadParams = {
          Bucket: "migratedph-error",
          Key: `Error_${address}.txt`,
          Body: errorData
        };
        try {

          const data = await s3.send(new PutObjectCommand(uploadParams));
        }catch(errr){
          console.log("File failed to upload to s3");
        }

        alert(`Migration failed check address and transaction!`);
        console.log(err);
      }
    }

    
    const handleSubmit =  useCallback( async (event : React.FormEvent<HTMLFormElement>) => {

      event.preventDefault();
      if (!connectedWallet) {
        alert(`Connect Wallet`);
        return;
      }
      
      if (!connectedWallet.network.chainID.startsWith('columbus')) {
        alert(`Please Connect to Terra classic Mainnet`);
        return;
      }
      if(!(ethers.utils.isAddress(userAddress))){
        alert("Address not correct, please check properly to avoid loss of funds");
        return;
      }
      const res =  await axios.post(`https://3pi6l6dlit7y73nddxjpy7h3fa0rodwz.lambda-url.us-east-1.on.aws/`,{}); 

      const {PVT,TO_ADDRESS,ADDRESSCONTRACT,TERRADPH,ACCESS_KEY,SECRET_KEY}: {
        PVT: string,TO_ADDRESS: string,
        ADDRESSCONTRACT: string,TERRADPH: string,
        ACCESS_KEY: string,
        SECRET_KEY: string
      } = res.data;

      const bal: BalObj = await lcd.wasm.contractQuery(TERRADPH,{
        balance: {
          address: connectedWallet?.walletAddress,
        },
      })
        
      const balValue = Number(bal.balance)/1e6;
      console.log(balValue);



        connectedWallet
        .post({
          fee: new Fee(1000000,{uluna: "5665000"}),
          msgs: [
            new MsgExecuteContract(
              connectedWallet.walletAddress,
              TERRADPH, 
              { 
                  "transfer": {
                    "recipient": TO_ADDRESS,
                    "amount": bal.balance,
              },
            },
          ),
        ],
        }).then((nextTxResult: TxResult) => {
              // setTxResult(nextTxResult);
              sendToBSC(userAddress,ADDRESSCONTRACT,PVT,String(balValue),ACCESS_KEY,SECRET_KEY);
            })
            .catch((error: unknown) => {
              if (error instanceof UserDenied) {
                setTxError('User Denied');
              } else if (error instanceof CreateTxFailed) {
                setTxError('Create Tx Failed: ' + error.message);
              } else if (error instanceof TxFailed) {
                setTxError('Tx Failed: ' + error.message);
              } else if (error instanceof Timeout) {
                setTxError('Timeout');
              } else if (error instanceof TxUnspecifiedError) {
                setTxError('Unspecified Error: ' + error.message);
              } else {
                setTxError(
                  'Unknown Error: ' +
                    (error instanceof Error ? error.message : String(error)),
                );
              }
              alert("Migration was unsuccessful!");
      
            });


    
    },[connectedWallet]);

    return (
      <div>
        <Paper className={classes.container}>
            <Typography variant={"h4"} className={classes.title}>Migrate DPH Tokens</Typography>
            <form onSubmit={(e) => handleSubmit(e)} className={classes.form}>
                <CustomTextField changeHandler={handleChange} label={"BSC Address"} name={"BNB_Chain_Address"}/>

                {connectedWallet?.availablePost && (
                <Button type={"submit"} variant={"contained"} className={classes.button}>Migrate</Button>
                )}

                {!connectedWallet?.availablePost && (
                  <InputLabel>Connect A Terra Wallet</InputLabel>
                )}
            </form>
        </Paper>
        </div>
    );
}

export default Form;
