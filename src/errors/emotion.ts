import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class EmotionNotFoundError extends AppError {
  constructor(id?: string) {
    const message = id
      ? `Запис емоції з ID ${id} не знайдено`
      : "Запис емоції не знайдено";
    super(message, 404, ERROR_CODES.EMOTION_NOT_FOUND);
  }
}

export class EmotionCreationFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося створити запис емоції: ${reason}`
      : "Не вдалося створити запис емоції";
    super(message, 500, ERROR_CODES.EMOTION_CREATION_FAILED);
  }
}

export class EmotionUpdateFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося оновити запис емоції: ${reason}`
      : "Не вдалося оновити запис емоції";
    super(message, 500, ERROR_CODES.EMOTION_UPDATE_FAILED);
  }
}

export class EmotionDeletionFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося видалити запис емоції: ${reason}`
      : "Не вдалося видалити запис емоції";
    super(message, 500, ERROR_CODES.EMOTION_DELETION_FAILED);
  }
}

export class InvalidEmotionDataError extends AppError {
  constructor(field?: string) {
    const message = field
      ? `Недійсні дані емоції: ${field}`
      : "Недійсні дані емоції";
    super(message, 400, ERROR_CODES.INVALID_EMOTION_DATA);
  }
}

export class InvalidIntensityLevelError extends AppError {
  constructor(intensity?: string) {
    const message = intensity
      ? `Недійсний рівень інтенсивності: ${intensity}`
      : "Недійсний рівень інтенсивності";
    super(message, 400, ERROR_CODES.INVALID_INTENSITY_LEVEL);
  }
}

export class InvalidTimeRangeError extends AppError {
  constructor(timeRange?: string) {
    const message = timeRange
      ? `Недійсний часовий діапазон: ${timeRange}`
      : "Недійсний часовий діапазон";
    super(message, 400, ERROR_CODES.INVALID_TIME_RANGE);
  }
}

export class EmotionStatsGenerationError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося згенерувати статистику емоцій: ${reason}`
      : "Не вдалося згенерувати статистику емоцій";
    super(message, 500, ERROR_CODES.EMOTION_STATS_GENERATION_FAILED);
  }
}

export class EmotionPatternAnalysisError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося проаналізувати патерни емоцій: ${reason}`
      : "Не вдалося проаналізувати патерни емоцій";
    super(message, 500, ERROR_CODES.EMOTION_PATTERN_ANALYSIS_FAILED);
  }
}

export class AIAnalysisFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося виконати ШІ-аналіз емоцій: ${reason}`
      : "Не вдалося виконати ШІ-аналіз емоцій";
    super(message, 500, ERROR_CODES.AI_ANALYSIS_FAILED);
  }
}

export class RecommendationGenerationFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося згенерувати рекомендації: ${reason}`
      : "Не вдалося згенерувати рекомендації";
    super(message, 500, ERROR_CODES.RECOMMENDATION_GENERATION_FAILED);
  }
}

export class EmotionSearchFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося виконати пошук емоцій: ${reason}`
      : "Не вдалося виконати пошук емоцій";
    super(message, 500, ERROR_CODES.EMOTION_SEARCH_FAILED);
  }
}

export class SummaryGenerationFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося згенерувати загальний підсумок: ${reason}`
      : "Не вдалося згенерувати загальний підсумок";
    super(message, 500, ERROR_CODES.SUMMARY_GENERATION_FAILED);
  }
}

export class EmotionEnrichmentFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося збагатити дані емоції: ${reason}`
      : "Не вдалося збагатити дані емоції";
    super(message, 500, ERROR_CODES.EMOTION_ENRICHMENT_FAILED);
  }
}

export class InvalidEmotionFiltersError extends AppError {
  constructor(invalidFilters?: string[]) {
    const message = invalidFilters?.length
      ? `Недійсні фільтри емоцій: ${invalidFilters.join(", ")}`
      : "Недійсні фільтри емоцій";
    super(message, 400, ERROR_CODES.INVALID_EMOTION_FILTERS);
  }
}

export class EmotionDataFetchFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося отримати дані емоцій: ${reason}`
      : "Не вдалося отримати дані емоцій";
    super(message, 500, ERROR_CODES.EMOTION_DATA_FETCH_FAILED);
  }
}

export class OpenAIServiceError extends AppError {
  constructor(operation?: string, reason?: string) {
    let message = "Помилка сервісу OpenAI";
    if (operation && reason) {
      message = `Помилка сервісу OpenAI під час ${operation}: ${reason}`;
    } else if (operation) {
      message = `Помилка сервісу OpenAI під час ${operation}`;
    } else if (reason) {
      message = `Помилка сервісу OpenAI: ${reason}`;
    }
    super(message, 502, ERROR_CODES.OPENAI_SERVICE_ERROR);
  }
}

export class IntensityConversionError extends AppError {
  constructor(value?: string) {
    const message = value
      ? `Не вдалося конвертувати рівень інтенсивності: ${value}`
      : "Не вдалося конвертувати рівень інтенсивності";
    super(message, 400, ERROR_CODES.INTENSITY_CONVERSION_ERROR);
  }
}
