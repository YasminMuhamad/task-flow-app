import { getMillis } from "./date";

export const getAttachmentConfig = (typeStr?: string, fileName?: string) => {
  const ext = (typeStr || fileName?.split(".").pop() || "").toLowerCase();
  if (["pdf", "txt", "doc", "docx", "file"].includes(ext)) {
    return { icon: "📄", color: "#FEE2E2" };
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "image"].includes(ext)) {
    return { icon: "🖼️", color: "#C5D5E4" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { icon: "📦", color: "#FEF08A" };
  }
  return { icon: "📎", color: "#E2E8F0" };
};

export const formatDate = (dateInput: any) => {
  const millis = getMillis(dateInput);
  if (!millis) return "N/A";
  return new Date(millis).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (dateInput: any) => {
  const millis = getMillis(dateInput);
  if (!millis) return "";
  return new Date(millis).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};