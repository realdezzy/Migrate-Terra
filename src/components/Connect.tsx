import { useWallet, WalletStatus } from '@terra-money/wallet-provider';
import { createStyles, makeStyles, Button } from "@material-ui/core";

const useStyles = makeStyles(() => createStyles({
  container : {
      display: "flex",
      position : "relative",
      top : "50%",
      left : "50%",
      transform : "translate(-50%,-50%)",
      padding : 30,
      textAlign : "right",
  },
  button : {
    margin:"20px 0",
    color: '#ffffff',
    backgroundColor: '#0366ff',
    marginRight: '4px',
    marginBottom: '4px',
  }
}));

export default function Connect() {

  const classes = useStyles();


  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    connect,
    disconnect,
  } = useWallet();
  return (
    <>
    <div className={classes.container}>
        {/* {JSON.stringify({ status, network, wallets }, null, 2)} */}
        {status === WalletStatus.WALLET_NOT_CONNECTED && (
          <>
          <div>
            {availableConnectTypes.map((connectType) => (
                <Button
                  key={"connect-" + connectType}
                  onClick={() => connect(connectType)}
                  className={classes.button}
                >
                  Connect {connectType}
                </Button>
            ))}
            </div>
          </>
        )}
        {status === WalletStatus.WALLET_CONNECTED && (
          <Button className={classes.button} onClick={() => disconnect()}>Disconnect</Button>
        )}
    </div>
    </>
  );
}