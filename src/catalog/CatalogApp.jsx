import { useState } from 'react';
import FilterScreen  from './screens/FilterScreen.jsx';
import CatalogScreen from './screens/CatalogScreen.jsx';
import DetailScreen  from './screens/DetailScreen.jsx';
import BookingScreen from './screens/BookingScreen.jsx';
import AdminScreen   from './screens/AdminScreen.jsx';
import './index.css';
import './configurator.css';

export default function App() {
  if (new URLSearchParams(window.location.search).has('admin')) {
    return <AdminScreen />;
  }

  const [screen,  setScreen]  = useState('filter');
  const [shapes,  setShapes]  = useState([]);
  const [detail,  setDetail]  = useState(null);
  const [booking, setBooking] = useState(null);

  function pickShapes(selected) {
    setShapes(selected);
    setScreen('catalog');
  }

  function openDetail(product) {
    setDetail(product);
    setScreen('detail');
  }

  function openBooking(data) {
    setBooking(data);
    setScreen('booking');
  }

  if (screen === 'filter')  return <FilterScreen onConfirm={pickShapes} />;
  if (screen === 'catalog') return (
    <CatalogScreen
      activeShapes={shapes}
      onChangeShapes={() => setScreen('filter')}
      onOpen={openDetail}
    />
  );
  if (screen === 'booking') return (
    <BookingScreen initial={booking} onBack={() => setScreen('detail')} />
  );

  return <DetailScreen initial={detail} onBack={() => setScreen('catalog')} onBook={openBooking} />;
}
