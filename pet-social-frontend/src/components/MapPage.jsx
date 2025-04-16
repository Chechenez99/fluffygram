import React, { useEffect, useState, useRef, useCallback } from 'react';

const MapPage = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ text: '', rating: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [geoData, setGeoData] = useState(null);
  const mapRef = useRef(null);
  const geoDataLoadedRef = useRef(false);
  const searchTimeoutRef = useRef(null);

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
    if (!reviewsList || reviewsList.length === 0) return 0;
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviewsList.length).toFixed(1);
  };

  const renderPlacemarks = useCallback((geojson, mapInstance, filter = '') => {
    if (!mapInstance || !window.ymaps || !geojson || !geojson.features) {
      console.warn('❌ Отсутствуют необходимые данные для отображения меток');
      return;
    }
    
    console.log('✅ Отрисовка меток на карте', geojson.features.length, 'с фильтром:', filter);
    mapInstance.geoObjects.removeAll();

    let visibleCount = 0;
    
    geojson.features.forEach((feature, index) => {
      if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn(`❌ Отсутствуют координаты в объекте ${index + 1}`);
        return;
      }

      const [lon, lat] = feature.geometry.coordinates;
      const properties = feature.properties || {};
      const rawDescription = properties['description'] || '';
      const description = rawDescription.replace(/<\/?br\s*\/?>/gi, '');
      const label = properties['iconCaption'] || `Метка ${index + 1}`;

      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`❌ Невалидные координаты в объекте ${index + 1}`, feature);
        return;
      }

      const id = `${label}_${lat}_${lon}`;
      const placeReviews = loadReviews(id);
      const avgRating = getAverageRating(placeReviews);
      const stars = '⭐'.repeat(Math.round(avgRating)) || '—';

      const searchableText = `${label} ${description}`.toLowerCase();
      const currentFilter = (filter || '').toLowerCase();
      
      if (currentFilter && !searchableText.includes(currentFilter)) {
        return;
      }
      
      visibleCount++;

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
        preset: 'islands#violetIcon',
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
    });
    
    console.log(`✅ Отображено ${visibleCount} меток из ${geojson.features.length}`);
  }, [loadReviews]);

  // Загрузка GeoJSON данных
  useEffect(() => {
    if (geoDataLoadedRef.current) return; // Загружаем данные только один раз
    
    console.log('🔄 Загрузка GeoJSON данных...');
    fetch('/pet_map.geojson')
      .then(res => {
        if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('✅ GeoJSON загружен успешно', data);
        setGeoData(data);
        geoDataLoadedRef.current = true;
      })
      .catch(err => {
        console.error('❌ Ошибка загрузки GeoJSON:', err);
        geoDataLoadedRef.current = false; // Разрешаем повторную попытку загрузки
      });
  }, []);

  // Инициализация карты
  useEffect(() => {
    const initMap = () => {
      try {
        console.log('🗺️ Инициализация карты...');
        const mapContainer = document.getElementById('yandex-map-container');
        if (!mapContainer) {
          console.error('❌ Не найден контейнер для карты');
          return;
        }
        
        // Если карта уже инициализирована, не создаем новую
        if (mapRef.current) {
          console.log('ℹ️ Карта уже инициализирована');
          return;
        }
        
        const map = new window.ymaps.Map('yandex-map-container', {
          center: [55.030204, 82.92043],
          zoom: 12,
          controls: ['zoomControl']
        });
        
        mapRef.current = map;
        console.log('✅ Карта инициализирована успешно');
        
        // Если данные уже загружены, отрисовываем метки
        if (geoData) {
          console.log('ℹ️ Данные уже загружены, отрисовываем метки');
          renderPlacemarks(geoData, map, searchQuery);
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации карты:', error);
      }
    };

    const loadYmaps = () => {
      if (window.ymaps?.Map) {
        console.log('ℹ️ API Яндекс.Карт уже загружен');
        if (window.ymaps.ready.done) {
          initMap();
        } else {
          window.ymaps.ready(initMap);
        }
      } else {
        console.log('🔄 Загрузка API Яндекс.Карт...');
        const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=a244dd44-304c-49d1-b724-a13d0aed0451';
          script.type = 'text/javascript';
          script.onload = () => {
            console.log('✅ API Яндекс.Карт загружен');
            window.ymaps.ready(initMap);
          };
          script.onerror = () => {
            console.error('❌ Ошибка загрузки API Яндекс.Карт');
          };
          document.head.appendChild(script);
        } else {
          console.log('ℹ️ Скрипт API Яндекс.Карт уже добавлен');
          if (window.ymaps) {
            window.ymaps.ready(initMap);
          }
        }
      }
    };

    loadYmaps();

    return () => {
      if (mapRef.current) {
        console.log('🧹 Очистка карты');
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [geoData, renderPlacemarks, searchQuery]);

  // Обработка изменений в поисковом запросе с дебаунсингом
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (mapRef.current && geoData) {
        console.log('🔍 Применение поискового фильтра:', query);
        renderPlacemarks(geoData, mapRef.current, query);
      }
    }, 300); // Дебаунсинг для снижения нагрузки при быстром вводе
  };

  // Обновление меток при изменении данных
  useEffect(() => {
    if (mapRef.current && geoData) {
      console.log('🔄 Обновление меток с новыми данными');
      renderPlacemarks(geoData, mapRef.current, searchQuery);
    }
  }, [geoData, renderPlacemarks, searchQuery]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-[#baa6ba] p-6 rounded-xl min-h-screen">
      <h2 className="text-3xl font-bold mb-4 text-white">Карта ветсервисов</h2>

      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="🔍 Поиск..."
          className="p-2 rounded-xl border border-purple-300 shadow-sm w-full max-w-md"
          value={searchQuery}
          onChange={handleSearchChange}
        />
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