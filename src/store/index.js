import { configureStore } from '@reduxjs/toolkit';
import heartReducer from './slices/heart.slice';
import homeReducer from './slices/home.slice';
import journeyReducer from './slices/journey.slice';
import mapReducer from './slices/map.slice';
import userReducer from './slices/user.slice';

const store = configureStore({
  reducer: {
    journey: journeyReducer,
    map: mapReducer,
    home: homeReducer,
    heart: heartReducer,
    user: userReducer,
  },
});

export default store;