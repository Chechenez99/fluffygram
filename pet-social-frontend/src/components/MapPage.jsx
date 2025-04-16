import React, { useEffect, useState, useRef, useCallback } from 'react';

const MapPage = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ text: '', rating: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);
  const [allPlacemarks, setAllPlacemarks] = useState([]);

  const getStorageKey = (id) => `reviews_${id}`;

  const loadReviews = useCallback((id) => {
    const data = localStorage.getItem(getStorageKey(id));
    return data ? JSON.parse(data) : [];
  }, []);

  const saveReview = (id, review) => {
    const current = loadReviews(id);
    const updated = [...current, review];
    localStorage.setItem(getStorageKey(id), JSON.stringify(updated));
    setReviews(updated);
  };

  const deleteReview = (id, indexToDelete) => {
    const current = loadReviews(id);
    const updated = current.filter((_, i) => i !== indexToDelete);
    localStorage.setItem(getStorageKey(id), JSON.stringify(updated));
    setReviews(updated);
  };

  const getAverageRating = (reviewsList) => {
    if (reviewsList.length === 0) return 0;
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviewsList.length).toFixed(1);
  };

  const renderPlacemarks = useCallback((geojson, mapInstance, filter = '') => {
    if (!mapInstance || !window.ymaps) return;
    mapInstance.geoObjects.removeAll();
    const placemarks = [];

    geojson.features.forEach((feature, index) => {
      const [lon, lat] = feature.geometry.coordinates;
      const properties = feature.properties || {};
      const rawDescription = properties['description'] || '';
      const description = rawDescription.replace(/<\/?br\s*\/?>/gi, '');
      const label = properties['iconCaption'] || '';

      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`❌ Невалидные координаты в объекте ${index + 1}`, feature);
        return;
      }

      const id = `${label}_${lat}_${lon}`;
      const avgRating = getAverageRating(loadReviews(id));
      const stars = '⭐'.repeat(Math.round(avgRating)) || '—';

      const text = `${label} ${description}`.toLowerCase();
      if (!text.includes(filter.toLowerCase())) return;

      const balloonContentLayout = window.ymaps.templateLayoutFactory.createClass(`
        <div style="background: #f3e6f5; color: #4b2a67; padding: 12px; border-radius: 12px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); max-width: 260px;">
          <div style="font-size: 16px; font-weight: bold; color: #6b21a8; margin-bottom: 6px;">${label}</div>
          <div style="font-size: 14px; color: #333; margin-bottom: 8px; white-space: pre-wrap;">${description}</div>
          <div style="font-size: 13px;"><strong>Средняя оценка:</strong> ${avgRating} ${stars}</div>
        </div>
      `);

      const placemark = new window.ymaps.Placemark([lat, lon], {
        hintContent: label
      }, {
        preset: 'islands#blueIcon',
        balloonPanelMaxMapArea: 0,
        hideIconOnBalloonOpen: false,
        balloonCloseButton: true,
        balloonContentLayout: balloonContentLayout,
      });

      placemark.events.add('click', () => {
        setSelectedPlace({ id, label, description });
        setReviews(loadReviews(id));
        placemark.balloon.open();
      });

      mapInstance.geoObjects.add(placemark);
      placemarks.push({ placemark, label, description });
    });

    setAllPlacemarks(placemarks);
  }, [loadReviews]);

  useEffect(() => {
    let loadedGeoJSON = null;

    const initMap = () => {
      const map = new window.ymaps.Map('yandex-map-container', {
        center: [55.030204, 82.92043],
        zoom: 12,
        controls: ['zoomControl'],
      });
      mapRef.current = map;

      fetch('/pet_map.geojson')
        .then(response => response.json())
        .then((geojson) => {
          loadedGeoJSON = geojson;
          renderPlacemarks(geojson, map);
        })
        .catch((err) => {
          console.error('❌ Ошибка загрузки GeoJSON:', err);
        });
    };

    if (window.ymaps?.Map) {
      window.ymaps.ready(initMap);
    } else {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=a244dd44-304c-49d1-b724-a13d0aed0451';
      script.type = 'text/javascript';
      script.crossOrigin = 'anonymous';
      script.onload = () => window.ymaps.ready(initMap);
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [renderPlacemarks]);

  useEffect(() => {
    if (mapRef.current) {
      fetch('/pet_map.geojson')
        .then(response => response.json())
        .then((geojson) => renderPlacemarks(geojson, mapRef.current, searchQuery));
    }
  }, [searchQuery, renderPlacemarks]);

  return (
    <div className="bg-[#baa6ba] p-6 rounded-xl min-h-screen">
      <h2 className="text-3xl font-bold mb-4 text-white">📍 Карта ветсервисов с поиском</h2>

      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="🔍 Поиск по меткам..."
          className="p-2 rounded-xl border border-purple-300 shadow-sm w-full max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <a
          href="https://yandex.ru/maps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white underline whitespace-nowrap"
        >
          🔗 В Яндекс.Картах
        </a>
      </div>

      <div
        id="yandex-map-container"
        className="w-full rounded-2xl border-4 border-white overflow-hidden shadow-xl mb-6"
        style={{ height: '70vh' }}
      />

      {selectedPlace && (
        <div className="bg-[#f3e6f5] border-4 border-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-2xl font-bold text-purple-900">{selectedPlace.label}</h3>
            <button
              className="text-purple-600 hover:text-purple-800 font-semibold"
              onClick={() => setSelectedPlace(null)}
            >
              ❌ Закрыть
            </button>
          </div>

          <p className="mb-2 text-gray-800 italic">{selectedPlace.description}</p>

          <p className="text-sm text-gray-700 mb-2">Средняя оценка: <span className="font-semibold">{getAverageRating(reviews)} ⭐</span></p>

          <div className="mb-1 flex gap-1 text-xl">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                className={i < newReview.rating ? 'text-yellow-400' : 'text-gray-300'}
              >
                ⭐
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mb-3">Вы выбрали: <span className="font-semibold">{newReview.rating}</span> звёзд</p>

          <textarea
            className="w-full border border-purple-300 p-3 rounded-xl mb-4 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows={3}
            value={newReview.text}
            onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
            placeholder="Напишите отзыв..."
          />

          <button
            className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors"
            onClick={() => {
              if (newReview.text.trim()) {
                saveReview(selectedPlace.id, { ...newReview, date: new Date().toLocaleString() });
                setNewReview({ text: '', rating: 0 });
              }
            }}
          >
            💬 Оставить отзыв
          </button>

          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2 text-purple-900">Отзывы:</h4>
            {reviews.length === 0 && <p className="text-gray-600">Пока нет отзывов.</p>}
            {reviews.map((r, i) => (
              <div key={i} className="border-t border-gray-300 pt-3 mt-3 relative">
                <div className="text-yellow-500 mb-1">
                  {Array.from({ length: 5 }, (_, j) => (
                    <span key={j}>{j < r.rating ? '⭐' : '☆'}</span>
                  ))}
                </div>
                <p className="text-sm text-gray-800 mb-1">{r.text}</p>
                <p className="text-xs text-gray-500 mb-1">{r.date}</p>
                <button
                  className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700"
                  onClick={() => deleteReview(selectedPlace.id, i)}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;