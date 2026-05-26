import { api } from "./api";
import { unwrapList } from "../utils/apiResponse";

export interface SihepiTicket {
  ticket_no?: string;
  wo_no?: string;
  requested_by?: string;
  division?: string;
  department?: string;
  title?: string;
  status?: string;
  scope?: string;
  creation_date?: string;
  priority?: string;
  problem_code?: string;
}

export const integrationApi = {
  getMknTickets: () =>
    api.get("/api/integration/mkn-tickets").then((r) => unwrapList<SihepiTicket>(r)),
};
