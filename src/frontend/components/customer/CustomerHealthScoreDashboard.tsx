import React, { useState, useEffect, useCallback } from 'react';
import { CustomerHealthScore } from '../../types/crm';
import { getCustomerHealthScore } from '../../services/customerHealthScoringService';

interface CustomerHealthScoreDashboardProps {
  customerId: string;
}

export default function CustomerHealthScoreDashboard({ customerId }: CustomerHealthScoreDashboardProps) {
  const [healthScore, setHealthScore] = useState<CustomerHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'risks' | 'predictions'>('overview');

  const fetchHealthScore = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomerHealthScore(customerId);
      setHealthScore(data);
    } catch (err) {
      setError('خطا در دریافت امتیاز سلامت مشتری');
      console.error('Error fetching health score:', err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchHealthScore();
  }, [fetchHealthScore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !healthScore) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          {error || 'خطا در بارگذاری اطلاعات'}
        </div>
      </div>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'LOW': return 'کم';
      case 'MEDIUM': return 'متوسط';
      case 'HIGH': return 'بالا';
      case 'CRITICAL': return 'بحرانی';
      default: return 'نامشخص';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-blue-400';
      case 'MEDIUM': return 'bg-yellow-400';
      case 'HIGH': return 'bg-orange-400';
      case 'CRITICAL': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Main Health Score Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className={`text-6xl font-bold ${getHealthScoreColor(healthScore.healthScore)}`}>
              {Math.round(healthScore.healthScore)}
            </div>
            <div className="text-xl text-gray-600 mt-2">امتیاز سلامت مشتری</div>
            <div className="text-sm text-gray-500 mt-1">
              سطح سلامت: <span className="font-semibold">{healthScore.healthLevel}</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                healthScore.healthScore >= 80 ? 'bg-green-500' :
                healthScore.healthScore >= 60 ? 'bg-yellow-500' :
                healthScore.healthScore >= 40 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${healthScore.healthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Risk Assessment Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ارزیابی ریسک</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">ریسک ترک</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(healthScore.riskAssessment.churnRisk.riskLevel)}`}>
                {getRiskLevelLabel(healthScore.riskAssessment.churnRisk.riskLevel)}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{Math.round(healthScore.riskAssessment.churnRisk.probability)}%</div>
            <div className="text-sm text-gray-600">احتمال ترک مشتری</div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">ریسک مشارکت</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(healthScore.riskAssessment.engagementRisk.riskLevel)}`}>
                {getRiskLevelLabel(healthScore.riskAssessment.engagementRisk.riskLevel)}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{Math.round(healthScore.riskAssessment.engagementRisk.probability)}%</div>
            <div className="text-sm text-gray-600">احتمال کاهش مشارکت</div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">ریسک ارزش</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(healthScore.riskAssessment.valueRisk.riskLevel)}`}>
                {getRiskLevelLabel(healthScore.riskAssessment.valueRisk.riskLevel)}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{Math.round(healthScore.riskAssessment.valueRisk.probability)}%</div>
            <div className="text-sm text-gray-600">احتمال کاهش ارزش</div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {healthScore.insights && healthScore.insights.criticalAlerts && healthScore.insights.criticalAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">هشدارهای اخیر</h3>
          <div className="space-y-3">
            {healthScore.insights.criticalAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{alert.alert}</p>
                    <span className="text-sm text-gray-500">{alert.deadline}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.actionRequired}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderComponents = () => (
    <div className="space-y-6">
      {/* Component Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">تفصیل اجزای امتیاز سلامت</h3>
        <div className="space-y-6">
          {Object.entries(healthScore.components).map(([key, component]) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{key}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(component.score)}</div>
                  <div className="text-sm text-gray-600">وزن: {component.weight}%</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="h-3 rounded-full bg-blue-500"
                  style={{ width: `${component.score}%` }}
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">روند:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {component.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRisks = () => (
    <div className="space-y-6">
      {/* Risk Assessment Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">تحلیل ریسک</h3>
        <div className="space-y-6">
          {/* Churn Risk */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">ریسک ترک مشتری</h4>
                <p className="text-sm text-gray-600">احتمال ترک مشتری در ۹۰ روز آینده</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{Math.round(healthScore.riskAssessment.churnRisk.probability)}%</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(healthScore.riskAssessment.churnRisk.riskLevel)}`}>
                  {getRiskLevelLabel(healthScore.riskAssessment.churnRisk.riskLevel)}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">عوامل ریسک:</div>
              <div className="flex flex-wrap gap-2">
                {healthScore.riskAssessment.churnRisk.primaryFactors.map((factor, index) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>پیشنهادات:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {healthScore.riskAssessment.churnRisk.mitigationStrategies.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Engagement Risk */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">ریسک کاهش مشارکت</h4>
                <p className="text-sm text-gray-600">احتمال کاهش فعالیت مشتری</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{Math.round(healthScore.riskAssessment.engagementRisk.probability)}%</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(healthScore.riskAssessment.engagementRisk.riskLevel)}`}>
                  {getRiskLevelLabel(healthScore.riskAssessment.engagementRisk.riskLevel)}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">عوامل ریسک:</div>
              <div className="flex flex-wrap gap-2">
                {healthScore.riskAssessment.engagementRisk.primaryFactors.map((factor, index) => (
                  <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>پیشنهادات:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {healthScore.riskAssessment.engagementRisk.mitigationStrategies.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Value Risk */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">ریسک کاهش ارزش</h4>
                <p className="text-sm text-gray-600">احتمال کاهش ارزش از مشتری</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{Math.round(healthScore.riskAssessment.valueRisk.probability)}%</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(healthScore.riskAssessment.valueRisk.riskLevel)}`}>
                  {getRiskLevelLabel(healthScore.riskAssessment.valueRisk.riskLevel)}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">عوامل ریسک:</div>
              <div className="flex flex-wrap gap-2">
                {healthScore.riskAssessment.valueRisk.primaryFactors.map((factor, index) => (
                  <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>پیشنهادات:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {healthScore.riskAssessment.valueRisk.mitigationStrategies.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="space-y-6">
      {/* Predictions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">پیش‌بینی‌ها</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">بازدید بعدی</h4>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {healthScore.predictionModels.nextVisitPrediction.predictedDate}
            </div>
            <div className="text-sm text-gray-600">
              اعتماد: {Math.round(healthScore.predictionModels.nextVisitPrediction.confidence)}%
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">ارزش آینده</h4>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {healthScore.predictionModels.lifetimeValuePrediction.predictedLTV.toLocaleString()} تومان
            </div>
            <div className="text-sm text-gray-600">
              اعتماد: {Math.round(healthScore.predictionModels.lifetimeValuePrediction.confidence)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'components':
        return renderComponents();
      case 'risks':
        return renderRisks();
      case 'predictions':
        return renderPredictions();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">امتیاز سلامت مشتری</h1>
        <p className="text-gray-600">تحلیل جامع وضعیت سلامت و ریسک مشتری</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            نمای کلی
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'components'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            اجزای امتیاز
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'risks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            تحلیل ریسک
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'predictions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            پیش‌بینی‌ها
          </button>
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
} 