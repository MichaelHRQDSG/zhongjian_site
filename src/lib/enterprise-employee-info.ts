/** 企业站员工基本信息：完整性判断与空表单。 */

export const DEFAULT_EMPLOYEE_INFO_REQUIRED = [
  "empNo",
  "name",
  "gender",
  "age",
  "dept",
  "post",
  "category",
  "workLoc",
] as const;

export const EMPTY_EMPLOYEE_INFO_FORM = {
  empNo: "",
  name: "",
  gender: "",
  age: "",
  edu: "",
  dept: "",
  post: "",
  category: "",
  workLoc: "",
  joinDate: "",
  livingStatus: "",
  hasFamily: "",
};

export function requiredEmployeeInfoFields(visibleFields?: string[] | null): string[] {
  const shown =
    Array.isArray(visibleFields) && visibleFields.length > 0
      ? visibleFields.map(String)
      : [...DEFAULT_EMPLOYEE_INFO_REQUIRED];
  const shownSet = new Set(shown);
  return DEFAULT_EMPLOYEE_INFO_REQUIRED.filter((id) => shownSet.has(id));
}

/** 必填项都有值时视为已完成首次填写。 */
export function isEmployeeInfoComplete(
  form: Record<string, unknown> | null | undefined,
  visibleFields?: string[] | null,
): boolean {
  if (!form || typeof form !== "object") return false;
  return requiredEmployeeInfoFields(visibleFields).every((key) => {
    const value = form[key];
    return value != null && String(value).trim() !== "";
  });
}
