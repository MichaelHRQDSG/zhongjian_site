import type {
  EnterpriseAnswerValue,
  EnterpriseOptionFollowUp,
  EnterpriseQuestionInputType,
  EnterpriseQuestionValidation,
} from "@/lib/enterprise-assessments";

export interface OnboardingDynamicQuestion {
  id: string;
  text: string;
  helpText?: string;
  required?: boolean;
  inputType?: EnterpriseQuestionInputType;
  validation?: EnterpriseQuestionValidation;
  options?: Array<{
    id: string;
    text?: string;
    label?: string;
    followUp?: EnterpriseOptionFollowUp;
  }>;
}

export function getOnboardingQuestionInputType(
  question?: OnboardingDynamicQuestion | null,
): EnterpriseQuestionInputType {
  return question?.inputType || "choice";
}

export function isOnboardingQuestionRequired(
  question?: OnboardingDynamicQuestion | null,
): boolean {
  return question?.required !== false;
}

export function selectedOnboardingOptionId(
  answer: unknown,
): string | number | undefined {
  if (typeof answer === "string" || typeof answer === "number") return answer;
  if (
    answer &&
    typeof answer === "object" &&
    "optionId" in answer &&
    typeof (answer as { optionId?: unknown }).optionId === "string"
  ) {
    return (answer as { optionId: string }).optionId;
  }
  return undefined;
}

export function onboardingFollowUpValue(
  answer: unknown,
): string | number | undefined {
  if (answer && typeof answer === "object" && "optionId" in answer) {
    const raw = (answer as { followUp?: unknown }).followUp;
    if (typeof raw === "string" || typeof raw === "number") return raw;
  }
  return undefined;
}

function validText(
  value: unknown,
  validation?: EnterpriseQuestionValidation,
): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  if (
    validation?.minLength != null &&
    value.length < Number(validation.minLength)
  ) {
    return false;
  }
  if (
    validation?.maxLength != null &&
    value.length > Number(validation.maxLength)
  ) {
    return false;
  }
  return true;
}

function validNumber(
  value: unknown,
  validation?: EnterpriseQuestionValidation,
): boolean {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (validation?.min != null && value < Number(validation.min)) return false;
  if (validation?.max != null && value > Number(validation.max)) return false;
  return true;
}

export function isDynamicQuestionAnswered(
  question: OnboardingDynamicQuestion,
  answer: unknown,
): boolean {
  if (answer == null || answer === "") return false;
  const inputType = getOnboardingQuestionInputType(question);
  if (inputType === "text") {
    return (
      typeof answer === "object" &&
      "text" in (answer as Record<string, unknown>) &&
      validText((answer as { text?: unknown }).text, question.validation)
    );
  }
  if (inputType === "number") {
    return (
      typeof answer === "object" &&
      "number" in (answer as Record<string, unknown>) &&
      validNumber((answer as { number?: unknown }).number, question.validation)
    );
  }

  const options = Array.isArray(question.options) ? question.options : [];
  if (typeof answer === "string") {
    const option = options.find((item) => item.id === answer);
    return Boolean(option) && !option?.followUp?.required;
  }
  if (typeof answer === "object" && "optionId" in (answer as Record<string, unknown>)) {
    const optionId = (answer as { optionId?: unknown }).optionId;
    if (typeof optionId !== "string") return false;
    const option = options.find((item) => item.id === optionId);
    if (!option) return false;
    if (!option.followUp) return true;
    const followUp = (answer as { followUp?: unknown }).followUp;
    if (followUp == null || followUp === "") {
      return !option.followUp.required;
    }
    if (option.followUp.inputType === "text") {
      return validText(followUp, option.followUp.validation);
    }
    return validNumber(followUp, option.followUp.validation);
  }
  return false;
}

export function serializeDynamicQuestionAnswer(
  question: OnboardingDynamicQuestion,
  answer: unknown,
): EnterpriseAnswerValue | undefined {
  if (!isDynamicQuestionAnswered(question, answer)) return undefined;
  const inputType = getOnboardingQuestionInputType(question);
  if (inputType === "text") {
    return { text: String((answer as { text: string }).text) };
  }
  if (inputType === "number") {
    return { number: Number((answer as { number: number }).number) };
  }
  const options = Array.isArray(question.options) ? question.options : [];
  if (typeof answer === "string") {
    const option = options.find((item) => item.id === answer);
    if (option?.followUp) return { optionId: answer };
    return answer;
  }
  const optionId = String((answer as { optionId: string }).optionId);
  const option = options.find((item) => item.id === optionId);
  if (!option?.followUp) return optionId;
  const followUp = (answer as { followUp?: unknown }).followUp;
  if (followUp == null || followUp === "") return { optionId };
  return {
    optionId,
    followUp:
      option.followUp.inputType === "number"
        ? Number(followUp)
        : String(followUp),
  };
}
