import React, { useState, useEffect, useCallback } from 'react';
import { 
  CustomerJourneyMap as JourneyMapType, 
  JourneyStage, 
  JourneyTouchpoint, 
  JourneyStageLabels, 
  TouchpointTypeLabels, 
  HealthStatusLabels 
} from '../../types/customerJourney';
import { 
  getCustomerJourneyMap, 
  getStageColor, 
  getPriorityColor, 
  getSentimentColor, 
  formatPersianDate, 
  formatPersianDateTime, 
  getRelativeTime, 
  getTouchpointIcon, 
  formatCurrency, 
  getActionTypeIcon, 
  getCriticalMomentIcon 
} from '../../services/customerJourneyService';

interface CustomerJourneyMapProps {
  customerId: string;
}

export default function CustomerJourneyMap({ customerId }: CustomerJourneyMapProps) {
  const [journeyMap, setJourneyMap] = useState<JourneyMapType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
  const [selectedTouchpoint, setSelectedTouchpoint] = useState<JourneyTouchpoint | null>(null);
  const [activeView, setActiveView] = useState<'timeline' | 'stages' | 'actions' | 'patterns'>('timeline');

  const fetchJourneyMap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerJourneyMap(customerId);
      setJourneyMap(data);
    } catch (err) {
      console.error('Error fetching journey map:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت نقشه مسیر مشتری');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchJourneyMap();
  }, [fetchJourneyMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchJourneyMap}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!journeyMap) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">اطلاعات مسیر مشتری موجود نیست</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Journey Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">نقشه مسیر مشتری</h2>
            <p className="text-gray-600">تجزیه و تحلیل کامل مسیر و تجربه مشتری</p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              journeyMap.journeyHealth === 'HEALTHY' ? 'bg-green-100 text-green-800' :
              journeyMap.journeyHealth === 'AT_RISK' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {HealthStatusLabels[journeyMap.journeyHealth]}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStageColor(journeyMap.currentStage)}-100 text-${getStageColor(journeyMap.currentStage)}-800`}>
              {JourneyStageLabels[journeyMap.currentStage]}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-blue-600 text-2xl ml-3">📊</div>
              <div>
                <p className="text-sm text-blue-600">مدت مسیر</p>
                <p className="text-lg font-semibold text-blue-900">{journeyMap.totalJourneyDuration} روز</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-600 text-2xl ml-3">💰</div>
              <div>
                <p className="text-sm text-green-600">ارزش کل</p>
                <p className="text-lg font-semibold text-green-900">{formatCurrency(journeyMap.totalValue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-purple-600 text-2xl ml-3">🎯</div>
              <div>
                <p className="text-sm text-purple-600">نقاط تماس</p>
                <p className="text-lg font-semibold text-purple-900">{journeyMap.totalTouchpoints}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-orange-600 text-2xl ml-3">📈</div>
              <div>
                <p className="text-sm text-orange-600">احتمال بازگشت</p>
                <p className="text-lg font-semibold text-orange-900">{Math.round(journeyMap.retentionProbability)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex space-x-1 space-x-reverse mb-6">
          {[
            { key: 'timeline', label: '⏱️ خط زمانی', icon: '⏱️' },
            { key: 'stages', label: '🎯 مراحل', icon: '🎯' },
            { key: 'actions', label: '💡 پیشنهادات', icon: '💡' },
            { key: 'patterns', label: '📊 الگوها', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as 'timeline' | 'stages' | 'actions' | 'patterns')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === tab.key 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline View */}
        {activeView === 'timeline' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">خط زمانی نقاط تماس</h3>
            <div className="max-h-96 overflow-y-auto">
              {journeyMap.touchpointTimeline.map((touchpoint) => (
                <div
                  key={touchpoint.id}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedTouchpoint?.id === touchpoint.id 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTouchpoint(touchpoint)}
                >
                  <div className="flex-shrink-0 ml-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-${getSentimentColor(touchpoint.sentiment)}-500`}>
                      {getTouchpointIcon(touchpoint.touchpointType)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {TouchpointTypeLabels[touchpoint.touchpointType]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(touchpoint.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{touchpoint.content}</p>
                    <div className="flex items-center mt-2 space-x-4 space-x-reverse">
                      <span className={`px-2 py-1 rounded-full text-xs bg-${getStageColor(touchpoint.stage)}-100 text-${getStageColor(touchpoint.stage)}-800`}>
                        {JourneyStageLabels[touchpoint.stage]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {touchpoint.channel}
                      </span>
                      {touchpoint.value > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          {formatCurrency(touchpoint.value)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stages View */}
        {activeView === 'stages' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">مراحل مسیر مشتری</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {journeyMap.stageHistory.map((stage) => (
                <div
                  key={stage.stage}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedStage === stage.stage 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStage(stage.stage)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-lg font-semibold text-${getStageColor(stage.stage)}-800`}>
                      {JourneyStageLabels[stage.stage]}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs bg-${getSentimentColor(stage.sentiment)}-100 text-${getSentimentColor(stage.sentiment)}-800`}>
                      {stage.sentiment === 'POSITIVE' ? 'مثبت' : stage.sentiment === 'NEGATIVE' ? 'منفی' : 'خنثی'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">مدت:</p>
                      <p className="font-medium">{stage.duration} روز</p>
                    </div>
                    <div>
                      <p className="text-gray-600">تعداد تماس:</p>
                      <p className="font-medium">{stage.touchpointCount}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">از {formatPersianDate(stage.stageStart)} 
                      {stage.stageEnd && ` تا ${formatPersianDate(stage.stageEnd)}`}</p>
                  </div>
                  {stage.challenges.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-red-600 font-medium mb-1">چالش‌ها:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {stage.challenges.slice(0, 2).map((challenge, idx) => (
                          <li key={idx}>• {challenge}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions View */}
        {activeView === 'actions' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">پیشنهادات و اقدامات</h3>
            
            {/* Next Best Actions */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">بهترین اقدامات بعدی</h4>
              <div className="space-y-3">
                {journeyMap.nextBestActions.map((action) => (
                  <div key={action.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="text-2xl ml-3">
                          {getActionTypeIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <h5 className="font-medium text-gray-900">{action.action}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs bg-${getPriorityColor(action.priority)}-100 text-${getPriorityColor(action.priority)}-800`}>
                              {action.priority === 'HIGH' ? 'بالا' : action.priority === 'MEDIUM' ? 'متوسط' : 'پایین'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{action.rationale}</p>
                          <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                            <span>📢 {action.channel}</span>
                            <span>⏰ {action.timing === 'IMMEDIATE' ? 'فوری' : action.timing === 'WITHIN_WEEK' ? 'طی هفته' : 'طی ماه'}</span>
                            <span>🎯 اعتماد: {action.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Moments */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">لحظات حیاتی</h4>
              <div className="space-y-3">
                {journeyMap.criticalMoments.map((moment) => (
                  <div key={moment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="text-2xl ml-3">
                        {getCriticalMomentIcon(moment.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                          <h5 className="font-medium text-gray-900">{moment.description}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs bg-${getPriorityColor(moment.impact)}-100 text-${getPriorityColor(moment.impact)}-800`}>
                            {moment.impact === 'HIGH' ? 'بالا' : moment.impact === 'MEDIUM' ? 'متوسط' : 'پایین'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500 mb-2">
                          <span>📊 احتمال: {moment.probability}%</span>
                          <span>⏳ زمان: {moment.timeframe}</span>
                        </div>
                        {moment.mitigationActions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 font-medium mb-1">اقدامات پیشگیرانه:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {moment.mitigationActions.map((action, idx) => (
                                <li key={idx}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Patterns View */}
        {activeView === 'patterns' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الگوهای رفتاری</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Behavior Patterns */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">الگوهای رفتاری</h4>
                <div className="space-y-3">
                  {journeyMap.behaviorPatterns.map((pattern) => (
                    <div key={pattern.pattern} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{pattern.description}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs bg-${getSentimentColor(pattern.impact)}-100 text-${getSentimentColor(pattern.impact)}-800`}>
                          {pattern.impact === 'POSITIVE' ? 'مثبت' : pattern.impact === 'NEGATIVE' ? 'منفی' : 'خنثی'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">تکرار: {pattern.frequency}</p>
                      {pattern.examples.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <p className="font-medium mb-1">مثال‌ها:</p>
                          <ul className="space-y-1">
                            {pattern.examples.slice(0, 2).map((example, idx) => (
                              <li key={idx}>• {example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">ترجیحات</h4>
                <div className="space-y-4">
                  {/* Preferred Channels */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">کانال‌های مورد علاقه</h5>
                    <div className="space-y-2">
                      {journeyMap.preferredChannels.slice(0, 3).map((channel, index) => (
                        <div key={channel} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{channel}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`bg-blue-500 h-2 rounded-full`}
                              style={{ width: `${Math.max(20, 100 - (index * 25))}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Peak Times */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">زمان‌های پیک</h5>
                    <div className="space-y-2">
                      {journeyMap.peakEngagementTimes.slice(0, 3).map((time, index) => (
                        <div key={time} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{time}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`bg-green-500 h-2 rounded-full`}
                              style={{ width: `${Math.max(20, 100 - (index * 25))}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Touchpoint Details Modal */}
      {selectedTouchpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">جزئیات نقطه تماس</h3>
              <button
                onClick={() => setSelectedTouchpoint(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">نوع:</p>
                <p className="font-medium">{TouchpointTypeLabels[selectedTouchpoint.touchpointType]}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">زمان:</p>
                <p className="font-medium">{formatPersianDateTime(selectedTouchpoint.timestamp)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">محتوا:</p>
                <p className="font-medium">{selectedTouchpoint.content}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">مرحله:</p>
                <p className="font-medium">{JourneyStageLabels[selectedTouchpoint.stage]}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">کانال:</p>
                <p className="font-medium">{selectedTouchpoint.channel}</p>
              </div>
              
              {selectedTouchpoint.value > 0 && (
                <div>
                  <p className="text-sm text-gray-600">ارزش:</p>
                  <p className="font-medium">{formatCurrency(selectedTouchpoint.value)}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600">احساس:</p>
                <p className="font-medium">{
                  selectedTouchpoint.sentiment === 'POSITIVE' ? 'مثبت' : 
                  selectedTouchpoint.sentiment === 'NEGATIVE' ? 'منفی' : 'خنثی'
                }</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 