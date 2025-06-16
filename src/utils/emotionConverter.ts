import { EMOTION_MAPPING, EmotionType, EmotionTypeUkrainian } from "@/model/emotional.model";

export class EmotionUtils {
  static toEnglish(emotion: string): EmotionType {
    const lowerEmotion = emotion.toLowerCase().trim();

    if (Object.values(EmotionType).includes(lowerEmotion as EmotionType))
      return lowerEmotion as EmotionType;

    const englishEmotion =
      EMOTION_MAPPING.toEnglish[lowerEmotion as EmotionTypeUkrainian];
    if (englishEmotion) return englishEmotion;

    return EmotionType.NEUTRAL;
  }

  static toUkrainian(emotion: EmotionType): string {
    return EMOTION_MAPPING.toUkrainian[emotion] || "нейтральний";
  }

  static isValidEmotion(emotion: string): boolean {
    const lowerEmotion = emotion.toLowerCase().trim();
    return (
      Object.values(EmotionType).includes(lowerEmotion as EmotionType) ||
      Object.values(EmotionTypeUkrainian).includes(
        lowerEmotion as EmotionTypeUkrainian
      )
    );
  }

  static validateIntensity(intensity: number): boolean {
    return Number.isInteger(intensity) && intensity >= 1 && intensity <= 10;
  }

  static normalizeIntensity(intensity: number | string): number {
    const num =
      typeof intensity === "string" ? parseFloat(intensity) : intensity;

    if (!Number.isFinite(num)) return 5;
    if (num < 1) return 1;
    if (num > 10) return 10;
    return Math.round(num);
  }

  static getUkrainianEmotions(): string[] {
    return Object.values(EmotionTypeUkrainian);
  }

  static getEnglishEmotions(): EmotionType[] {
    return Object.values(EmotionType);
  }
}
