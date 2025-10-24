import React from 'react';
import { 
    Card, makeStyles, tokens, Tooltip, Body1, Button,
    Menu, MenuTrigger, MenuPopover, MenuList, MenuItem
} from "@fluentui/react-components";
import { MoreHorizontal24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
    card: {
        width: '100%',
        height: '80px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: tokens.spacingHorizontalS,
        gap: tokens.spacingHorizontalM,
    },
    imageContainer: {
        width: '64px',
        height: '64px',
        flexShrink: 0,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    contentWrapper: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        overflow: 'hidden',
    },
    title: {
        flexGrow: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontWeight: tokens.fontWeightSemibold,
    },
    menuButton: {
        flexShrink: 0,
    }
});

/**
 * Uproszczona, kompaktowa karta z przyciskiem menu.
 */
export default function CondensedGridCard({ imageUrl, title, onEditClick }) {
    const styles = useStyles();

    return (
        <Card className={styles.card}>
            <div className={styles.imageContainer}>
                <img
                    src={imageUrl || 'https://placehold.co/64x64/cccccc/333333?text=?'}
                    alt={title}
                    className={styles.image}
                />
            </div>
            <div className={styles.contentWrapper}>
                <Tooltip content={title} relationship="label">
                    <Body1 className={styles.title}>{title}</Body1>
                </Tooltip>
                {onEditClick && (
                     <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <Button 
                                className={styles.menuButton}
                                appearance="transparent" 
                                icon={<MoreHorizontal24Regular />}
                            />
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem onClick={onEditClick}>Edytuj</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                )}
            </div>
        </Card>
    );
}