import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Button
} from '@mui/material';
import FeatherIcon from "feather-icons-react";
import { makeStyles } from "@material-ui/core/styles";

import { alterTypeOfAlert, turnAlert } from '../../store/ducks/Layout';
import { useSelector, useDispatch } from 'react-redux';

import React from 'react';

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

export default function AlertDialog() {
    const classes = useStyles();

    const { isOpenAlert, titleAlert, subTitleAlert, typeAlertIsSuccess } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    
    const handleOk = () => {
        dispatch(turnAlert());
        dispatch(alterTypeOfAlert(true));
    }

    return (

        <Dialog open={isOpenAlert}
            onClose={() => dispatch(turnAlert())}
            classes={{ paper: classes.dialog }}
        >
            <DialogTitle className={classes.dialogTitle}>
                <FeatherIcon icon={typeAlertIsSuccess ? 'check-circle' : 'x-circle'} size="66" />
            </DialogTitle>

            <DialogContent className={classes.dialogContent}>

                <Typography sx={{ fontWeight: "600", fontSize: "16px" }} variant="h6">
                    {titleAlert}
                </Typography>

                <Typography sx={{ fontWeight: "600" }} color="textSecondary" variant='subtitle2'>
                    {subTitleAlert}
                </Typography>

            </DialogContent>

            <DialogActions className={classes.dialogAction}>

                <Button
                    onClick={handleOk}
                    color="error" size="medium" variant="contained">
                    <FeatherIcon icon="check-circle" size="36" width="80" height="30" />
                </Button>

            </DialogActions>

        </Dialog>
    )
}
