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
    listItem: {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: tokens.spacingHorizontalL,
        alignItems: 'center',
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
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
    indicators: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalL,
    },
    status: {
        color: tokens.colorPaletteGreenForeground3, // Domyślnie zielony dla otwartego
    },
    statusClosed: {
        color: tokens.colorNeutralForeground2,
    },
});

export default function GastronomyListItem({ place, onEdit, onDelete, onDetailsClick }) {
    const styles = useStyles();
    const imageUrl = place.thumbnailUrl || place.google_photo_url;
    const isOpen = isOpenNow(place);
    const statusStyles = isOpen ? styles.status : styles.statusClosed;

    return (
        <div className={styles.listItem}>
            {imageUrl ?
                <img src={imageUrl} alt={place.name} className={styles.image} /> :
                <div className={styles.placeholder}><i className="fa-solid fa-utensils"></i></div>
            }
            <div className={styles.info}>
                <p className={styles.name}>{place.name}</p>
                <p className={styles.address}>{place.address_formatted}</p>
            </div>
            <div className="flex items-center gap-4">
                 <div className={styles.indicators}>
                    <div title={isOpen ? "Otwarte teraz" : "Obecnie zamknięte"} className={statusStyles}>
                        <i className={`fa-solid ${isOpen ? 'fa-door-open' : 'fa-door-closed'}`}></i>
                    </div>
                    <div title="Ocena Google" className={`font-bold ${place.rating ? 'text-yellow-500' : 'text-gray-400'}`}>
                        <i className="fa-solid fa-star text-xs mr-1"></i>
                        <span>{place.rating || '-'}</span>
                    </div>
                </div>
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
    );
}