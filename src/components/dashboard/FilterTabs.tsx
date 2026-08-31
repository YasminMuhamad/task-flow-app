import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export type FilterTab = 'all' | 'mine' | 'starred';

interface FilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: FilterTab[] = ['all', 'mine', 'starred'];

  return (
    <View style={styles.filterTabs}>
      {tabs.map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => onTabChange(t)}
          style={[
            styles.tabButton,
            {
              backgroundColor: activeTab === t ? COLORS.primary : 'transparent',
              borderColor: activeTab === t ? COLORS.primary : COLORS.border,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === t ? COLORS.white : COLORS.muted },
            ]}
          >
            {t === 'all' ? 'All Projects' : t === 'mine' ? 'My Work' : '★ Starred'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});