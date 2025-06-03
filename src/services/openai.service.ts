import { EmotionType, IEmotionEntry, IntensityLevel } from "@/model/user/emotional.model";
import { EmotionStats } from "@/repositories/emotional.repository";

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
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async analyzeEmotions(emotions: IEmotionEntry[], stats: EmotionStats, patterns: any[]): Promise<AnalysisResult> {
    try {
      if (!this.apiKey) {
        return this.generateBasicAnalysis(emotions, stats, patterns);
      }

      const prompt = this.buildAnalysisPrompt(emotions, stats, patterns);
      const response = await this.callOpenAI(prompt, 'analysis');
      
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      return this.generateBasicAnalysis(emotions, stats, patterns);
    }
  }

  async generateRecommendations(emotions: IEmotionEntry[], stats: EmotionStats): Promise<RecommendationResult> {
    try {
      if (!this.apiKey) {
        return this.generateBasicRecommendations(emotions, stats);
      }

      const prompt = this.buildRecommendationPrompt(emotions, stats);
      const response = await this.callOpenAI(prompt, 'recommendations');
      
      return this.parseRecommendationResponse(response);
    } catch (error) {
      console.error('OpenAI recommendation error:', error);
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
      if (!this.apiKey) {
        return this.generateBasicSummary(emotions, stats, analysis, recommendations);
      }

      const prompt = this.buildSummaryPrompt(emotions, stats, analysis, recommendations);
      const response = await this.callOpenAI(prompt, 'summary');
      
      return this.parseSummaryResponse(response);
    } catch (error) {
      console.error('OpenAI summary error:', error);
      return this.generateBasicSummary(emotions, stats, analysis, recommendations);
    }
  }

  private async callOpenAI(prompt: string, type: string): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful mental health assistant that provides insights and recommendations based on emotional data. Always be supportive and professional. Intensity levels are: VERY_LOW, LOW, MODERATE, HIGH, VERY_HIGH.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private buildAnalysisPrompt(emotions: IEmotionEntry[], stats: EmotionStats, patterns: any[]): string {
    const recentEmotions = emotions.slice(0, 10).map(e => ({
      emotion: e.emotion,
      intensity: e.intensity,
      date: e.recordedAt,
      triggers: e.triggers,
      stressLevel: e.stressLevel
    }));

    return `
    Analyze the following emotional data and provide insights:

    Stats:
    - Total entries: ${stats.totalEntries}
    - Most common intensity: ${stats.mostCommonIntensity}
    - Most common emotion: ${stats.mostCommonEmotion}
    - Average stress level: ${stats.averageStressLevel}

    Recent emotions: ${JSON.stringify(recentEmotions, null, 2)}

    Emotion distribution: ${JSON.stringify(stats.emotionDistribution, null, 2)}
    
    Intensity distribution: ${JSON.stringify(stats.intensityDistribution, null, 2)}

    Please provide a JSON response with:
    - insights: Array of key insights about emotional patterns
    - trends: Array of observed trends
    - concerns: Array of potential concerns
    - positives: Array of positive observations
    - emotionalBalance: Overall assessment of emotional balance
    - riskFactors: Array of risk factors to monitor

    Note: Intensity levels range from VERY_LOW to VERY_HIGH (strings, not numbers).
    `;
  }

  private buildRecommendationPrompt(emotions: IEmotionEntry[], stats: EmotionStats): string {
    return `
    Based on this emotional data, provide personalized recommendations:

    Most common intensity: ${stats.mostCommonIntensity}
    Most common emotion: ${stats.mostCommonEmotion}
    Average stress level: ${stats.averageStressLevel}
    Total entries: ${stats.totalEntries}

    Emotion distribution: ${JSON.stringify(stats.emotionDistribution, null, 2)}
    
    Intensity distribution: ${JSON.stringify(stats.intensityDistribution, null, 2)}

    Please provide a JSON response with:
    - immediate: Array of immediate actions to take today
    - shortTerm: Array of actions for the next week
    - longTerm: Array of long-term strategies
    - professionalHelp: Boolean indicating if professional help is recommended
    - resources: Array of helpful resources or techniques
    - coping: Array of coping strategies

    Note: Intensity levels are VERY_LOW, LOW, MODERATE, HIGH, VERY_HIGH (strings).
    `;
  }

  private buildSummaryPrompt(
    emotions: IEmotionEntry[], 
    stats: EmotionStats, 
    analysis: AnalysisResult, 
    recommendations: RecommendationResult
  ): string {
    return `
    Create an overall summary based on this emotional health data:

    Key stats: ${JSON.stringify({
      totalEntries: stats.totalEntries,
      mostCommonIntensity: stats.mostCommonIntensity,
      dominantEmotion: stats.mostCommonEmotion,
      averageStressLevel: stats.averageStressLevel
    })}

    Analysis insights: ${analysis.insights.join(', ')}
    Main concerns: ${analysis.concerns.join(', ')}
    Recommendations: ${recommendations.immediate.concat(recommendations.shortTerm).join(', ')}

    Please provide a JSON response with:
    - emotionalWellbeing: Overall wellbeing assessment
    - keyInsights: Array of most important insights
    - actionPlan: Array of prioritized action items
    - progress: Assessment of emotional progress
    - nextSteps: Array of next steps to take
    `;
  }

  private parseAnalysisResponse(response: string): AnalysisResult {
    try {
      return JSON.parse(response);
    } catch {
      return {
        insights: [response.substring(0, 200)],
        trends: ['Unable to parse detailed trends'],
        concerns: [],
        positives: [],
        emotionalBalance: 'Analysis pending',
        riskFactors: []
      };
    }
  }

  private parseRecommendationResponse(response: string): RecommendationResult {
    try {
      return JSON.parse(response);
    } catch {
      return {
        immediate: [response.substring(0, 100)],
        shortTerm: [],
        longTerm: [],
        professionalHelp: false,
        resources: [],
        coping: []
      };
    }
  }

  private parseSummaryResponse(response: string): OverallSummary {
    try {
      return JSON.parse(response);
    } catch {
      return {
        emotionalWellbeing: response.substring(0, 200),
        keyInsights: [],
        actionPlan: [],
        progress: 'Summary in progress',
        nextSteps: []
      };
    }
  }

  private generateBasicAnalysis(emotions: IEmotionEntry[], stats: EmotionStats, patterns: any[]): AnalysisResult {
    const insights = [];
    const concerns = [];
    const positives = [];
    const trends: string[] = [];
    const riskFactors = [];

    // Analyze intensity patterns using string enums
    const highIntensityCount = (stats.intensityDistribution[IntensityLevel.HIGH] || 0) + 
                              (stats.intensityDistribution[IntensityLevel.VERY_HIGH] || 0);
    const totalEntries = stats.totalEntries;

    if (highIntensityCount > totalEntries * 0.6) {
      insights.push("Your emotions tend to be highly intense");
      concerns.push("High emotional intensity may indicate stress");
    } else if (highIntensityCount < totalEntries * 0.2) {
      insights.push("Your emotional responses are generally mild");
      positives.push("You maintain emotional stability");
    }

    // Analyze stress levels
    if (stats.averageStressLevel > 7) {
      concerns.push("Elevated stress levels detected");
      riskFactors.push("Chronic high stress");
    } else if (stats.averageStressLevel < 4) {
      positives.push("Well-managed stress levels");
    }

    // Analyze emotion distribution
    const negativeEmotions = [EmotionType.SAD, EmotionType.ANGRY, EmotionType.ANXIOUS, 
                             EmotionType.FRUSTRATED, EmotionType.OVERWHELMED, EmotionType.LONELY];
    const negativeCount = negativeEmotions.reduce((sum, emotion) => 
      sum + (stats.emotionDistribution[emotion] || 0), 0);
    
    if (negativeCount > totalEntries * 0.6) {
      concerns.push("High frequency of negative emotions");
      riskFactors.push("Persistent negative mood patterns");
    } else {
      positives.push("Good emotional balance maintained");
    }

    // Analyze tracking consistency
    if (totalEntries > 20) {
      insights.push("Consistent emotion tracking shows good self-awareness");
      positives.push("Regular emotional check-ins");
    } else if (totalEntries < 5) {
      insights.push("Limited tracking data available");
    }

    // Analyze most common intensity
    if (stats.mostCommonIntensity === IntensityLevel.VERY_HIGH) {
      concerns.push("Predominant very high intensity emotions");
      riskFactors.push("Emotional overwhelm patterns");
    } else if (stats.mostCommonIntensity === IntensityLevel.MODERATE) {
      positives.push("Balanced emotional intensity levels");
    }

    return {
      insights,
      trends: trends.length ? trends : ["Tracking period may be too short for trend analysis"],
      concerns,
      positives,
      emotionalBalance: concerns.length > positives.length ? "Needs attention" : "Generally balanced",
      riskFactors
    };
  }

  private generateBasicRecommendations(emotions: IEmotionEntry[], stats: EmotionStats): RecommendationResult {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    const resources = [];
    const coping = [];
    let professionalHelp = false;

    // Stress-based recommendations
    if (stats.averageStressLevel > 7) {
      immediate.push("Practice deep breathing exercises");
      immediate.push("Take short breaks throughout the day");
      shortTerm.push("Consider stress management techniques");
      professionalHelp = true;
    }

    // Intensity-based recommendations
    const highIntensityCount = (stats.intensityDistribution[IntensityLevel.HIGH] || 0) + 
                              (stats.intensityDistribution[IntensityLevel.VERY_HIGH] || 0);
    
    if (highIntensityCount > stats.totalEntries * 0.5) {
      immediate.push("Use grounding techniques");
      coping.push("5-4-3-2-1 sensory grounding exercise");
      shortTerm.push("Practice emotional regulation skills");
    }

    // Emotion-specific recommendations
    const sadnessCount = stats.emotionDistribution[EmotionType.SAD] || 0;
    if (sadnessCount > stats.totalEntries * 0.3) {
      immediate.push("Engage in activities you enjoy");
      shortTerm.push("Connect with supportive friends or family");
      longTerm.push("Consider counseling or therapy");
      professionalHelp = true;
    }

    const anxietyCount = stats.emotionDistribution[EmotionType.ANXIOUS] || 0;
    if (anxietyCount > stats.totalEntries * 0.3) {
      immediate.push("Practice mindfulness meditation");
      coping.push("Progressive muscle relaxation");
      resources.push("Meditation apps like Headspace or Calm");
    }

    const overwhelmedCount = stats.emotionDistribution[EmotionType.OVERWHELMED] || 0;
    if (overwhelmedCount > stats.totalEntries * 0.2) {
      immediate.push("Break tasks into smaller, manageable steps");
      shortTerm.push("Practice saying no to additional commitments");
      coping.push("Time management and prioritization techniques");
    }

    // General wellness recommendations
    longTerm.push("Maintain regular exercise routine");
    longTerm.push("Establish consistent sleep schedule");
    resources.push("Journal writing for emotional processing");
    resources.push("Mental health support groups");

    // Positive emotion recommendations
    const positiveEmotions = [EmotionType.HAPPY, EmotionType.EXCITED, EmotionType.CALM, 
                             EmotionType.GRATEFUL, EmotionType.CONFIDENT, EmotionType.PEACEFUL];
    const positiveCount = positiveEmotions.reduce((sum, emotion) => 
      sum + (stats.emotionDistribution[emotion] || 0), 0);

    if (positiveCount < stats.totalEntries * 0.3) {
      shortTerm.push("Schedule enjoyable activities");
      longTerm.push("Build positive social connections");
      resources.push("Gratitude practice exercises");
    }

    return {
      immediate,
      shortTerm,
      longTerm,
      professionalHelp,
      resources,
      coping
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
      emotionalWellbeing: wellbeingScore > 7 ? "Good" : wellbeingScore > 4 ? "Fair" : "Needs attention",
      keyInsights: analysis.insights.slice(0, 3),
      actionPlan: recommendations.immediate.concat(recommendations.shortTerm.slice(0, 2)),
      progress: `Tracked ${stats.totalEntries} emotions with most common intensity of ${stats.mostCommonIntensity}`,
      nextSteps: recommendations.longTerm.slice(0, 3)
    };
  }

  private calculateWellbeingScore(stats: EmotionStats): number {
    const positiveEmotions = [EmotionType.HAPPY, EmotionType.EXCITED, EmotionType.CALM, 
                             EmotionType.GRATEFUL, EmotionType.CONFIDENT, EmotionType.PEACEFUL];
    const positiveCount = positiveEmotions.reduce((sum, emotion) => 
      sum + (stats.emotionDistribution[emotion] || 0), 0);
    
    const positiveRatio = positiveCount / stats.totalEntries;
    
    let intensityFactor = 0.5; // Default moderate score
    switch (stats.mostCommonIntensity) {
      case IntensityLevel.VERY_LOW:
      case IntensityLevel.LOW:
        intensityFactor = 0.8;
        break;
      case IntensityLevel.MODERATE:
        intensityFactor = 0.6;
        break;
      case IntensityLevel.HIGH:
        intensityFactor = 0.4;
        break;
      case IntensityLevel.VERY_HIGH:
        intensityFactor = 0.2;
        break;
    }
    
    const stressFactor = (11 - stats.averageStressLevel) / 10;
    
    return Math.round((positiveRatio * 4 + intensityFactor * 3 + stressFactor * 3) * 10) / 10;
  }
}