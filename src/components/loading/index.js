import { Dialog } from '@mui/material';
import {makeStyles} from "@material-ui/core/styles";

import Load from "../../../assets/images/logos/loading1.gif";
import Image from "next/image";

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

export default function Loading() {
    const classes = useStyles();

    const { isOpenLoading } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    return (

        <Dialog open={isOpenLoading}
            classes={{ paper: classes.dialog }}
        >
            <Image width={100} height={100} src={Load} alt={Load} />

        </Dialog>
    )
}
