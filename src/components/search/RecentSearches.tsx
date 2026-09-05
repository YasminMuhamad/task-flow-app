import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";

interface RecentSearchesProps {
  searches: string[];
  onSelect: (item: string) => void;
  onRemove: (item: string) => void;
  onClearAll: () => void;
  styles: any;
  colors: any;
}

export const RecentSearches = ({ searches, onSelect, onRemove, onClearAll, styles, colors }: RecentSearchesProps) => {
  if (searches.length === 0) return null;

  return (
    <View style={styles.recentSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
        <TouchableOpacity onPress={onClearAll}>
          <Text style={styles.clearAllText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentWrap}>
        {searches.map((item, idx) => (
          <View key={idx} style={styles.recentChip}>
            <TouchableOpacity onPress={() => onSelect(item)}>
              <Text style={styles.recentText}>{item}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onRemove(item)} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
              <Svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <Path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};