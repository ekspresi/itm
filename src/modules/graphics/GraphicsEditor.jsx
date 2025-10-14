import React, { useState, useRef } from 'react';
import { ColorExtractor } from 'react-color-extractor';
import FormField from '../../components/FormField';
import KlobukoweKinoPost from './templates/KlobukoweKinoPost';
import { Button } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

// Helper do konwersji SVG na Data URL, aby umożliwić pobieranie
const svgToDataURL = (svgElement) => {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  // Kodowanie znaków specjalnych
  const encodedData = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encodedData}`;
};

function GraphicsEditor() {
  const [title, setTitle] = useState("Maria, Królowa Szkotów");
  const [details, setDetails] = useState("2018 | Biograficzny, Dramat, Historyczny | 16+");
  const [description, setDescription] = useState("Dwie królowe, jedna korona. Poznaj historię charyzmatycznej Marii Stuart i jej burzliwej rywalizacji z kuzynką, Elżbietą I, o tron Anglii.");
  const [date, setDate] = useState("piątek, 21.11.2025");
  const [time, setTime] = useState("18:00-20:00");
  const [place, setPlace] = useState("Sala widowiskowa");
  const [placeDetails, setPlaceDetails] = useState("sala nr 32");
  const [image, setImage] = useState('./2025-11-21 - Maria, Królowa Szkotów (2018).jpg'); 
  const [colors, setColors] = useState(['#560b22', '#7f4051']);

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleDownload = () => {
    if (svgRef.current) {
        const dataUrl = svgToDataURL(svgRef.current);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* === PANEL FORMULARZA === */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col space-y-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">Wypełnij dane szablonu</h2>
        
        <FormField label="Tytuł filmu" value={title} onChange={(e) => setTitle(e.target.value)} />
        <FormField label="Szczegóły (rok, gatunek, wiek)" value={details} onChange={(e) => setDetails(e.target.value)} />
        <FormField label="Opis" value={description} onChange={(e) => setDescription(e.target.value)} type="textarea" />
        <FormField label="Data" value={date} onChange={(e) => setDate(e.target.value)} />
        <FormField label="Godziny" value={time} onChange={(e) => setTime(e.target.value)} />
        <FormField label="Miejsce" value={place} onChange={(e) => setPlace(e.target.value)} />
        <FormField label="Szczegóły miejsca" value={placeDetails} onChange={(e) => setPlaceDetails(e.target.value)} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plakat filmu</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-900" 
            ref={fileInputRef}
          />
          <div className="hidden">
            <ColorExtractor src={image} getColors={palette => setColors(palette.slice(0, 2))} />
          </div>
        </div>

        <Button
          appearance="primary"
          icon={<ArrowDownload24Regular />}
          onClick={handleDownload}
        >
          Pobierz jako SVG
        </Button>
      </div>

      {/* === PODGLĄD GRAFIKI === */}
      <div className="lg:col-span-2 bg-gray-200 dark:bg-gray-700 p-4 rounded-lg flex justify-center items-center">
        <div className="w-full max-w-3xl aspect-square">
            <KlobukoweKinoPost 
                ref={svgRef}
                title={title}
                details={details}
                description={description}
                date={date}
                time={time}
                place={place}
                placeDetails={placeDetails}
                imageUrl={image}
                gradientColors={colors}
            />
        </div>
      </div>
    </div>
  );
}

export default GraphicsEditor;