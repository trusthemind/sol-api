export enum IntensityLevel {
  VERY_LOW = "VERY_LOW",
  LOW = "LOW", 
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH"
}

export class IntensityConverter {
  static toDatabase(input: any): IntensityLevel | null {
    if (typeof input === 'number') {
      const numberToEnum: Record<number, IntensityLevel> = {
        1: IntensityLevel.VERY_LOW,
        2: IntensityLevel.LOW,
        3: IntensityLevel.MODERATE,
        4: IntensityLevel.HIGH,
        5: IntensityLevel.VERY_HIGH
      };
      return numberToEnum[input] || null;
    }
    
    // Handle string input
    if (typeof input === 'string') {
      // Try as number string first
      const numValue = Number(input);
      if (!isNaN(numValue) && Number.isInteger(numValue)) {
        const numberToEnum: Record<number, IntensityLevel> = {
          1: IntensityLevel.VERY_LOW,
          2: IntensityLevel.LOW,
          3: IntensityLevel.MODERATE,
          4: IntensityLevel.HIGH,
          5: IntensityLevel.VERY_HIGH
        };
        if (numberToEnum[numValue]) {
          return numberToEnum[numValue];
        }
      }
      
      // Try as enum string
      const upperLevel = input.toUpperCase() as IntensityLevel;
      if (Object.values(IntensityLevel).includes(upperLevel)) {
        return upperLevel;
      }
    }
    
    return null;
  }

  /**
   */
  static getDescription(level: IntensityLevel | string): string {
    const descriptions: Record<IntensityLevel, string> = {
      [IntensityLevel.VERY_LOW]: "Very Low - Barely noticeable emotion",
      [IntensityLevel.LOW]: "Low - Mild emotional response",
      [IntensityLevel.MODERATE]: "Moderate - Noticeable but manageable", 
      [IntensityLevel.HIGH]: "High - Strong emotional response",
      [IntensityLevel.VERY_HIGH]: "Very High - Overwhelming emotion"
    };

    const dbLevel = this.toDatabase(level);
    return dbLevel ? descriptions[dbLevel] : "Invalid intensity level";
  }

  /**
   * Validate if input is valid intensity level
   */
  static isValid(input: any): boolean {
    return this.toDatabase(input) !== null;
  }

  /**
   * Get all valid intensity levels with descriptions
   */
  static getAllLevels(): Array<{level: IntensityLevel, description: string}> {
    return [
      { level: IntensityLevel.VERY_LOW, description: this.getDescription(IntensityLevel.VERY_LOW) },
      { level: IntensityLevel.LOW, description: this.getDescription(IntensityLevel.LOW) },
      { level: IntensityLevel.MODERATE, description: this.getDescription(IntensityLevel.MODERATE) },
      { level: IntensityLevel.HIGH, description: this.getDescription(IntensityLevel.HIGH) },
      { level: IntensityLevel.VERY_HIGH, description: this.getDescription(IntensityLevel.VERY_HIGH) }
    ];
  }

  /**
   * Get valid input examples
   */
  static getValidInputs(): string[] {
    return [
      "Numbers: 1, 2, 3, 4, 5",
      "String numbers: '1', '2', '3', '4', '5'",
      "Levels: 'VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'",
      "Case insensitive: 'very_low', 'high', 'MODERATE'"
    ];
  }
}

// Simplified database helper
export class IntensityDatabaseHelper {
  /**
   * Prepare intensity value for database save (returns enum string)
   */
  static prepareForSave(intensity: any): IntensityLevel {
    const dbValue = IntensityConverter.toDatabase(intensity);
    if (dbValue === null) {
      throw new Error(`Invalid intensity value: ${intensity}. Must be number 1-5 or level string (VERY_LOW, LOW, MODERATE, HIGH, VERY_HIGH)`);
    }
    return dbValue;
  }

  /**
   * Enrich database result with description
   */
  static enrichResponse(emotionEntry: any): any {
    if (emotionEntry.intensity) {
      return {
        ...emotionEntry,
        intensityDescription: IntensityConverter.getDescription(emotionEntry.intensity)
      };
    }
    return emotionEntry;
  }

  /**
   * Enrich array of emotion entries
   */
  static enrichResponseArray(emotionEntries: any[]): any[] {
    return emotionEntries.map(entry => this.enrichResponse(entry));
  }
}

// Export utility functions
export const intensityUtils = {
  toLevel: IntensityConverter.toDatabase,
  getDescription: IntensityConverter.getDescription,
  isValid: IntensityConverter.isValid,
  getAllLevels: IntensityConverter.getAllLevels,
  prepareForSave: IntensityDatabaseHelper.prepareForSave,
  enrichResponse: IntensityDatabaseHelper.enrichResponse
};