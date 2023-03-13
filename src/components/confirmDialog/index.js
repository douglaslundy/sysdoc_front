import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Button
} from '@mui/material';
import FeatherIcon from "feather-icons-react";
import {makeStyles} from "@material-ui/core/styles";

import React from 'react';
import { useDispatch } from 'react-redux';

const useStyles = makeStyles(
    theme => (
        {
            dialog: {
                padding: theme.spacing(5),
                display: 'flex',
                justifyContent: 'space-around',
            },
            dialogTitle: {
                padding: theme.spacing(2),
                display: 'flex',
                justifyContent: 'space-around',
            },
            dialogContent: {
                textAlign: 'center',
                alignContent: 'center',
            },
            dialogAction: {
                justifyContent: 'space-evenly',
            }
        }
    ));

export default function ConfirmDialog(props) {
    const { confirmDialog, setConfirmDialog } = props;
    const classes = useStyles();
    const dispatch = useDispatch();
    return (

        <Dialog open={confirmDialog.isOpen}
            onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            classes={{ paper: classes.dialog }}
        >
            <DialogTitle className={classes.dialogTitle}>
                <FeatherIcon icon="alert-triangle" size="66" />
            </DialogTitle>

            <DialogContent className={classes.dialogContent}>

                <Typography sx={{ fontWeight: "600", fontSize: "16px" }} variant="h6">
                    {confirmDialog.title}
                </Typography>

                {confirmDialog.subTitle}

            </DialogContent>

            <DialogActions className={classes.dialogAction}>
                <Button
                    onClick={() => {dispatch(confirmDialog.confirm), setConfirmDialog({ ...confirmDialog, isOpen: false })}}
                    color="error" size="medium" variant="contained">
                    <FeatherIcon icon="check" width="40" height="20" />
                    Sim
                </Button>

                <Button
                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                    color="success" size="medium" variant="contained">
                    <FeatherIcon icon="x" width="40" height="20" />
                    Não
                </Button>
            </DialogActions>
        </Dialog>
    )
}
