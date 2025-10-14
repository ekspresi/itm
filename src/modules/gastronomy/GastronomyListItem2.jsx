import React from 'react';
import {
    Menu,
    MenuTrigger,
    MenuList,
    MenuItem,
    MenuPopover,
    Button,
    makeStyles,
    tokens
} from '@fluentui/react-components';
import { MoreHorizontal24Regular } from '@fluentui/react-icons';
import { isOpenNow } from '../../lib/helpers';

const useStyles = makeStyles({
    wrapper: {
        cursor: 'pointer',
    },
    listItem: {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: tokens.spacingHorizontalL,
        alignItems: 'center',
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderLeftWidth: '3px',
        borderLeftStyle: 'solid',
        transition: 'background-color 0.2s ease-in-out, border-left-color 0.2s ease-in-out',
        '&:hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    image: {
        width: '56px',
        height: '56px',
        borderRadius: tokens.borderRadiusMedium,
        objectFit: 'cover',
        backgroundColor: tokens.colorNeutralBackground2,
    },
    placeholder: {
        width: '56px',
        height: '56px',
        borderRadius: tokens.borderRadiusMedium,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.colorNeutralBackground2,
        color: tokens.colorNeutralForeground2,
    },
    info: {
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
    },
    name: {
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    address: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
});

export default function GastronomyListItem2({ place, onEdit, onDelete, onDetailsClick }) {
    const styles = useStyles();
    const imageUrl = place.squareThumbnailUrl;
    const isOpen = isOpenNow(place);

    const itemStyle = {
        borderLeftColor: isOpen ? tokens.colorPaletteGreenBackground3 : tokens.colorNeutralStroke2,
    };

    const formattedAddress = (place.address_formatted || '')
        .replace('11-730 Mikołajki, ', '')
        .replace(', 11-730 Mikołajki', '')
        .replace('11-730 Mikołajki', '')
        .trim();

    // === FINALNA POPRAWKA: Sprawdzamy pole 'phone' jako pierwsze ===
    const phoneNumber = place.phone || place.formatted_phone_number || place.international_phone_number;

    return (
        <div onClick={() => onDetailsClick(place)} className={styles.wrapper}>
            <div className={styles.listItem} style={itemStyle}>
                {imageUrl ?
                    <img src={imageUrl} alt={place.name} className={styles.image} /> :
                    <div className={styles.placeholder}><i className="fa-solid fa-utensils"></i></div>
                }
                <div className={styles.info}>
                    <p className={styles.name}>{place.name}</p>
                    <p className={styles.address}>{formattedAddress}</p>
                    {/* Użycie poprawionej zmiennej phoneNumber */}
                    {phoneNumber && (
                        <p className={styles.address}>
                            {phoneNumber}
                        </p>
                    )}
                </div>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                    <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <Button appearance="transparent" icon={<MoreHorizontal24Regular />} />
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem onClick={() => onDetailsClick(place)}>Zobacz szczegóły</MenuItem>
                                <MenuItem onClick={() => onEdit(place)}>Edytuj</MenuItem>
                                <MenuItem onClick={() => onDelete(place.id)}>Usuń</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
            </div>
        </div>
    );
}