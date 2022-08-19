import {createStyles, makeStyles, Typography,Paper} from "@material-ui/core";

const useStyles =  makeStyles((themes) => createStyles({
    textContainer : {
        display : "flex",
        flexDirection : "column",
        position: "fixed",
        backgroundColor: "transparent",
        maxWidth: "300px",
        top : "50%",
        left: "48%",
        transform : "translate(-34%,55%)",
        padding : 30,
        textAlign : "center"
    },
    text: {
        color: "white"
    }

}));


function Info() {

    const classes = useStyles();
  return (
    <div>
        <Paper className={classes.textContainer}>
            <Typography  className={classes.text}>Paste your BSC wallet address above to migrate DPH from Terra Classic to DGH on BNB chain</Typography>
        </Paper>
    </div>
  )
}

export default Info