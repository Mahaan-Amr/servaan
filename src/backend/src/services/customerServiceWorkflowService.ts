import { PrismaClient } from '../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

// Issue Types and Statuses
export type IssueType = 
  | 'COMPLAINT'         // شکایت
  | 'SUGGESTION'        // پیشنهاد
  | 'COMPLIMENT'        // تشکر
  | 'SERVICE_REQUEST'   // درخواست خدمات
  | 'PRODUCT_ISSUE'     // مشکل محصول
  | 'BILLING_ISSUE'     // مشکل مالی
  | 'TECHNICAL_ISSUE'   // مشکل فنی
  | 'GENERAL_INQUIRY';  // استعلام عمومی

export type IssueStatus = 
  | 'OPEN'              // باز
  | 'IN_PROGRESS'       // در حال بررسی
  | 'PENDING_CUSTOMER'  // در انتظار مشتری
  | 'RESOLVED'          // حل شده
  | 'CLOSED'            // بسته شده
  | 'ESCALATED';        // ارجاع داده شده

export type IssuePriority = 
  | 'LOW'               // کم
  | 'MEDIUM'            // متوسط
  | 'HIGH'              // بالا
  | 'URGENT';           // اورژانس

export type WorkflowAction = 
  | 'ASSIGN'            // تخصیص
  | 'ESCALATE'          // ارجاع
  | 'RESOLVE'           // حل کردن
  | 'CLOSE'             // بستن
  | 'REOPEN'            // بازگشایی
  | 'UPDATE'            // بروزرسانی
  | 'COMMENT'           // نظر
  | 'FOLLOW_UP';        // پیگیری

export interface CustomerIssue {
  id: string;
  customerId: string;
  issueType: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  
  // Issue Details
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  
  // Source Information
  source: 'PHONE' | 'EMAIL' | 'SMS' | 'IN_PERSON' | 'WEBSITE' | 'SOCIAL_MEDIA';
  sourceReference?: string;
  
  // Assignment
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: Date;
  
  // Resolution
  resolutionSummary?: string;
  resolutionSteps?: string[];
  satisfactionRating?: number;
  
  // Workflow
  workflowHistory: WorkflowStep[];
  
  // Timing
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  dueDate?: Date;
  
  // Customer Info
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Metadata
  tags: string[];
  metadata?: Record<string, any>;
  
  // SLA Tracking
  responseTime?: number;  // in minutes
  resolutionTime?: number; // in minutes
  slaBreached: boolean;
}

export interface WorkflowStep {
  id: string;
  action: WorkflowAction;
  performedBy: string;
  performedAt: Date;
  description: string;
  previousStatus?: IssueStatus;
  newStatus?: IssueStatus;
  metadata?: Record<string, any>;
}

export interface SatisfactionSurvey {
  id: string;
  customerId: string;
  issueId?: string;
  visitId?: string;
  
  // Survey Details
  surveyType: 'ISSUE_RESOLUTION' | 'GENERAL_SATISFACTION' | 'POST_VISIT' | 'PERIODIC';
  overallRating: number; // 1-5
  
  // Detailed Ratings
  ratings: {
    serviceQuality: number;
    responseTime: number;
    professionalism: number;
    problemResolution: number;
    likelihood: number; // Net Promoter Score
  };
  
  // Feedback
  positiveAspects: string[];
  improvementAreas: string[];
  additionalComments?: string;
  
  // Survey Metadata
  surveyMethod: 'SMS' | 'EMAIL' | 'PHONE' | 'IN_PERSON';
  sentAt: Date;
  completedAt?: Date;
  remindersSent: number;
  
  // Results
  npsScore: number;
  satisfactionLevel: 'VERY_SATISFIED' | 'SATISFIED' | 'NEUTRAL' | 'DISSATISFIED' | 'VERY_DISSATISFIED';
}

export interface AutomatedCareTask {
  id: string;
  customerId: string;
  
  // Task Details
  taskType: 'FOLLOW_UP' | 'BIRTHDAY_GREETING' | 'LOYALTY_REWARD' | 'FEEDBACK_REQUEST' | 'REACTIVATION' | 'SATISFACTION_CHECK';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Scheduling
  scheduledAt: Date;
  executedAt?: Date;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  
  // Execution
  channel: 'SMS' | 'EMAIL' | 'PHONE' | 'IN_PERSON';
  content?: string;
  executionResult?: string;
  
  // Trigger Information
  triggerType: 'TIME_BASED' | 'EVENT_BASED' | 'CONDITION_BASED';
  triggerCondition?: string;
  
