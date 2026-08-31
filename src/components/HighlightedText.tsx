import React from 'react';
import { Text, TextStyle } from 'react-native';

interface HighlightedTextProps {
  text: string;
  query: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  query,
  style,
  highlightStyle = { backgroundColor: '#d5fe8a', color: '#854D0E', fontWeight: 'bold' },
}) => {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return <Text style={style}>{text}</Text>;
  }

  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  const parts = text.split(regex);

  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.toLowerCase() === cleanQuery.toLowerCase() ? (
          <Text key={index} style={[style, highlightStyle]}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};