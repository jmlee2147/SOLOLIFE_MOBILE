import React from 'react';
import { Image } from 'react-native';

const icons = {
    book: require('../../assets/icons/book.png'),
    cafe: require('../../assets/icons/cafe.png'),
    calendar: require('../../assets/icons/calendar.png'),
    camera: require('../../assets/icons/camera.png'),
    clock: require('../../assets/icons/clock.png'),
    gallery: require('../../assets/icons/gallery.png'),
    heart: require('../../assets/icons/heart.png'),
    home: require('../../assets/icons/home.png'),
    journey: require('../../assets/icons/journey.png'),
    location: require('../../assets/icons/location.png'),
    map: require('../../assets/icons/map.png'),
    park: require('../../assets/icons/park.png'),
    profile: require('../../assets/icons/profile.png'),
    restaurant: require('../../assets/icons/restaurant.png'),
    search: require('../../assets/icons/search.png'),
    shop: require('../../assets/icons/shop.png'),
  };

const Icon = ({ name, width = 24, height = 24, color }) => {
  if (!icons[name]) {
    console.warn(`Icon "${name}" does not exist`);
    return null;
  }

  return (
    <Image
      source={icons[name]}
      style={{
        width,
        height,
      }}
      resizeMode="contain"
    />
  );
};

export default Icon;