import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        flexWrap: 'wrap', // Umożliwia zawijanie na mniejszych ekranach
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: tokens.spacingVerticalL,
        gap: tokens.spacingHorizontalL, // Odstęp między lewą a prawą stroną
    },
    actionGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
});

function GlobalToolbar({ children }) {
    const styles = useStyles();
    return <div className={styles.toolbar}>{children}</div>;
}

const Left = ({ children }) => {
    const styles = useStyles();
    return <div className={styles.actionGroup}>{children}</div>;
};

const Right = ({ children }) => {
    const styles = useStyles();
    return <div className={styles.actionGroup}>{children}</div>;
};

GlobalToolbar.Left = Left;
GlobalToolbar.Right = Right;

export default GlobalToolbar;