const React = require('react');
const { Text } = require('react-native');

// Mock icon component — hiển thị icon name dưới dạng text để test có thể query được
const MockIcon = ({ name, testID, size, color, style }) =>
  React.createElement(Text, { testID, style }, name || '');

module.exports = {
  Ionicons: MockIcon,
  MaterialIcons: MockIcon,
  FontAwesome: MockIcon,
  FontAwesome5: MockIcon,
  AntDesign: MockIcon,
  Feather: MockIcon,
  Entypo: MockIcon,
  MaterialCommunityIcons: MockIcon,
  Octicons: MockIcon,
  SimpleLineIcons: MockIcon,
  Zocial: MockIcon,
  EvilIcons: MockIcon,
};
