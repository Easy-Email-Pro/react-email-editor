import axios from "axios";
import { EmailTemplate } from "easy-email-pro-editor";

const WEBSITE_TEMPLATE_API_BASE = "https://www.easyemail.pro/api/templates";

type WebsiteTemplateResponse = {
  data: EmailTemplate;
};

export async function fetchWebsiteTemplateInitialValues(templateId: string) {
  const { data: response } = await axios.get<WebsiteTemplateResponse>(
    `${WEBSITE_TEMPLATE_API_BASE}/${encodeURIComponent(templateId)}`
  );

  return response.data;
}
