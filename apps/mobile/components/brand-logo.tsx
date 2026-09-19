import { Image } from "react-native";

const logoSource = require("../assets/images/lule-logo.png") as number;

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const width = compact ? 168 : 252;

  return (
    <Image
      accessibilityLabel="LULE — Let Us Learn English"
      source={logoSource}
      resizeMode="contain"
      style={{ width, height: Math.round((width * 941) / 1672) }}
    />
  );
}
