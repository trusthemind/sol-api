import { EmotionType, IEmotionEntry } from "@/model/emotional.model";
import { EmotionStats } from "@/repositories/emotional.repository";
import OpenAI from "openai";
import { Logger } from "@/utils/logger";
import { EmotionUtils } from "@/utils/emotionConverter";
export interface AnalysisResult {
  insights: string[];
  trends: string[];
  concerns: string[];
  positives: string[];
  emotionalBalance: string;
  riskFactors: string[];
}

export interface RecommendationResult {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  professionalHelp: boolean;
  resources: string[];
  coping: string[];
}

export interface OverallSummary {
  emotionalWellbeing: string;
  keyInsights: string[];
  actionPlan: string[];
  progress: string;
  nextSteps: string[];
}

export class OpenAIService {
  private openai: OpenAI | null;
  private readonly logger: Logger;
  private readonly model: string = "gpt-4o-2024-08-06";
  private readonly temperature: number = 0.7;

  constructor() {
    this.logger = new Logger("OpenAIService");
    const apiKey = process.env.OPENAI_API_KEY || "";

    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        maxRetries: 3,
        timeout: 30000,
      });
      this.logger.info("OpenAI клієнт успішно ініціалізовано");
    } else {
      this.openai = null;
      this.logger.warn(
        "OpenAI API ключ не знайдено. Буде використано базовий аналіз."
      );
    }
  }

  async analyzeEmotions(
    emotions: IEmotionEntry[],
    stats: EmotionStats,
    patterns: any[]
  ): Promise<AnalysisResult> {
    try {
      if (!this.openai) {
        return this.generateBasicAnalysis(emotions, stats, patterns);
      }

      const prompt = this.buildAnalysisPrompt(emotions, stats, patterns);
      const response = await this.callOpenAI(prompt, "analysis");

      return this.parseAnalysisResponse(response);
    } catch (error) {
      this.logger.error("Помилка аналізу емоцій:", error);
      return this.generateBasicAnalysis(emotions, stats, patterns);
    }
  }

  async generateRecommendations(
    emotions: IEmotionEntry[] | Partial<IEmotionEntry>,
    stats?: EmotionStats
  ): Promise<RecommendationResult> {
    try {
      if (!this.openai) {
        return this.generateBasicRecommendations(emotions, stats);
      }

      const prompt = this.buildRecommendationPrompt(emotions, stats);
      const response = await this.callOpenAI(prompt, "recommendations");

      return this.parseRecommendationResponse(response);
    } catch (error) {
      this.logger.error("Помилка генерації рекомендацій:", error);
      return this.generateBasicRecommendations(emotions, stats);
    }
  }

  async generateOverallSummary(
    emotions: IEmotionEntry[],
    stats: EmotionStats,
    analysis: AnalysisResult,
    recommendations: RecommendationResult
  ): Promise<OverallSummary> {
    try {
      if (!this.openai) {
        return this.generateBasicSummary(
          emotions,
          stats,
          analysis,
          recommendations
        );
      }

      const prompt = this.buildSummaryPrompt(
        emotions,
        stats,
        analysis,
        recommendations
      );
      const response = await this.callOpenAI(prompt, "summary");

      return this.parseSummaryResponse(response);
    } catch (error) {
      this.logger.error("Помилка генерації підсумку:", error);
      return this.generateBasicSummary(
        emotions,
        stats,
        analysis,
        recommendations
      );
    }
  }

  private async callOpenAI(prompt: string, type: string): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI клієнт не ініціалізовано");
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `Ти досвідчений психолог-консультант, який аналізує емоційні дані та надає підтримку українською мовою. 
            Завжди будь емпатійним та професійним. Рівні інтенсивності: 1-10 (числа, де 1 = дуже низький, 10 = дуже високий).
            Емоції: радісний, задоволений, нейтральний, тривожний, сумний, злий, збуджений, втомлений.
            Всі відповіді надавай українською мовою.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: this.temperature,
        response_format: { type: "json_object" },
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error: any) {
      this.handleOpenAIError(error);
      throw error;
    }
  }

  private handleOpenAIError(error: any): void {
    if (error.status === 429) {
      this.logger.error("Перевищено ліміт запитів. Спробуйте пізніше.");
    } else if (error.status === 401) {
      this.logger.error("Недійсний API ключ.");
    } else if (error.status === 503) {
      this.logger.error("Сервіс OpenAI тимчасово недоступний.");
    } else {
      this.logger.error("Невідома помилка OpenAI:", error);
    }
  }

  private buildAnalysisPrompt(
    emotions: IEmotionEntry[],
    stats: EmotionStats,
    patterns: any[]
  ): string {
    const recentEmotions = emotions.slice(0, 10).map((e) => ({
      emotion: e.emotion,
      emotionUkrainian: EmotionUtils.toUkrainian(e.emotion),
      intensity: e.intensity,
      date: e.createdAt,
      triggers: e.triggers,
      stressLevel: e.stressLevel,
    }));

    return `
    Проаналізуй наступні емоційні дані та надай інсайти українською мовою:

    Статистика:
    - Загальна кількість записів: ${stats.totalEntries}
    - Середня інтенсивність: ${stats.averageIntensity}
    - Найчастіша інтенсивність: ${stats.mostCommonIntensity}
    - Найчастіша емоція: ${stats.mostCommonEmotion} (${EmotionUtils.toUkrainian(
      stats.mostCommonEmotion
    )})
    - Середній рівень стресу: ${stats.averageStressLevel}

    Останні емоції: ${JSON.stringify(recentEmotions, null, 2)}

    Розподіл емоцій: ${JSON.stringify(stats.emotionDistribution, null, 2)}
    
    Розподіл інтенсивності (1-10): ${JSON.stringify(
      stats.intensityDistribution,
      null,
      2
    )}

    Надай JSON відповідь українською мовою з такими полями:
    - insights: Масив ключових інсайтів про емоційні патерни
    - trends: Масив спостережених трендів
    - concerns: Масив потенційних проблем
    - positives: Масив позитивних спостережень
    - emotionalBalance: Загальна оцінка емоційного балансу
    - riskFactors: Масив факторів ризику для моніторингу

    Примітка: Інтенсивність від 1 до 10 (числа).
    `;
  }

  private buildRecommendationPrompt(
    emotions: IEmotionEntry[] | Partial<IEmotionEntry>,
    stats?: EmotionStats
  ): string {
    if (!stats) {
      const emotionsList = Array.isArray(emotions) ? emotions : [emotions];
      const processedEmotions = emotionsList.map((e) => ({
        emotion: e.emotion,
        emotionUkrainian: e.emotion
          ? EmotionUtils.toUkrainian(e.emotion as EmotionType)
          : undefined,
        intensity: e.intensity,
        triggers: e.triggers,
        stressLevel: e.stressLevel,
      }));

      return `
      На основі цих емоційних даних надай персоналізовані рекомендації українською мовою:

      Емоційні записи: ${JSON.stringify(processedEmotions, null, 2)}

      Надай JSON відповідь українською мовою з такими полями:
      - immediate: Масив негайних дій на сьогодні
      - shortTerm: Масив дій на наступний тиждень
      - longTerm: Масив довгострокових стратегій
      - professionalHelp: Boolean чи рекомендована професійна допомога
      - resources: Масив корисних ресурсів або технік
      - coping: Масив стратегій подолання

      Примітка: Інтенсивність від 1 до 10 (числа).
      `;
    }

    return `
    На основі цих емоційних даних надай персоналізовані рекомендації українською мовою:

    Середня інтенсивність: ${stats.averageIntensity}
    Найчастіша інтенсивність: ${stats.mostCommonIntensity}
    Найчастіша емоція: ${stats.mostCommonEmotion} (${EmotionUtils.toUkrainian(
      stats.mostCommonEmotion
    )})
    Середній рівень стресу: ${stats.averageStressLevel}
    Загальна кількість записів: ${stats.totalEntries}

    Розподіл емоцій: ${JSON.stringify(stats.emotionDistribution, null, 2)}
    
    Розподіл інтенсивності (1-10): ${JSON.stringify(
      stats.intensityDistribution,
      null,
      2
    )}

    Надай JSON відповідь українською мовою з такими полями:
    - immediate: Масив негайних дій на сьогодні
    - shortTerm: Масив дій на наступний тиждень
    - longTerm: Масив довгострокових стратегій
    - professionalHelp: Boolean чи рекомендована професійна допомога
    - resources: Масив корисних ресурсів або технік
    - coping: Масив стратегій подолання

    Примітка: Інтенсивність від 1 до 10 (числа).
    `;
  }

  private buildSummaryPrompt(
    emotions: IEmotionEntry[],
    stats: EmotionStats,
    analysis: AnalysisResult,
    recommendations: RecommendationResult
  ): string {
    return `
    Створи загальний підсумок на основі цих даних емоційного здоров'я українською мовою:

    Ключова статистика: ${JSON.stringify({
      totalEntries: stats.totalEntries,
      averageIntensity: stats.averageIntensity,
      mostCommonIntensity: stats.mostCommonIntensity,
      dominantEmotion: `${stats.mostCommonEmotion} (${EmotionUtils.toUkrainian(
        stats.mostCommonEmotion
      )})`,
      averageStressLevel: stats.averageStressLevel,
    })}

    Інсайти аналізу: ${analysis.insights.join(", ")}
    Основні проблеми: ${analysis.concerns.join(", ")}
    Рекомендації: ${recommendations.immediate
      .concat(recommendations.shortTerm)
      .join(", ")}

    Надай JSON відповідь українською мовою з такими полями:
    - emotionalWellbeing: Загальна оцінка емоційного благополуччя
    - keyInsights: Масив найважливіших інсайтів
    - actionPlan: Масив пріоритетних дій
    - progress: Оцінка емоційного прогресу
    - nextSteps: Масив наступних кроків
    `;
  }

  private parseAnalysisResponse(response: string): AnalysisResult {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      this.logger.error("Помилка парсингу відповіді аналізу:", error);
      return {
        insights: ["Не вдалось розпарсити детальний аналіз"],
        trends: ["Дані тренду недоступні"],
        concerns: [],
        positives: [],
        emotionalBalance: "Аналіз в процесі",
        riskFactors: [],
      };
    }
  }

  private parseRecommendationResponse(response: string): RecommendationResult {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      this.logger.error("Помилка парсингу відповіді рекомендацій:", error);
      return {
        immediate: ["Не вдалось отримати детальні рекомендації"],
        shortTerm: [],
        longTerm: [],
        professionalHelp: false,
        resources: [],
        coping: [],
      };
    }
  }

  private parseSummaryResponse(response: string): OverallSummary {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      this.logger.error("Помилка парсингу відповіді підсумку:", error);
      return {
        emotionalWellbeing: "Підсумок формується",
        keyInsights: [],
        actionPlan: [],
        progress: "Аналіз в процесі",
        nextSteps: [],
      };
    }
  }

  private generateBasicAnalysis(
    emotions: IEmotionEntry[],
    stats: EmotionStats,
    patterns: any[]
  ): AnalysisResult {
    const insights: string[] = [];
    const concerns: string[] = [];
    const positives: string[] = [];
    const trends: string[] = [];
    const riskFactors: string[] = [];

    const highIntensityCount = Object.entries(stats.intensityDistribution)
      .filter(([intensity, _]) => parseInt(intensity) >= 8)
      .reduce((sum, [_, count]) => sum + count, 0);

    const lowIntensityCount = Object.entries(stats.intensityDistribution)
      .filter(([intensity, _]) => parseInt(intensity) <= 3)
      .reduce((sum, [_, count]) => sum + count, 0);

    const totalEntries = stats.totalEntries;

    if (highIntensityCount > totalEntries * 0.6) {
      insights.push("Ваші емоції зазвичай мають високу інтенсивність (8-10)");
      concerns.push("Висока емоційна інтенсивність може вказувати на стрес");
    } else if (lowIntensityCount > totalEntries * 0.6) {
      insights.push("Ваші емоційні реакції загалом помірні (1-3)");
      positives.push("Ви підтримуєте емоційну стабільність");
    }

    if (stats.averageIntensity > 7) {
      concerns.push("Висока середня інтенсивність емоцій");
      riskFactors.push("Емоційне перевантаження");
    } else if (stats.averageIntensity >= 4 && stats.averageIntensity <= 6) {
      positives.push("Збалансована емоційна інтенсивність");
    }

    if (stats.averageStressLevel > 7) {
      concerns.push("Виявлено підвищений рівень стресу");
      riskFactors.push("Хронічний високий стрес");
    } else if (stats.averageStressLevel < 4) {
      positives.push("Добре керований рівень стресу");
    }

    const negativeEmotions = [
      EmotionType.SAD,
      EmotionType.ANGRY,
      EmotionType.ANXIOUS,
      EmotionType.TIRED,
    ];
    const negativeCount = negativeEmotions.reduce(
      (sum, emotion) => sum + (stats.emotionDistribution[emotion] || 0),
      0
    );

    if (negativeCount > totalEntries * 0.6) {
      concerns.push("Висока частота негативних емоцій");
      riskFactors.push("Стійкі патерни негативного настрою");
    } else {
      positives.push("Підтримується гарний емоційний баланс");
    }

    if (totalEntries > 20) {
      insights.push(
        "Послідовне відстеження емоцій показує гарну самосвідомість"
      );
      positives.push("Регулярні емоційні перевірки");
    } else if (totalEntries < 5) {
      insights.push("Доступні обмежені дані відстеження");
    }

    if (stats.mostCommonIntensity >= 9) {
      concerns.push("Переважають емоції дуже високої інтенсивності");
      riskFactors.push("Патерни емоційного перевантаження");
    } else if (
      stats.mostCommonIntensity >= 4 &&
      stats.mostCommonIntensity <= 6
    ) {
      positives.push("Збалансовані рівні емоційної інтенсивності");
    }

    return {
      insights,
      trends: trends.length
        ? trends
        : ["Період відстеження може бути занадто коротким для аналізу трендів"],
      concerns,
      positives,
      emotionalBalance:
        concerns.length > positives.length
          ? "Потребує уваги"
          : "Загалом збалансований",
      riskFactors,
    };
  }

  private generateBasicRecommendations(
    emotions: IEmotionEntry[] | Partial<IEmotionEntry>,
    stats?: EmotionStats
  ): RecommendationResult {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    const resources: string[] = [];
    const coping: string[] = [];
    let professionalHelp = false;

    if (!stats) {
      const emotionsList = Array.isArray(emotions) ? emotions : [emotions];

      emotionsList.forEach((emotion) => {
        if (emotion.emotion === EmotionType.ANXIOUS) {
          immediate.push("Практикуйте глибоке дихання");
          coping.push("Техніки заземлення 5-4-3-2-1");
        }
        if (emotion.emotion === EmotionType.SAD) {
          immediate.push("Зв'яжіться з близькими людьми");
          shortTerm.push("Займіться улюбленими справами");
        }
        if (emotion.emotion === EmotionType.ANGRY) {
          immediate.push("Зробіть перерву та заспокойтеся");
          coping.push("Фізичні вправи для зняття напруги");
        }
        if (emotion.emotion === EmotionType.TIRED) {
          immediate.push("Відпочиньте та поспіть");
          shortTerm.push("Перегляньте режим сну");
        }
        if (emotion.stressLevel && emotion.stressLevel > 7) {
          immediate.push("Зробіть перерву та відпочиньте");
          professionalHelp = true;
        }
        if (emotion.intensity && emotion.intensity >= 8) {
          immediate.push("Використовуйте техніки заземлення");
          coping.push("Техніки емоційної регуляції");
        }
      });

      if (immediate.length === 0)
        immediate.push("Практикуйте усвідомлене дихання");

      if (shortTerm.length === 0) shortTerm.push("Ведіть щоденник емоцій");

      longTerm.push("Розвивайте навички емоційної регуляції");
      resources.push("Додатки для медитації та релаксації");

      return {
        immediate,
        shortTerm,
        longTerm,
        professionalHelp,
        resources,
        coping,
      };
    }

    if (stats.averageStressLevel > 7) {
      immediate.push("Практикуйте глибоке дихання");
      immediate.push("Робіть короткі перерви протягом дня");
      shortTerm.push("Розгляньте техніки управління стресом");
      professionalHelp = true;
    }

    if (stats.averageIntensity > 7) {
      immediate.push("Використовуйте техніки заземлення");
      coping.push("Вправа сенсорного заземлення 5-4-3-2-1");
      shortTerm.push("Практикуйте навички емоційної регуляції");
    }

    const sadnessCount = stats.emotionDistribution[EmotionType.SAD] || 0;
    if (sadnessCount > stats.totalEntries * 0.3) {
      immediate.push("Займіться улюбленими справами");
      shortTerm.push("Зв'яжіться з друзями або родиною для підтримки");
      longTerm.push("Розгляньте можливість консультації з психологом");
      professionalHelp = true;
    }

    const anxietyCount = stats.emotionDistribution[EmotionType.ANXIOUS] || 0;
    if (anxietyCount > stats.totalEntries * 0.3) {
      immediate.push("Практикуйте медитацію усвідомленості");
      coping.push("Прогресивна м'язова релаксація");
      resources.push("Додатки для медитації: Headspace, Calm");
    }

    const angerCount = stats.emotionDistribution[EmotionType.ANGRY] || 0;
    if (angerCount > stats.totalEntries * 0.2) {
      immediate.push("Практикуйте техніки охолодження");
      shortTerm.push("Знайдіть здорові способи вираження гніву");
      coping.push("Фізичні вправи або спорт");
    }

    longTerm.push("Підтримуйте регулярний режим фізичних вправ");
    longTerm.push("Встановіть постійний графік сну");
    resources.push("Ведення щоденника для емоційної обробки");
    resources.push("Групи підтримки психічного здоров'я");

    const positiveEmotions = [
      EmotionType.JOYFUL,
      EmotionType.SATISFIED,
      EmotionType.EXCITED,
    ];
    const positiveCount = positiveEmotions.reduce(
      (sum, emotion) => sum + (stats.emotionDistribution[emotion] || 0),
      0
    );

    if (positiveCount < stats.totalEntries * 0.3) {
      shortTerm.push("Заплануйте приємні заходи");
      longTerm.push("Будуйте позитивні соціальні зв'язки");
      resources.push("Вправи вдячності");
    }

    return {
      immediate,
      shortTerm,
      longTerm,
      professionalHelp,
      resources,
      coping,
    };
  }

  private generateBasicSummary(
    emotions: IEmotionEntry[],
    stats: EmotionStats,
    analysis: AnalysisResult,
    recommendations: RecommendationResult
  ): OverallSummary {
    const wellbeingScore = this.calculateWellbeingScore(stats);

    return {
      emotionalWellbeing:
        wellbeingScore > 7
          ? "Добре"
          : wellbeingScore > 4
          ? "Задовільне"
          : "Потребує уваги",
      keyInsights: analysis.insights.slice(0, 3),
      actionPlan: recommendations.immediate.concat(
        recommendations.shortTerm.slice(0, 2)
      ),
      progress: `Відстежено ${stats.totalEntries} емоцій з середньою інтенсивністю ${stats.averageIntensity}/10`,
      nextSteps: recommendations.longTerm.slice(0, 3),
    };
  }

  private calculateWellbeingScore(stats: EmotionStats): number {
    const positiveEmotions = [
      EmotionType.JOYFUL,
      EmotionType.SATISFIED,
      EmotionType.EXCITED,
    ];
    const positiveCount = positiveEmotions.reduce(
      (sum, emotion) => sum + (stats.emotionDistribution[emotion] || 0),
      0
    );

    const positiveRatio =
      stats.totalEntries > 0 ? positiveCount / stats.totalEntries : 0;

    const intensityFactor = 1 - (stats.averageIntensity - 1) / 9;
    const stressFactor = stats.averageStressLevel
      ? (11 - stats.averageStressLevel) / 10
      : 0.5;

    return (
      Math.round(
        (positiveRatio * 4 + intensityFactor * 3 + stressFactor * 3) * 10
      ) / 10
    );
  }
}
