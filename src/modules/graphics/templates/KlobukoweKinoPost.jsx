import React, { forwardRef } from 'react';

const KlobukoweKinoPost = forwardRef(({
  title,
  details,
  description,
  date,
  time,
  place,
  placeDetails,
  imageUrl,
  gradientColors = ['#000', '#444'] 
}, ref) => {

    // Dzieli opis na linie, aby nie wychodził poza obszar grafiki
    const descriptionLines = description.match(/.{1,65}/g) || [];

    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 1935 1934"
            width="100%"
            height="100%"
        >
            <defs>
                <linearGradient id="dynamicGradient" x1="0%" x2="70.711%" y1="70.711%" y2="0%">
                    <stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.99" />
                    <stop offset="35%" stopColor={gradientColors[0]} stopOpacity="1" />
                    <stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
                </linearGradient>
            </defs>
            
            {/* Tło - dwa prostokąty (góra i dół) wypełnione gradientem */}
            <rect x="0" y="0" width="1935" height="1934" rx="19.1" fill="url(#dynamicGradient)" />
            
            {/* Obrazek filmu umieszczony centralnie */}
            <image href={imageUrl} x="0" y="709" width="1935" height="818" preserveAspectRatio="xMidYMid slice"/>

            {/* --- GÓRNA CZĘŚĆ (HEADER) --- */}
            <image x="56" y="37" width="81" height="101" xlinkHref="data:image/png;base64,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" />
            <text fontFamily="Aptos" fontSize="36" fontWeight="bold" fill="#FFFFFF" x="168" y="80">
                <tspan>CENTRUM KULTURY</tspan>
                <tspan x="168" dy="1.2em">KŁOBUK</tspan>
            </text>
            <text fontFamily="Aptos" fontSize="36" fontWeight="bold" fill="#FFFFFF" x="1767" y="80" textAnchor="end">
                <tspan>KŁOBUKOWE</tspan>
                <tspan x="1767" dy="1.2em">KINO</tspan>
            </text>

            {/* --- GŁÓWNA CZĘŚĆ (TREŚĆ FILMU) --- */}
            <text y="350" fontFamily="Montserrat" fill="#FFFFFF" >
                <tspan x="100" fontSize="100" fontWeight="bold">{title.toUpperCase()}</tspan>
                <tspan x="100" dy="1.4em" fontSize="40" fontWeight="bold">{details}</tspan>
                {descriptionLines.map((line, index) => (
                    <tspan key={index} x="100" dy="1.4em" fontSize="40">{line}</tspan>
                ))}
            </text>

            {/* --- DOLNA CZĘŚĆ (STOPKA) --- */}
            <text y="1740" fontFamily="Montserrat" fontSize="40" fill="#FFFFFF">
                <tspan x="163" fontWeight="bold">BEZPŁATNY</tspan>
                <tspan x="163" dy="1.2em">SEANS FILMOWY</tspan>
            </text>
            
            <text y="1715" fontFamily="Montserrat" fill="#FFFFFF" textAnchor="middle">
                <tspan x="967" fontSize="36">Termin:</tspan>
                <tspan x="967" dy="1.2em" fontSize="40" fontWeight="bold">{date}</tspan>
                <tspan x="967" dy="1.2em" fontSize="40" fontWeight="bold">{time}</tspan>
            </text>

            <text y="1715" fontFamily="Montserrat" fill="#FFFFFF" textAnchor="end">
                <tspan x="1772" fontSize="36">Miejsce:</tspan>
                <tspan x="1772" dy="1.2em" fontSize="40" fontWeight="bold">{place}</tspan>
                <tspan x="1772" dy="1.2em" fontSize="40" fontWeight="bold">{placeDetails}</tspan>
            </text>

             <text x="967" y="1880" fontFamily="Montserrat" fill="#FFFFFF" fontSize="20" textAnchor="middle">
                Terminy seansów mogą ulec zmianie. Wydarzenia mogą być dokumentowane fotograficznie w celach promocyjnych.
            </text>
        </svg>
    );
});

export default KlobukoweKinoPost;