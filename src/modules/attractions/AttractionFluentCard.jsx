import React from 'react';
import {
    makeStyles,
    Caption1,
    Text,
    tokens,
    Card,
    CardPreview,
    Menu,
    MenuList,
    MenuTrigger,
    MenuButton,
    MenuPopover,
    MenuItem,
} from '@fluentui/react-components';
import {
    MoreHorizontal20Regular,
    Edit20Regular,
    Archive20Regular,
    Delete20Regular,
    Eye20Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
    card: {
        display: 'grid',
        gridTemplateColumns: '80px 1fr auto',
        gridTemplateRows: '1fr',
        columnGap: tokens.spacingHorizontalM,
        alignItems: 'center',
        width: '360px',
        maxWidth: '100%',
        height: 'fit-content',
        // Dodajemy, aby kursor informował o możliwości kliknięcia
        cursor: 'pointer',
    },
    image: {
        width: '80px',
        height: '80px',
        marginTop: `calc(${tokens.spacingHorizontalM} * -1)`,
        marginBottom: `calc(${tokens.spacingHorizontalM} * -3)`,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
    },
    truncate: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    caption: {
        color: tokens.colorNeutralForeground3,
    },
});

export default function AttractionFluentCard({ attraction, onDetailsClick, onEdit, onArchive, onDelete }) {
    const styles = useStyles();
    const imageUrl = attraction.squareThumbnailUrl || attraction.thumbnailUrl;
    const formattedAddress = attraction.address ? attraction.address.replace(/\d{2}-\d{3}\s*/, '') : 'Brak adresu';

    return (
        // ZMIANA NR 1: Dodajemy onClick do całej karty
        <Card className={styles.card} onClick={onDetailsClick}>
            <CardPreview className={styles.image}>
                {imageUrl ? (
                    <img className={styles.image} src={imageUrl} alt={attraction.image_alt_text || `Zdjęcie dla ${attraction.name_pl}`} />
                ) : (
                    <div className={`flex items-center justify-center w-full h-full bg-gray-200`}>
                         <i className="fa-solid fa-image fa-2x text-gray-400"></i>
                    </div>
                )}
            </CardPreview>

            <div className={styles.content}>
                <Text weight="semibold" className={styles.truncate} title={attraction.name_pl}>
                    {attraction.name_pl}
                </Text>
                <Caption1 className={`${styles.caption} ${styles.truncate}`} title={attraction.address}>
                    {formattedAddress}
                </Caption1>
                <Caption1 block className={`${styles.caption} ${styles.truncate}`} title={attraction.phone || 'Brak telefonu'}>
                    {attraction.phone || 'Brak telefonu'}
                </Caption1>
            </div>

            {/* ZMIANA NR 2: Opakowujemy Menu w div'a, który zatrzymuje "klikanie" */}
            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <Menu>
                    <MenuTrigger disableButtonEnhancement>
                        <MenuButton
                            appearance="transparent"
                            icon={<MoreHorizontal20Regular />}
                            aria-label="Akcje"
                        />
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            <MenuItem icon={<Eye20Regular />} onClick={onDetailsClick}>Zobacz</MenuItem>
                            <MenuItem icon={<Edit20Regular />} onClick={() => onEdit(attraction)}>Edytuj</MenuItem>
                            <MenuItem icon={<Archive20Regular />} onClick={() => onArchive(attraction)}>Archiwizuj</MenuItem>
                            <MenuItem icon={<Delete20Regular />} onClick={() => onDelete(attraction.id)}>Usuń</MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </div>
        </Card>
    );
}