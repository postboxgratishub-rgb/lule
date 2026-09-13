/// <reference types="nativewind/types" />

// In an npm workspace, NativeWind can be hoisted above React Native. Keeping the
// augmentation local makes the styling contract visible to TypeScript regardless
// of the final node_modules layout; NativeWind still provides the runtime transform.
import "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
    cssInterop?: boolean;
  }

  interface TextProps {
    className?: string;
    cssInterop?: boolean;
  }

  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }

  interface ScrollViewProps {
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }

  interface KeyboardAvoidingViewProps {
    contentContainerClassName?: string;
  }
}