  // Assignment
  assignedTo?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAnalytics {
  issueMetrics: {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
    slaCompliance: number;
    issuesByType: Record<IssueType, number>;
    issuesByPriority: Record<IssuePriority, number>;
  };
  
  satisfactionMetrics: {
    averageRating: number;
    npsScore: number;
    responseRate: number;
    satisfactionDistribution: Record<string, number>;
  };
  
  workflowMetrics: {
    automatedTasksCompleted: number;
    manualTasksCompleted: number;
    taskCompletionRate: number;
    averageTaskTime: number;
  };
  
  customerRetention: {
    retentionRate: number;
    churnRate: number;
    reactivationRate: number;
  };
}

/**
 * Create a new customer issue
 */
export async function createCustomerIssue(
  customerId: string,
  issueData: Omit<CustomerIssue, 'id' | 'createdAt' | 'updatedAt' | 'workflowHistory' | 'customerName' | 'customerPhone' | 'customerEmail' | 'slaBreached' | 'customerId'>
): Promise<CustomerIssue> {
  try {
    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) {
      throw new AppError('مشتری یافت نشد', 404);
    }
    
    // Calculate due date based on priority
    const dueDate = calculateDueDate(issueData.priority);
    
    // Create issue object
    const issue: CustomerIssue = {
      id: generateId(),
      customerId,
      ...issueData,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || undefined,
      dueDate,
      slaBreached: false,
      workflowHistory: [
        {
          id: generateId(),
          action: 'UPDATE',
          performedBy: 'system',
          performedAt: new Date(),
          description: 'مسئله جدید ایجاد شد',
          newStatus: issueData.status
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in database (you would implement actual storage)
    await storeIssue(issue);
    
    // Trigger automated workflows
    await triggerAutomatedWorkflows(issue);
    
    return issue;
  } catch (error) {
    console.error('Error creating customer issue:', error);
    throw new AppError('خطا در ایجاد مسئله مشتری', 500);
  }
}

/**
 * Update issue status and add workflow step
 */
export async function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  performedBy: string,
  description: string,
  resolutionData?: {
    resolutionSummary?: string;
    resolutionSteps?: string[];
    satisfactionRating?: number;
  }
): Promise<CustomerIssue> {
  try {
    const issue = await getIssueById(issueId);
    
    if (!issue) {
      throw new AppError('مسئله یافت نشد', 404);
    }
    
    const previousStatus = issue.status;
    issue.status = newStatus;
    issue.updatedAt = new Date();
    
    // Add workflow step
    const workflowStep: WorkflowStep = {
      id: generateId(),
      action: 'UPDATE',
      performedBy,
      performedAt: new Date(),
      description,
      previousStatus,
      newStatus,
      metadata: resolutionData
    };
    
    issue.workflowHistory.push(workflowStep);
    
    // Set resolution/closure timestamps
    if (newStatus === 'RESOLVED' && !issue.resolvedAt) {
      issue.resolvedAt = new Date();
      issue.resolutionTime = Math.floor((issue.resolvedAt.getTime() - issue.createdAt.getTime()) / (1000 * 60));
    }
    
    if (newStatus === 'CLOSED' && !issue.closedAt) {
      issue.closedAt = new Date();
    }
    
    // Update resolution data
    if (resolutionData) {
      issue.resolutionSummary = resolutionData.resolutionSummary;
      issue.resolutionSteps = resolutionData.resolutionSteps;
      issue.satisfactionRating = resolutionData.satisfactionRating;
    }
    
    // Check SLA breach
    if (issue.dueDate && new Date() > issue.dueDate && !['RESOLVED', 'CLOSED'].includes(newStatus)) {
      issue.slaBreached = true;
    }
    
    // Store updated issue
    await storeIssue(issue);
    
    // Trigger follow-up workflows
    await triggerStatusChangeWorkflows(issue, previousStatus);
    
    return issue;
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw new AppError('خطا در بروزرسانی وضعیت مسئله', 500);
  }
}

/**
 * Assign issue to a user
 */
export async function assignIssue(
  issueId: string,
  assignedTo: string,
  assignedBy: string,
  notes?: string
): Promise<CustomerIssue> {
  try {
    const issue = await getIssueById(issueId);
    
    if (!issue) {
      throw new AppError('مسئله یافت نشد', 404);
    }
    
    const previousAssignee = issue.assignedTo;
    issue.assignedTo = assignedTo;
    issue.assignedBy = assignedBy;
    issue.assignedAt = new Date();
    issue.updatedAt = new Date();
    
    // Add workflow step
    const workflowStep: WorkflowStep = {
      id: generateId(),
      action: 'ASSIGN',
      performedBy: assignedBy,
      performedAt: new Date(),
      description: notes || `مسئله به ${assignedTo} تخصیص یافت`,
      metadata: {
        previousAssignee,
        newAssignee: assignedTo
      }
    };
    
    issue.workflowHistory.push(workflowStep);
    
    // Update status if needed
    if (issue.status === 'OPEN') {
      issue.status = 'IN_PROGRESS';
    }
    
    // Store updated issue
    await storeIssue(issue);
    
    // Notify assigned user
    await notifyAssignedUser(issue, assignedTo);
    
    return issue;
  } catch (error) {
    console.error('Error assigning issue:', error);
    throw new AppError('خطا در تخصیص مسئله', 500);
  }
}

/**
 * Create satisfaction survey
 */
export async function createSatisfactionSurvey(
  customerId: string,
  surveyData: Omit<SatisfactionSurvey, 'id' | 'sentAt' | 'remindersSent' | 'npsScore' | 'satisfactionLevel' | 'customerId'>
): Promise<SatisfactionSurvey> {
  try {
    const survey: SatisfactionSurvey = {
      id: generateId(),
      customerId,
      ...surveyData,
      sentAt: new Date(),
      remindersSent: 0,
      npsScore: calculateNPS(surveyData.ratings.likelihood),
      satisfactionLevel: calculateSatisfactionLevel(surveyData.overallRating)
    };
    
    // Store survey
    await storeSurvey(survey);
    
    // Send survey to customer
    await sendSurveyToCustomer(survey);
    
    return survey;
  } catch (error) {
    console.error('Error creating satisfaction survey:', error);
    throw new AppError('خطا در ایجاد نظرسنجی رضایت', 500);
  }
}

/**
 * Create automated care task
 */
export async function createAutomatedCareTask(
  customerId: string,
  taskData: Omit<AutomatedCareTask, 'id' | 'createdAt' | 'updatedAt' | 'customerId'>
): Promise<AutomatedCareTask> {
  try {
    const task: AutomatedCareTask = {
      id: generateId(),
      customerId,
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store task
    await storeTask(task);
    
    // Schedule task execution
    await scheduleTaskExecution(task);
    
    return task;
  } catch (error) {
    console.error('Error creating automated care task:', error);
    throw new AppError('خطا در ایجاد وظیفه مراقبت خودکار', 500);
  }
}

/**
 * Execute automated care task
 */
export async function executeAutomatedCareTask(taskId: string): Promise<void> {
  try {
    const task = await getTaskById(taskId);
    
    if (!task) {
      throw new AppError('وظیفه یافت نشد', 404);
    }
    
    if (task.status !== 'PENDING') {
      throw new AppError('وظیفه قابل اجرا نیست', 400);
    }
    
    // Update task status
    task.status = 'EXECUTING';
    task.updatedAt = new Date();
    await storeTask(task);
    
    try {
      // Execute task based on type
      let executionResult: string;
      
      switch (task.taskType) {
        case 'FOLLOW_UP':
          executionResult = await executeFollowUpTask(task);
          break;
        case 'BIRTHDAY_GREETING':
          executionResult = await executeBirthdayGreetingTask(task);
          break;
        case 'LOYALTY_REWARD':
          executionResult = await executeLoyaltyRewardTask(task);
          break;
        case 'FEEDBACK_REQUEST':
          executionResult = await executeFeedbackRequestTask(task);
          break;
        case 'REACTIVATION':
          executionResult = await executeReactivationTask(task);
          break;
        case 'SATISFACTION_CHECK':
          executionResult = await executeSatisfactionCheckTask(task);
          break;
        default:
          throw new Error(`نوع وظیفه ناشناخته: ${task.taskType}`);
      }
      
      // Mark as completed
      task.status = 'COMPLETED';
      task.executedAt = new Date();
      task.executionResult = executionResult;
      
    } catch (executionError) {
      // Mark as failed
      task.status = 'FAILED';
      task.executionResult = executionError instanceof Error ? executionError.message : 'خطا در اجرای وظیفه';
    }
    
    task.updatedAt = new Date();
    await storeTask(task);
    
  } catch (error) {
    console.error('Error executing automated care task:', error);
    throw new AppError('خطا در اجرای وظیفه مراقبت خودکار', 500);
  }
}

/**
 * Get service analytics
 */
export async function getServiceAnalytics(
  fromDate?: Date,
  toDate?: Date,
  customerId?: string
): Promise<ServiceAnalytics> {
  try {
    const issues = await getIssues({ fromDate, toDate, customerId });
    const surveys = await getSurveys({ fromDate, toDate, customerId });
    const tasks = await getTasks({ fromDate, toDate, customerId });
    
    // Calculate issue metrics
    const issueMetrics = {
      totalIssues: issues.length,
      openIssues: issues.filter(i => ['OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER'].includes(i.status)).length,
      resolvedIssues: issues.filter(i => i.status === 'RESOLVED').length,
      averageResolutionTime: calculateAverageResolutionTime(issues),
      slaCompliance: calculateSLACompliance(issues),
      issuesByType: groupIssuesByType(issues),
      issuesByPriority: groupIssuesByPriority(issues)
    };
    
    // Calculate satisfaction metrics
    const satisfactionMetrics = {
      averageRating: calculateAverageRating(surveys),
      npsScore: calculateAverageNPS(surveys),
      responseRate: calculateResponseRate(surveys),
      satisfactionDistribution: calculateSatisfactionDistribution(surveys)
    };
    
    // Calculate workflow metrics
    const workflowMetrics = {
      automatedTasksCompleted: tasks.filter(t => t.status === 'COMPLETED').length,
      manualTasksCompleted: 0, // Would be calculated from manual tasks
      taskCompletionRate: calculateTaskCompletionRate(tasks),
      averageTaskTime: calculateAverageTaskTime(tasks)
    };
    
    // Calculate customer retention (would need more complex logic)
    const customerRetention = {
      retentionRate: 85, // Placeholder
      churnRate: 15, // Placeholder
      reactivationRate: 20 // Placeholder
    };
    
    return {
      issueMetrics,
      satisfactionMetrics,
      workflowMetrics,
      customerRetention
    };
  } catch (error) {
    console.error('Error getting service analytics:', error);
    throw new AppError('خطا در دریافت آمار خدمات', 500);
  }
}

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function calculateDueDate(priority: IssuePriority): Date {
  const now = new Date();
  const hours = {
    'URGENT': 2,
    'HIGH': 8,
    'MEDIUM': 24,
    'LOW': 72
  };
  
  return new Date(now.getTime() + hours[priority] * 60 * 60 * 1000);
}

function calculateNPS(likelihood: number): number {
  if (likelihood >= 9) return 100;
  if (likelihood >= 7) return 0;
  return -100;
}

function calculateSatisfactionLevel(rating: number): SatisfactionSurvey['satisfactionLevel'] {
  if (rating >= 4.5) return 'VERY_SATISFIED';
  if (rating >= 3.5) return 'SATISFIED';
  if (rating >= 2.5) return 'NEUTRAL';
  if (rating >= 1.5) return 'DISSATISFIED';
  return 'VERY_DISSATISFIED';
}

function calculateAverageResolutionTime(issues: CustomerIssue[]): number {
  const resolvedIssues = issues.filter(i => i.resolutionTime);
  if (resolvedIssues.length === 0) return 0;
  
  return resolvedIssues.reduce((sum, issue) => sum + (issue.resolutionTime || 0), 0) / resolvedIssues.length;
}

function calculateSLACompliance(issues: CustomerIssue[]): number {
  if (issues.length === 0) return 100;
  
  const compliantIssues = issues.filter(i => !i.slaBreached);
  return (compliantIssues.length / issues.length) * 100;
}

function groupIssuesByType(issues: CustomerIssue[]): Record<IssueType, number> {
  const groups: Record<IssueType, number> = {
    'COMPLAINT': 0,
    'SUGGESTION': 0,
    'COMPLIMENT': 0,
    'SERVICE_REQUEST': 0,
    'PRODUCT_ISSUE': 0,
    'BILLING_ISSUE': 0,
    'TECHNICAL_ISSUE': 0,
    'GENERAL_INQUIRY': 0
  };
  
  issues.forEach(issue => {
    groups[issue.issueType]++;
  });
  
  return groups;
}

function groupIssuesByPriority(issues: CustomerIssue[]): Record<IssuePriority, number> {
  const groups: Record<IssuePriority, number> = {
    'LOW': 0,
    'MEDIUM': 0,
    'HIGH': 0,
    'URGENT': 0
  };
  
  issues.forEach(issue => {
    groups[issue.priority]++;
  });
  
  return groups;
}

function calculateAverageRating(surveys: SatisfactionSurvey[]): number {
  if (surveys.length === 0) return 0;
  
  return surveys.reduce((sum, survey) => sum + survey.overallRating, 0) / surveys.length;
}

function calculateAverageNPS(surveys: SatisfactionSurvey[]): number {
  if (surveys.length === 0) return 0;
  
  return surveys.reduce((sum, survey) => sum + survey.npsScore, 0) / surveys.length;
}

function calculateResponseRate(surveys: SatisfactionSurvey[]): number {
  if (surveys.length === 0) return 0;
  
  const completedSurveys = surveys.filter(s => s.completedAt);
  return (completedSurveys.length / surveys.length) * 100;
}

function calculateSatisfactionDistribution(surveys: SatisfactionSurvey[]): Record<string, number> {
  const distribution: Record<string, number> = {
    'VERY_SATISFIED': 0,
    'SATISFIED': 0,
    'NEUTRAL': 0,
    'DISSATISFIED': 0,
    'VERY_DISSATISFIED': 0
  };
  
  surveys.forEach(survey => {
    distribution[survey.satisfactionLevel]++;
  });
  
  return distribution;
}

function calculateTaskCompletionRate(tasks: AutomatedCareTask[]): number {
  if (tasks.length === 0) return 100;
  
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  return (completedTasks.length / tasks.length) * 100;
}

function calculateAverageTaskTime(tasks: AutomatedCareTask[]): number {
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' && t.executedAt);
  if (completedTasks.length === 0) return 0;
  
  return completedTasks.reduce((sum, task) => {
    const duration = task.executedAt!.getTime() - task.scheduledAt.getTime();
    return sum + duration / (1000 * 60); // Convert to minutes
  }, 0) / completedTasks.length;
}

// Placeholder functions for database operations
async function storeIssue(issue: CustomerIssue): Promise<void> {
  // Implementation would store in database
}

async function getIssueById(id: string): Promise<CustomerIssue | null> {
  // Implementation would fetch from database
  return null;
}

async function getIssues(filters: any): Promise<CustomerIssue[]> {
  // Implementation would fetch from database
  return [];
}

async function storeSurvey(survey: SatisfactionSurvey): Promise<void> {
  // Implementation would store in database
}

async function getSurveys(filters: any): Promise<SatisfactionSurvey[]> {
  // Implementation would fetch from database
  return [];
}

async function storeTask(task: AutomatedCareTask): Promise<void> {
  // Implementation would store in database
}

async function getTaskById(id: string): Promise<AutomatedCareTask | null> {
  // Implementation would fetch from database
  return null;
}

async function getTasks(filters: any): Promise<AutomatedCareTask[]> {
  // Implementation would fetch from database
  return [];
}

async function triggerAutomatedWorkflows(issue: CustomerIssue): Promise<void> {
  // Implementation for triggering workflows
}

async function triggerStatusChangeWorkflows(issue: CustomerIssue, previousStatus: IssueStatus): Promise<void> {
  // Implementation for status change workflows
}

async function notifyAssignedUser(issue: CustomerIssue, assignedTo: string): Promise<void> {
  // Implementation for user notification
}

async function sendSurveyToCustomer(survey: SatisfactionSurvey): Promise<void> {
  // Implementation for sending survey
}

async function scheduleTaskExecution(task: AutomatedCareTask): Promise<void> {
  // Implementation for scheduling task
}

async function executeFollowUpTask(task: AutomatedCareTask): Promise<string> {
  // Implementation for follow-up task
  return 'Follow-up completed successfully';
}

async function executeBirthdayGreetingTask(task: AutomatedCareTask): Promise<string> {
  // Implementation for birthday greeting
  return 'Birthday greeting sent successfully';
}

async function executeLoyaltyRewardTask(task: AutomatedCareTask): Promise<string> {
  // Implementation for loyalty reward
  return 'Loyalty reward processed successfully';
}

async function executeFeedbackRequestTask(task: AutomatedCareTask): Promise<string> {
  // Implementation for feedback request
  return 'Feedback request sent successfully';
}

async function executeReactivationTask(task: AutomatedCareTask): Promise<string> {
  // Implementation for reactivation
  return 'Reactivation message sent successfully';
}

async function executeSatisfactionCheckTask(task: AutomatedCareTask): Promise<string> {
  // Implementation for satisfaction check
  return 'Satisfaction check completed successfully';
} 
