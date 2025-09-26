import React from 'react';
import {
    makeStyles,
    Caption1,
    Text,
    tokens,
    Card,
    CardHeader,
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
        width: '360px',
        maxWidth: '100%',
        height: 'fit-content',
    },
    image: {
        width: '80px',
        height: '80px',
        flexShrink: 0, // Zapobiega kurczeniu się obrazka
    },
    caption: {
        color: tokens.colorNeutralForeground3,
    },
    truncate: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    // NOWY STYL dla całego nagłówka (kontenera na tekst i przycisk)
    header: {
        // To jest kluczowe: pozwala, aby wewnętrzne elementy mogły się kurczyć
        minWidth: 0, 
    },
});

export default function AttractionFluentCard({ attraction, onDetailsClick, onEdit, onArchive, onDelete }) {
    const styles = useStyles();
    const imageUrl = attraction.squareThumbnailUrl || attraction.thumbnailUrl;

    return (
        <Card className={styles.card} orientation="horizontal">
            <CardPreview className={styles.image}>
                {imageUrl ? (
                    <img className={styles.image} src={imageUrl} alt={attraction.image_alt_text || `Zdjęcie dla ${attraction.name_pl}`} />
                ) : (
                    <div className={`flex items-center justify-center w-full h-full bg-gray-200`}>
                         <i className="fa-solid fa-image fa-2x text-gray-400"></i>
                    </div>
                )}
            </CardPreview>

            <CardHeader
                className={styles.header} // <-- APLIKUJEMY NOWY STYL
                header={
                    <Text weight="semibold" className={styles.truncate} title={attraction.name_pl}>{attraction.name_pl}</Text>
                }
                description={
                    <div>
                        <Caption1 className={`${styles.caption} ${styles.truncate}`} title={attraction.address || 'Brak adresu'}>
                            {attraction.address || 'Brak adresu'}
                        </Caption1>
                        <Caption1 block className={`${styles.caption} ${styles.truncate}`} title={attraction.phone || 'Brak telefonu'}>
                            {attraction.phone || 'Brak telefonu'}
                        </Caption1>
                    </div>
                }
                action={
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
                }
            />
        </Card>
    );
}