import React from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
interface Props {
  visible: boolean;
  onClose: () => void;
  isStarred?: boolean;
  isOwner: boolean;
  onMenuAction: (action: string) => void;
  onOpenSettings: () => void;
}

export const ProjectMenuModal = ({
  visible,
  onClose,
  isStarred,
  isOwner,
  onMenuAction,
  onOpenSettings,
}: Props) => {
  const { colors, isDark } = useTheme();
  const iconColor = colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.overlay}>
          <View style={[styles.menuContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            {/* 1. Star / Unstar Project */}
            <TouchableOpacity style={styles.menuItem} onPress={() => onMenuAction('starred')}>
              <View style={styles.menuIconContainer}>
                {isStarred ? (
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path
                      d="M8 1.5l2.12 4.3 4.74.69-3.43 3.35.81 4.73L8 12.34l-4.24 2.23.81-4.73-3.43-3.35 4.74-.69L8 1.5z"
                      fill="#EAB308"
                      stroke="#EAB308"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : (
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path
                      d="M8 1.5l2.12 4.3 4.74.69-3.43 3.35.81 4.73L8 12.34l-4.24 2.23.81-4.73-3.43-3.35 4.74-.69L8 1.5z"
                      stroke={iconColor}
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>{isStarred ? 'Unstar Project' : 'Star Project'}</Text>
            </TouchableOpacity>

            {/* 2. Archived Tasks */}
            <TouchableOpacity style={styles.menuItem} onPress={() => onMenuAction('archived')}>
              <View style={styles.menuIconContainer}>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Rect x="1.5" y="3.5" width="13" height="2.5" rx="1" stroke={iconColor} strokeWidth="1.3" />
                  <Path d="M3 6v5.5a1 1 0 001 1h8a1 1 0 001-1V6" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round" />
                  <Path d="M6.5 9.5h3" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Archived Tasks</Text>
            </TouchableOpacity>

            {/* 3. Project Settings */}
            <TouchableOpacity style={styles.menuItem} onPress={onOpenSettings}>
              <View style={styles.menuIconContainer}>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Circle cx="8" cy="8" r="2.2" stroke={iconColor} strokeWidth="1.3" />
                  <Path
                    d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5L3.4 3.4"
                    stroke={iconColor}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Project Settings</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* 4. Leave Project */}
            <TouchableOpacity style={styles.menuItem} onPress={() => onMenuAction('leave')}>
              <View style={styles.menuIconContainer}>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path
                    d="M6 14.5H3.5a1 1 0 01-1-1v-11a1 1 0 011-1H6M10.5 11.5l3-3.5-3-3.5M6.5 8h7"
                    stroke={colors.danger}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.menuText, { color: colors.danger }]}>Leave Project</Text>
            </TouchableOpacity>

            {/* 5. Delete Project (Owner Only) */}
            {isOwner && (
              <TouchableOpacity style={styles.menuItem} onPress={() => onMenuAction('delete')}>
                <View style={styles.menuIconContainer}>
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path
                      d="M2.5 4.5h11M6 4.5V2.8h4v1.7M6.5 7v4.5M9.5 7v4.5M3.8 4.5l.5 8.5a1 1 0 001 .9h5.4a1 1 0 001-.9l.5-8.5"
                      stroke={colors.danger}
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={[styles.menuText, { color: colors.danger }]}>Delete Project</Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 30,
    paddingRight: 30,
  },
  menuContainer: {
    borderRadius: 12,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});