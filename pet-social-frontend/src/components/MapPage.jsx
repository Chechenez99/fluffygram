import React, { useEffect, useRef, useState } from 'react';

const MapPage = () => {
  const mapRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Загружаем 2GIS скрипт один раз
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://widgets.2gis.com/js/DGWidgetLoader.js"]'
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://widgets.2gis.com/js/DGWidgetLoader.js';
      script.async = true;
      script.onload = () => {
        console.log('🟢 2GIS скрипт загружен ✅');
        setScriptLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      console.log('🟢 2GIS скрипт уже есть ✅');
      setScriptLoaded(true);
    }
  }, []);

  // Инициализация карты
  useEffect(() => {
    if (!scriptLoaded || !window.DGWidgetLoader || !mapRef.current) return;

    console.log('🎯 Создание карты в:', mapRef.current);

    mapRef.current.innerHTML = ''; // очистка перед вставкой

    new window.DGWidgetLoader({
      container: mapRef.current, // 💥 ВАЖНО!
      width: '100%',
      height: 500,
      borderColor: '#ffffff',
      pos: {
        lat: 55.00361343394536,
        lon: 82.98934936523439,
        zoom: 11,
      },
      opt: { city: 'novosibirsk' },
      org: [
        { id: '70000001031932913' },
        { id: '141265771927184' },
        { id: '70000001091418895' },
        { id: '70000001038547943' },
        { id: '70000001045031916' },
        { id: '70000001063729690' },
        { id: '70000001023692222' },
        { id: '70000001055550526' },
        { id: '141265771623380' },
        { id: '70000001030043453' },
        { id: '141265771753328' },
        { id: '70000001022655923' },
        { id: '141265770895071' },
        { id: '70000001052132018' },
        { id: '70000001027469193' },
        { id: '141265769670440' },
        { id: '70000001033070299' },
        { id: '70000001043252139' },
        { id: '70000001044583134' },
        { id: '70000001042829735' },
        { id: '70000001019659383' },
        { id: '70000001030298529' },
        { id: '70000001023412410' },
        { id: '70000001034472281' },
      ],
    });

    console.log('✅ Карта инициализирована 🎉');
  }, [scriptLoaded]);

  return (
    <div className="bg-[#f3e6f5] p-6 rounded-xl">
      <h2 className="text-2xl font-bold mb-4">📍 Карта ветсервисов в Новосибирске</h2>
      <div
        ref={mapRef}
        className="w-full rounded-2xl border-4 border-white overflow-hidden shadow-md"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default MapPage;
