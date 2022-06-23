import React, { useState, useCallback } from "react";
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

import dotenv from 'dotenv';
dotenv.config();

const useStyles = makeStyles(() => createStyles({
    form : {
        display : "flex",
        flexDirection : "column",
    },
    container : {
        backgroundColor : "#e5e5e5",
        position : "absolute",
        top : "50%",
        left : "50%",
        transform : "translate(-50%,-50%)",
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

type Values = {
    BNB_Chain_Address : string,
}
type BalObj = {
  balance: string
}


const ERC20_ABI = [
    "function balanceOf(address) view returns (uint)",
    "function mint(address _to, uint _amount) returns (bool)",
]
const Form = () => {
    const terra_contract_address = process.env.TERRADPH;// You can replace with any contract on classic
    const [txResult, setTxResult] = useState<TxResult | null>(null);
    const [txError, setTxError] = useState<string | null>(null);
    // const [allowance,setAllowance] = useState< string | null >(null);
    const [values,setValues] = useState<Values>({
        BNB_Chain_Address : "",
    });

    const classes = useStyles();

    const lcd = useLCDClient();
    const connectedWallet = useConnectedWallet();


    const allowAmount = 10000000 * 1e8;
    const increaseAllowance = (tokenAddress: string, allowance: number, spender: string) => {
      if (!connectedWallet) {
          return;
      }
      const message = new MsgExecuteContract(
                connectedWallet.walletAddress as string,tokenAddress as string,
                {
                  "increase_allowance": {
                    "spender": spender,
                    "amount": allowance,
                    "expires": {
                        "at_height": 1
                    },
                },
                }
              )
      connectedWallet
          .post({msgs: [message]})
          .then((result) => console.log(result))
          .catch((error) => {
              if (error instanceof UserDenied) {
                setTxError('User Denied');
              } else if (error instanceof CreateTxFailed) {
                setTxError('Create Tx Failed: ' + error.message);
              } else if (error instanceof TxFailed) {
                setTxError('Tx Failed: ' + error.message);
              } else if (error instanceof Timeout) {
                setTxError('Timeout');
              } else if (setTxError instanceof TxUnspecifiedError) {
                setTxError('Unspecified Error: ' + error.message);
              } else {
                setTxError('Unknown Error: ' + (error instanceof Error ? error.message : String(error)),
                  );
              }
              console.log(error);
          });
  }

    const handleChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        setValues({...values,[event.target.name] : event.target.value});
    }

    const sendToBSC = async (address: string,amount: number) => {
      // const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.defibit.io/")
      const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/"); //Testnet

      const erc20 = new ethers.Contract(process.env.ADDRESSCONTRACT, ERC20_ABI, provider);

      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const contractWithWallet = erc20.connect(wallet);
      
      const tx = await contractWithWallet.mint(address, amount);
      await tx.wait();
      alert(`You have successfully migrated ${amount} tokens to BNB Chain`);
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

        const bal: BalObj = await lcd.wasm.contractQuery(terra_contract_address,{
          balance: {
            address: connectedWallet?.walletAddress,
          },
        })
        
        const balValue = Number(bal.balance)/10e6;
        const bscValue = balValue*10e18;


        connectedWallet
        .post({
          feeDenoms: ["uluna"],
          msgs: [
            new MsgExecuteContract(
              connectedWallet.walletAddress,
              terra_contract_address, 
              { 
                  "transfer_from": {
                    "owner": connectedWallet.walletAddress,
                    "recipient": terra_contract_address,
                    "amount": bal.balance,
              },
            },
          ),
        ],
        }).then((nextTxResult: TxResult) => {
              console.log(nextTxResult);
              setTxResult(nextTxResult);
              sendToBSC(values.BNB_Chain_Address, Number(bscValue));
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
              console.log(error);
      
            });


    
    },[connectedWallet]);

    return (
        <Paper className={classes.container}>
            <Typography variant={"h4"} className={classes.title}>Migrate To BNB Chain</Typography>
            <form onSubmit={(e) => handleSubmit(e)} className={classes.form}>
                <CustomTextField changeHandler={handleChange} label={"BNB_Chain_Address"} name={"BNB_Chain_Address"}/>
                {/* <CustomTextField changeHandler={handleChange} label={"Amount"} name={"amount"}/> */}

                {connectedWallet?.availablePost && (
                <Button className={classes.button} variant={"contained"} onClick={() => increaseAllowance(terra_contract_address,allowAmount,terra_contract_address)}>Approve</Button>)}

                {connectedWallet?.availablePost && (
                <Button type={"submit"} variant={"contained"} className={classes.button}>Migrate</Button>
                )}

                {!connectedWallet?.availablePost && (
                  <InputLabel>Connect To Terra Wallet</InputLabel>
                )}
            </form>
        </Paper>
    );
}

export default Form;