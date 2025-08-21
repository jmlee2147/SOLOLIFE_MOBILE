import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';

const Header = ({ leftIcon, rightIcon, title }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        {leftIcon && <Icon name={leftIcon} width={24} height={24} />}
      </TouchableOpacity>

      {title && <Text style={styles.title}>{title}</Text>}

      <TouchableOpacity>
        {rightIcon && <Icon name={rightIcon} width={24} height={24} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Header;